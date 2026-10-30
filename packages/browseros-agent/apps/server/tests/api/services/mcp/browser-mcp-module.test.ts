import { describe, expect, it, mock } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { BrowserSession } from '@browseros/browser-core/core/session'
import { createBrowserOutputFileAccess } from '@browseros/browser-mcp/output-file'
import { TOOL_LIMITS } from '@browseros/shared/constants/limits'
import type { ActiveConversationRun } from '../../../../src/api/services/conversation-runs'
import { KlavisService } from '../../../../src/api/services/klavis/service'
import {
  BrowserMcpModule,
  DEFAULT_LEASE_INACTIVITY_TTL_MS,
  InvalidBrowserToolLeaseError,
} from '../../../../src/api/services/mcp/browser-mcp-module'
import { createReadTool } from '../../../../src/tools/filesystem/read'

type RegisteredTool = {
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text?: string }>
    isError?: boolean
    structuredContent?: unknown
  }>
}

type InspectableMcpServer = {
  _registeredTools: Record<string, RegisteredTool>
}

function inspect(server: unknown): InspectableMcpServer {
  return server as InspectableMcpServer
}

function browserSession(): BrowserSession {
  const pages = [
    {
      pageId: 1,
      targetId: 'target-1',
      tabId: 101,
      url: 'https://example.com',
      title: 'Example',
      isActive: true,
      isLoading: false,
      loadProgress: 1,
      isPinned: false,
      windowId: 7,
    },
  ]

  const closePageMock = mock(async (pageId: number) => {
    const idx = pages.findIndex((page) => page.pageId === pageId)
    if (idx >= 0) pages.splice(idx, 1)
  })

  const closeTargetMock = mock(async (_params: { targetId: string }) => ({
    success: true,
  }))

  return {
    pages: {
      list: async () => [...pages],
      getActive: async () => pages[0],
      getInfo: (pageId: number) => pages.find((page) => page.pageId === pageId),
      getTabId: (pageId: number) =>
        pages.find((page) => page.pageId === pageId)?.tabId,
      newPage: async (url: string) => {
        pages.push({
          ...pages[0],
          pageId: 2,
          targetId: 'target-2',
          tabId: 102,
          url,
          title: 'New',
          isActive: false,
        })
        return 2
      },
      close: closePageMock,
    },
    protocol: {
      Target: {
        closeTarget: closeTargetMock,
      },
    },
    nav: (_pageId: number) => ({
      reload: async () => undefined,
    }),
  } as unknown as BrowserSession
}

describe('BrowserMcpModule', () => {
  it('treats a read-only lease as an authoritative permission ceiling', async () => {
    const { browserMcp: runtime, runs } = moduleFixture()
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: true,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'read-only-run')

    const server = inspect(
      runtime.createMcpServer({
        leaseToken: lease.token,
        requestedReadOnly: false,
      }),
    )

    expect(Object.keys(server._registeredTools).sort()).toEqual([
      'diff',
      'grep',
      'history',
      'pdf',
      'read',
      'screenshot',
      'snapshot',
      'tabs',
      'wait',
    ])

    const result = await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com',
    })

    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('read-only')
  })

  it('lets an external MCP client request the same read-only surface', () => {
    const { browserMcp: runtime } = moduleFixture()

    const server = inspect(runtime.createMcpServer({ requestedReadOnly: true }))

    expect(Object.keys(server._registeredTools)).not.toContain('navigate')
    expect(Object.keys(server._registeredTools)).toContain('tabs')
  })

  it('does not bind user tabs from tabs list or active', async () => {
    const conversationId = crypto.randomUUID()
    const { browserMcp: runtime, runs } = moduleFixture()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'run-1')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({ action: 'list' })
    expect(runs.associated).toEqual([])

    await server._registeredTools.tabs.handler({ action: 'active' })
    expect(runs.associated).toEqual([])
  })

  it('does not replace conversations on tabs merely touched by a script', async () => {
    const conversationId = crypto.randomUUID()
    const { browserMcp: runtime, runs } = moduleFixture()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'run-2')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.run.handler({
      code: 'await browser.nav(1).reload(); return "done"',
    })

    expect(runs.associated).toEqual([])
  })

  it('publishes a created tab before tool completion even if loading later fails', async () => {
    const session = browserSession()
    let release!: () => void
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    let created!: () => void
    const announced = new Promise<void>((resolve) => {
      created = resolve
    })
    session.pages.newPage = async (_url, options) => {
      options?.onCreated?.(102)
      created()
      await blocked
      throw new Error('page load failed after creation')
    }
    const conversationId = crypto.randomUUID()
    const { browserMcp, runs } = moduleFixture({ session })
    runs.start(conversationId, 'early')
    const lease = browserMcp.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    const server = inspect(
      browserMcp.createMcpServer({ leaseToken: lease.token }),
    )
    const executing = server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://example.com',
    })
    await announced
    expect(runs.associated).toEqual([
      { conversationId, runId: 'early', tabIds: [102] },
    ])
    release()
    expect((await executing).isError).toBe(true)
    expect(runs.associated).toHaveLength(1)
  })

  it('groups the first tab created by an agent call', async () => {
    const conversationId = crypto.randomUUID()
    const { addCreatedPages, browserMcp: runtime, runs } = moduleFixture()
    const run = runs.start(conversationId, 'group-run')
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com',
    })

    expect(addCreatedPages).toHaveBeenCalledTimes(1)
    expect(addCreatedPages).toHaveBeenCalledWith(run, [2])
  })

  it('attributes a late tool effect to the run that authorized the call', async () => {
    let finishReload!: () => void
    const reloadBlocked = new Promise<void>((resolve) => {
      finishReload = resolve
    })
    const session = browserSession()
    session.nav = () =>
      ({
        reload: async () => await reloadBlocked,
      }) as ReturnType<BrowserSession['nav']>
    const conversationId = crypto.randomUUID()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'run-a')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    const execution = server._registeredTools.run.handler({
      code: 'await browser.nav(1).reload(); return "done"',
    })
    await Promise.resolve()
    runs.start(conversationId, 'run-b')
    finishReload()
    await execution

    expect(runs.associated).toEqual([])
  })

  it('rejects stale internal lease tokens instead of falling back to full access', () => {
    const { browserMcp: runtime } = moduleFixture()

    expect(() =>
      runtime.createMcpServer({ leaseToken: 'stale-token' }),
    ).toThrow('Invalid or expired BrowserOS tool lease')
  })

  it('does not add a per-call lease-liveness guard', async () => {
    const { browserMcp: runtime, runs } = moduleFixture()
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'revoked-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    lease.revoke()
    const result = await server._registeredTools.tabs.handler({
      action: 'active',
    })

    expect(result.isError).toBeUndefined()
    expect(() => runtime.createMcpServer({ leaseToken: lease.token })).toThrow(
      'Invalid or expired BrowserOS tool lease',
    )
  })

  it('does not execute through a valid lease outside its active run', async () => {
    const { browserMcp: runtime } = moduleFixture()
    const lease = runtime.createLease({
      conversationId: crypto.randomUUID(),
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    const result = await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com',
    })

    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('active conversation run')
  })

  it('applies conversation-running and read-only guards to managed connectors', async () => {
    const getUserIntegrations = mock(async () => [])
    const { browserMcp: runtime, runs } = moduleFixture({
      klavis: new KlavisService({
        browserosId: 'browseros-test',
        client: { getUserIntegrations } as never,
      }),
    })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    const inactive =
      await server._registeredTools.connector_mcp_servers.handler({})
    expect(inactive.isError).toBe(true)
    expect(getUserIntegrations).not.toHaveBeenCalled()

    runs.start(conversationId, 'connector-run')
    const active = await server._registeredTools.connector_mcp_servers.handler(
      {},
    )
    expect(active.isError).toBeUndefined()
    expect(getUserIntegrations).toHaveBeenCalledTimes(1)

    runs.finish(conversationId)
    const finished =
      await server._registeredTools.connector_mcp_servers.handler({})
    expect(finished.isError).toBe(true)
    expect(getUserIntegrations).toHaveBeenCalledTimes(1)

    const readOnlyConversationId = crypto.randomUUID()
    const readOnlyLease = runtime.createLease({
      conversationId: readOnlyConversationId,
      readOnly: true,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(readOnlyConversationId, 'read-only-connector-run')
    const readOnlyServer = inspect(
      runtime.createMcpServer({ leaseToken: readOnlyLease.token }),
    )
    const readOnly =
      await readOnlyServer._registeredTools.connector_mcp_servers.handler({})
    expect(readOnly.isError).toBe(true)
    expect(readOnly.content[0]?.text).toContain('read-only')
    expect(getUserIntegrations).toHaveBeenCalledTimes(1)
  })

  it('refreshes mutable browser context without replacing the agent lease', async () => {
    let openedInWindow: number | undefined
    const session = browserSession()
    session.pages.newPage = async (_url, options) => {
      openedInWindow = options?.windowId
      return 2
    }
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      browserContext: { windowId: 1 },
    })

    lease.updateBrowserContext({ windowId: 22 })
    runs.start(conversationId, 'context-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))
    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com',
    })

    expect(openedInWindow).toBe(22)
  })

  it('grants filesystem readback for output created through loopback MCP', async () => {
    const browserosDir = mkdtempSync(join(tmpdir(), 'browser-mcp-module-'))
    const previousBrowserosDir = process.env.BROWSEROS_DIR
    process.env.BROWSEROS_DIR = browserosDir
    try {
      const largeText = 'x'.repeat(
        TOOL_LIMITS.INLINE_PAGE_CONTENT_MAX_CHARS + 1,
      )
      const session = {
        pages: {
          getSession: async () => ({
            session: {
              Runtime: {
                evaluate: async () => ({ result: { value: largeText } }),
              },
            },
          }),
          getInfo: () => ({ url: 'https://example.com' }),
          getTabId: () => 101,
        },
      } as unknown as BrowserSession
      const outputFileAccess = createBrowserOutputFileAccess()
      const { browserMcp: runtime, runs } = moduleFixture({ session })
      const conversationId = crypto.randomUUID()
      const lease = runtime.createLease({
        conversationId,
        readOnly: false,
        outputFileAccess,
      })
      runs.start(conversationId, 'output-run')
      const server = inspect(
        runtime.createMcpServer({ leaseToken: lease.token }),
      )

      const result = await server._registeredTools.read.handler({
        page: 1,
        format: 'text',
      })
      const text = result.content.map((item) => item.text ?? '').join('\n')
      const savedPath = text.match(/saved to: (.+\.txt)/)?.[1]
      expect(savedPath).toBeTruthy()
      expect(outputFileAccess.paths.has(savedPath ?? '')).toBe(true)

      const filesystemRead = createReadTool(undefined, {
        allowedOutputPaths: outputFileAccess.paths,
      }) as unknown as {
        execute(input: { path: string }): Promise<{ text: string }>
      }
      const readback = await filesystemRead.execute({ path: savedPath ?? '' })
      expect(readback.text).toContain('x'.repeat(100))
    } finally {
      if (previousBrowserosDir === undefined) {
        delete process.env.BROWSEROS_DIR
      } else {
        process.env.BROWSEROS_DIR = previousBrowserosDir
      }
      rmSync(browserosDir, { recursive: true, force: true })
    }
  })

  it('grants filesystem readback for downloads created through loopback MCP', async () => {
    const browserosDir = mkdtempSync(join(tmpdir(), 'browser-tool-download-'))
    const previousBrowserosDir = process.env.BROWSEROS_DIR
    process.env.BROWSEROS_DIR = browserosDir
    try {
      let downloadDir = ''
      type DownloadHandler = (params: Record<string, unknown>) => void
      const handlers: Record<string, DownloadHandler> = {}
      const session = {
        input: () => ({
          click: async () => {
            writeFileSync(
              join(downloadDir, 'report.csv'),
              'name,value\nneo,1\n',
            )
            handlers.downloadWillBegin?.({
              guid: 'download-1',
              suggestedFilename: 'report.csv',
            })
            handlers.downloadProgress?.({
              guid: 'download-1',
              state: 'completed',
            })
          },
        }),
        pages: {
          getSession: async () => ({
            session: {
              Page: {
                setDownloadBehavior: async (params: {
                  downloadPath?: string
                }) => {
                  if (params.downloadPath) downloadDir = params.downloadPath
                },
                on: (event: string, handler: DownloadHandler) => {
                  handlers[event] = handler
                  return () => {
                    delete handlers[event]
                  }
                },
              },
            },
          }),
          getInfo: () => ({ url: 'https://example.com' }),
          getTabId: () => 101,
        },
      } as unknown as BrowserSession
      const outputFileAccess = createBrowserOutputFileAccess()
      const { browserMcp: runtime, runs } = moduleFixture({ session })
      const conversationId = crypto.randomUUID()
      const lease = runtime.createLease({
        conversationId,
        readOnly: false,
        outputFileAccess,
      })
      runs.start(conversationId, 'download-run')
      const server = inspect(
        runtime.createMcpServer({ leaseToken: lease.token }),
      )

      const result = await server._registeredTools.download.handler({
        page: 1,
        ref: 'e12',
      })
      const text = result.content.map((item) => item.text ?? '').join('\n')
      const savedPath = text.match(/to: (.+report\.csv)/)?.[1]
      expect(savedPath).toBeTruthy()
      expect(outputFileAccess.paths.has(savedPath ?? '')).toBe(true)

      const filesystemRead = createReadTool(undefined, {
        allowedOutputPaths: outputFileAccess.paths,
      }) as unknown as {
        execute(input: { path: string }): Promise<{ text: string }>
      }
      const readback = await filesystemRead.execute({ path: savedPath ?? '' })
      expect(readback.text).toContain('neo,1')
    } finally {
      if (previousBrowserosDir === undefined) {
        delete process.env.BROWSEROS_DIR
      } else {
        process.env.BROWSEROS_DIR = previousBrowserosDir
      }
      rmSync(browserosDir, { recursive: true, force: true })
    }
  })

  it('cleanly closes dangling DevTools CDP targets and pages when a lease is revoked', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'cleanup-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/target-test',
    })

    expect((await session.pages.list()).some((p) => p.pageId === 2)).toBe(true)

    await lease.revoke()

    expect(session.pages.close).toHaveBeenCalledWith(2)
    expect(
      (
        session as unknown as {
          protocol: { Target: { closeTarget: ReturnType<typeof mock> } }
        }
      ).protocol.Target.closeTarget,
    ).toHaveBeenCalledWith({ targetId: 'target-2' })
    expect(session.pages.close).not.toHaveBeenCalledWith(1)
    expect((await session.pages.list()).some((p) => p.pageId === 1)).toBe(true)
  })

  it('does not re-close pages that were already explicitly closed before revocation', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'explicit-close-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/target-test',
    })

    await server._registeredTools.tabs.handler({
      action: 'close',
      page: 2,
    })

    expect(session.pages.close).toHaveBeenCalledTimes(1)
    expect(session.pages.close).toHaveBeenCalledWith(2)

    await lease.revoke()
    expect(session.pages.close).toHaveBeenCalledTimes(1)
  })

  it('tracks and closes targets created via raw CDP calls', async () => {
    const session = browserSession()
    session.cdp = mock(async (method: string) => {
      if (method === 'Target.createTarget') {
        return { targetId: 'cdp-target-99' }
      }
      return {}
    })
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
    })
    runs.start(conversationId, 'raw-cdp-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.run.handler({
      code: 'await browser.cdp("Target.createTarget", { url: "https://example.com" }); return "created"',
    })

    await lease.revoke()

    expect(
      (
        session as unknown as {
          protocol: { Target: { closeTarget: ReturnType<typeof mock> } }
        }
      ).protocol.Target.closeTarget,
    ).toHaveBeenCalledWith({ targetId: 'cdp-target-99' })
  })

  it('exposes a default 30-minute inactivity TTL constant', () => {
    expect(DEFAULT_LEASE_INACTIVITY_TTL_MS).toBe(30 * 60 * 1000)
  })

  it('automatically cleans up targets and expires orphaned leases after inactivity TTL', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      inactivityTtlMs: 40,
    })
    runs.start(conversationId, 'inactivity-cleanup-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/orphaned-test',
    })

    expect((await session.pages.list()).some((p) => p.pageId === 2)).toBe(true)
    expect(runtime.getActiveLeaseCount()).toBe(1)

    // Wait for the 40ms inactivity TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 65))

    expect(session.pages.close).toHaveBeenCalledWith(2)
    expect(runtime.getActiveLeaseCount()).toBe(0)
    expect(() => runtime.validateLeaseToken(lease.token)).toThrow(
      InvalidBrowserToolLeaseError,
    )
  })

  it('refreshes inactivity TTL when tool dispatch or MCP calls occur', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      inactivityTtlMs: 80,
    })
    runs.start(conversationId, 'ttl-refresh-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/refresh-test',
    })

    // At 40ms, perform another tool call to refresh the lease TTL
    await new Promise((resolve) => setTimeout(resolve, 40))
    await server._registeredTools.tabs.handler({ action: 'list' })

    // At 90ms (50ms after refresh, but 90ms after initial creation), the lease should still be alive
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(runtime.getActiveLeaseCount()).toBe(1)
    expect(session.pages.close).not.toHaveBeenCalled()

    // At 150ms (60ms more, 110ms after last refresh), the lease should now have expired
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(runtime.getActiveLeaseCount()).toBe(0)
    expect(session.pages.close).toHaveBeenCalledWith(2)
  })

  it('cancels inactivity timer and cleans up targets when lease is explicitly revoked', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId = crypto.randomUUID()
    const lease = runtime.createLease({
      conversationId,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      inactivityTtlMs: 80,
    })
    runs.start(conversationId, 'explicit-revoke-run')
    const server = inspect(runtime.createMcpServer({ leaseToken: lease.token }))

    await server._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/revoke-test',
    })

    await lease.revoke()
    expect(session.pages.close).toHaveBeenCalledTimes(1)
    expect(session.pages.close).toHaveBeenCalledWith(2)
    expect(runtime.getActiveLeaseCount()).toBe(0)

    // Wait past the original TTL to verify cleanup is not called again
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(session.pages.close).toHaveBeenCalledTimes(1)
  })

  it('destroy() cleans up all tracked leases and cancels timers', async () => {
    const session = browserSession()
    const { browserMcp: runtime, runs } = moduleFixture({ session })
    const conversationId1 = crypto.randomUUID()
    const conversationId2 = crypto.randomUUID()
    const lease1 = runtime.createLease({
      conversationId: conversationId1,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      inactivityTtlMs: 5000,
    })
    const lease2 = runtime.createLease({
      conversationId: conversationId2,
      readOnly: false,
      outputFileAccess: createBrowserOutputFileAccess(),
      inactivityTtlMs: 5000,
    })
    runs.start(conversationId1, 'destroy-run-1')
    const server1 = inspect(
      runtime.createMcpServer({ leaseToken: lease1.token }),
    )
    await server1._registeredTools.tabs.handler({
      action: 'new',
      url: 'https://browseros.com/destroy-test',
    })

    expect(runtime.getActiveLeaseCount()).toBe(2)
    await runtime.destroy()

    expect(runtime.getActiveLeaseCount()).toBe(0)
    expect(session.pages.close).toHaveBeenCalledWith(2)
    expect(() => runtime.validateLeaseToken(lease1.token)).toThrow(
      InvalidBrowserToolLeaseError,
    )
    expect(() => runtime.validateLeaseToken(lease2.token)).toThrow(
      InvalidBrowserToolLeaseError,
    )
  })
})

class TestConversationRuns {
  readonly associated: Array<{
    conversationId: string
    runId: string
    tabIds: number[]
  }> = []
  private readonly active = new Map<string, ActiveConversationRun>()

  activeRun(conversationId: string): ActiveConversationRun | undefined {
    return this.active.get(conversationId)
  }

  start(conversationId: string, runId: string): ActiveConversationRun {
    const abortController = new AbortController()
    let run!: ActiveConversationRun
    run = {
      conversationId,
      runId,
      panelsVisible: true,
      tabGroup: { title: 'browseros/test', colorKey: 'browseros' },
      signal: abortController.signal,
      associateTabs: (tabIds) => {
        if (this.active.get(conversationId) !== run) return false
        this.associated.push({ conversationId, runId, tabIds: [...tabIds] })
        return true
      },
    }
    this.active.set(conversationId, run)
    return run
  }

  finish(conversationId: string): void {
    this.active.delete(conversationId)
  }
}

function moduleFixture(
  options: { session?: BrowserSession; klavis?: KlavisService } = {},
) {
  const runs = new TestConversationRuns()
  const addCreatedPages = mock(() => {})
  const browserMcp = new BrowserMcpModule({
    version: 'test',
    browserSession: options.session ?? browserSession(),
    conversationRuns: runs,
    klavis: options.klavis,
    tabGroups: { addCreatedPages },
  })
  return { addCreatedPages, browserMcp, runs }
}
