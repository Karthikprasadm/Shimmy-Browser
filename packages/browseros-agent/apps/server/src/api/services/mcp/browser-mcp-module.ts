/**
 * @license
 * Copyright 2025 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { BrowserSession } from '@browseros/browser-core/core/session'
import { createBrowserMcpServer } from '@browseros/browser-mcp/mcp-server'
import type { BrowserOutputFileAccess } from '@browseros/browser-mcp/output-file'
import { BROWSER_TOOLS } from '@browseros/browser-mcp/registry'
import type {
  ToolContext,
  ToolDefinition,
} from '@browseros/browser-mcp/tools/framework'
import { tabs } from '@browseros/browser-mcp/tools/tabs'
import type { BrowserContext } from '@browseros/shared/schemas/browser-context'
import { z } from 'zod/v4'
import { logger } from '../../../lib/logger'
import { shouldLogToolRegistration } from '../../../tools/registration-log-sampling'
import type { ConversationRuns } from '../conversation-runs'
import type { KlavisService } from '../klavis'
import type { ServerActivity } from '../server-activity'
import { dispatchBrowserTool } from './browser-tool-dispatch'
import { ConversationTabGroups } from './conversation-tab-groups'
import { MCP_INSTRUCTIONS } from './mcp-prompt'

export { BROWSEROS_TOOL_LEASE_HEADER } from '../../../lib/browser-tool-lease'

export const DEFAULT_LEASE_INACTIVITY_TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface BrowserMcpModuleDeps {
  version: string
  browserSession: BrowserSession
  conversationRuns: Pick<ConversationRuns, 'activeRun'>
  klavis?: KlavisService
  activity?: ServerActivity
  tabGroups?: Pick<ConversationTabGroups, 'addCreatedPages'>
  leaseInactivityTtlMs?: number
}

export interface BrowserToolLeaseInput {
  conversationId: string
  readOnly: boolean
  outputFileAccess: BrowserOutputFileAccess
  browserContext?: BrowserContext
  source?: string
  inactivityTtlMs?: number
}

/**
 * Durable capability for one conversation. Run authority is deliberately not
 * stored here; each MCP call resolves and pins the canonical active run.
 */
export interface BrowserToolLease {
  readonly token: string
  updateBrowserContext(browserContext: BrowserContext | undefined): void
  touch?(): void
  revoke(): void | Promise<void>
}

export interface CreateBrowserMcpServerInput {
  leaseToken?: string
  requestedReadOnly?: boolean
  includeStructuredContent?: boolean
}

interface LeaseRecord extends BrowserToolLeaseInput {
  token: string
  createdPageIds: Set<number>
  createdTargetIds: Set<string>
  lastActivityAt: number
  inactivityTimer?: ReturnType<typeof setTimeout>
  touch(): void
  recordCreatedPage(pageId: number): void
  recordClosedPage(pageId: number): void
  recordCreatedTarget(targetId: string): void
}

const readOnlyTabs: ToolDefinition = {
  ...tabs,
  description:
    'Inspect browser tabs. `list` returns every open page and `active` returns the front page. Read-only mode cannot open or close tabs.',
  input: z
    .object({ action: z.enum(['list', 'active']).default('list') })
    .strict(),
  annotations: {
    ...tabs.annotations,
    readOnlyHint: true,
    destructiveHint: false,
  },
}

const READ_ONLY_BROWSER_TOOLS: readonly ToolDefinition[] = [
  readOnlyTabs,
  ...BROWSER_TOOLS.filter(
    (tool) => tool.name !== 'tabs' && tool.annotations?.readOnlyHint,
  ),
]

export class InvalidBrowserToolLeaseError extends Error {
  constructor() {
    super('Invalid or expired BrowserOS tool lease')
    this.name = 'InvalidBrowserToolLeaseError'
  }
}

/**
 * Deep server module behind `/mcp`: it owns leases, catalogue policy, ordered
 * dispatch, output grants, panel effects, and tab grouping. HTTP remains a thin
 * protocol adapter and both native and ACP agents use this one production path.
 */
export class BrowserMcpModule {
  private readonly leases = new Map<string, LeaseRecord>()
  private readonly tabGroups: Pick<ConversationTabGroups, 'addCreatedPages'>
  private readonly defaultInactivityTtlMs: number

  constructor(private readonly deps: BrowserMcpModuleDeps) {
    this.tabGroups =
      deps.tabGroups ?? new ConversationTabGroups(deps.browserSession)
    this.defaultInactivityTtlMs =
      deps.leaseInactivityTtlMs ?? DEFAULT_LEASE_INACTIVITY_TTL_MS
  }

  createLease(input: BrowserToolLeaseInput): BrowserToolLease {
    const sessionPages = this.deps.browserSession.pages
    const ttl = input.inactivityTtlMs ?? this.defaultInactivityTtlMs

    const record: LeaseRecord = {
      ...input,
      token: crypto.randomUUID(),
      createdPageIds: new Set<number>(),
      createdTargetIds: new Set<string>(),
      lastActivityAt: Date.now(),
      inactivityTimer: undefined,
      touch: () => {
        record.lastActivityAt = Date.now()
        if (record.inactivityTimer) {
          clearTimeout(record.inactivityTimer)
          record.inactivityTimer = undefined
        }
        if (ttl > 0 && Number.isFinite(ttl)) {
          const timer = setTimeout(() => {
            void this.expireLease(record)
          }, ttl)
          timer.unref?.()
          record.inactivityTimer = timer
        }
      },
      recordCreatedPage: (pageId: number) => {
        record.touch()
        record.createdPageIds.add(pageId)
        const info = sessionPages?.getInfo?.(pageId)
        if (info?.targetId) {
          record.createdTargetIds.add(info.targetId)
        }
      },
      recordClosedPage: (pageId: number) => {
        record.touch()
        record.createdPageIds.delete(pageId)
      },
      recordCreatedTarget: (targetId: string) => {
        record.touch()
        record.createdTargetIds.add(targetId)
      },
    }

    record.touch()
    this.leases.set(record.token, record)

    return {
      token: record.token,
      updateBrowserContext: (browserContext) => {
        if (this.leases.get(record.token) === record) {
          record.touch()
          record.browserContext = browserContext
        }
      },
      touch: () => {
        if (this.leases.get(record.token) === record) {
          record.touch()
        }
      },
      // Revocation prevents new transports from recovering this capability.
      // Cleanly closes any dangling DevTools CDP targets and pages opened under this lease.
      revoke: async () => {
        if (this.leases.get(record.token) === record) {
          this.leases.delete(record.token)
        }
        if (record.inactivityTimer) {
          clearTimeout(record.inactivityTimer)
          record.inactivityTimer = undefined
        }
        await this.cleanupLeaseTargets(record)
      },
    }
  }

  private async expireLease(record: LeaseRecord): Promise<void> {
    if (this.leases.get(record.token) !== record) {
      return
    }
    if (record.inactivityTimer) {
      clearTimeout(record.inactivityTimer)
      record.inactivityTimer = undefined
    }
    this.leases.delete(record.token)
    logger.info(
      'Browser tool lease expired due to inactivity; cleaning up targets',
      {
        token: record.token,
        conversationId: record.conversationId,
        createdPages: record.createdPageIds.size,
        createdTargets: record.createdTargetIds.size,
      },
    )
    await this.cleanupLeaseTargets(record)
  }

  private async cleanupLeaseTargets(record: LeaseRecord): Promise<void> {
    const pageIds = Array.from(record.createdPageIds)
    const targetIds = Array.from(record.createdTargetIds)

    for (const pageId of pageIds) {
      try {
        const info = this.deps.browserSession.pages?.getInfo?.(pageId)
        if (info?.targetId) {
          targetIds.push(info.targetId)
        }
        if (typeof this.deps.browserSession.pages?.close === 'function') {
          await this.deps.browserSession.pages.close(pageId)
        }
      } catch (error) {
        logger.debug(
          'Failed to close lease page during revocation (may already be closed)',
          {
            pageId,
            error: error instanceof Error ? error.message : String(error),
          },
        )
      }
    }

    const uniqueTargetIds = Array.from(new Set(targetIds))
    const targetApi = this.deps.browserSession.protocol?.Target
    if (targetApi && typeof targetApi.closeTarget === 'function') {
      for (const targetId of uniqueTargetIds) {
        try {
          await targetApi.closeTarget({ targetId })
        } catch (error) {
          logger.debug(
            'Failed to close CDP target during revocation (may already be closed)',
            {
              targetId,
              error: error instanceof Error ? error.message : String(error),
            },
          )
        }
      }
    }

    record.createdPageIds.clear()
    record.createdTargetIds.clear()
  }

  /** Validates transport admission; tool dispatch never rechecks this token. */
  validateLeaseToken(token: string): void {
    const lease = this.leases.get(token)
    if (!lease) throw new InvalidBrowserToolLeaseError()
    lease.touch()
  }

  /** Number of active leases currently tracked in memory. */
  getActiveLeaseCount(): number {
    return this.leases.size
  }

  /** Clears and cleans up all tracked leases (e.g. on server shutdown). */
  async destroy(): Promise<void> {
    const records = Array.from(this.leases.values())
    this.leases.clear()
    for (const record of records) {
      if (record.inactivityTimer) {
        clearTimeout(record.inactivityTimer)
        record.inactivityTimer = undefined
      }
    }
    await Promise.allSettled(records.map((r) => this.cleanupLeaseTargets(r)))
  }

  createMcpServer(input: CreateBrowserMcpServerInput = {}) {
    const lease = input.leaseToken
      ? this.leases.get(input.leaseToken)
      : undefined
    if (input.leaseToken && !lease) throw new InvalidBrowserToolLeaseError()
    lease?.touch()

    // The query may further restrict a caller but can never weaken a lease.
    const readOnly = Boolean(lease?.readOnly || input.requestedReadOnly)
    const source = lease?.source ?? 'mcp'
    const tools = readOnly ? READ_ONLY_BROWSER_TOOLS : BROWSER_TOOLS
    const selectedServerNames = lease?.browserContext?.enabledMcpServers ?? []

    const server = createBrowserMcpServer({
      name: 'browseros_mcp',
      title: 'BrowserOS MCP server',
      version: this.deps.version,
      browserSession: this.deps.browserSession,
      defaultWindowId: lease?.browserContext?.windowId,
      instructions: MCP_INSTRUCTIONS,
      registration: {
        tools,
        includeStructuredContent: input.includeStructuredContent ?? false,
        sessionIdentity: !lease,
        executor: (tool, args, context) =>
          this.execute(lease, readOnly, source, tool, args, context),
        logger,
        onToolExecutionStart: () => this.deps.activity?.beginMcpToolExecution(),
        onToolExecutionEnd: () => this.deps.activity?.endMcpToolExecution(),
        shouldLogToolRegistration,
        source,
      },
    })

    this.deps.klavis?.registerMcpTools(
      server,
      { selectedServerNames },
      {
        // Managed connectors bypass the browser executor, so repeat the two
        // endpoint-wide guards at that protocol seam.
        authorizeCall: () => {
          if (
            lease &&
            !this.deps.conversationRuns.activeRun(lease.conversationId)
          ) {
            return 'MCP tools require an active conversation run.'
          }
          if (readOnly) {
            return 'Managed connector tools are unavailable in read-only mode.'
          }
          return undefined
        },
      },
    )
    return server
  }

  private async execute(
    lease: LeaseRecord | undefined,
    readOnly: boolean,
    source: string,
    tool: ToolDefinition,
    args: Record<string, unknown>,
    context: ToolContext,
  ) {
    lease?.touch()
    // Resolve once and carry this exact handle through execution. If another
    // turn starts before effects run, its record-identity check rejects them.
    const run = lease
      ? this.deps.conversationRuns.activeRun(lease.conversationId)
      : undefined
    return await dispatchBrowserTool({
      tool,
      args,
      context,
      lease,
      run,
      readOnly,
      source,
      tabGroups: this.tabGroups,
    })
  }
}
