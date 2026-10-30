import type { BrowserSession } from '@browseros/browser-core/core/session'
import { z } from 'zod/v4'
import {
  defineTool,
  errorResult,
  formatStaleRefHint,
  isStaleRefError,
  type ToolResult,
  textResult,
} from './framework'

type InputApi = ReturnType<BrowserSession['input']>

// Flat (not discriminated-union) schema: some providers reject nested anyOf JSON Schema. The kind
// is validated at runtime in the handler. All page mutation goes through this one tool.
export const act = defineTool({
  name: 'act',
  description:
    'Act on the page using refs from the last snapshot. kinds: click, type (into focused element), fill (one field via ref+value, or many via fields[]), press (a key/combo), hover, focus, check, uncheck, select (an option value), scroll, drag. Prefer the ref-based kinds; use the coordinate kinds (click_at/type_at/hover_at/drag_at) only when the target is not in the snapshot. Reads back a diff of what changed - re-snapshot if you need fresh refs. If a click or fill fails, scroll the target into view and retry once. Never type credentials into a page you navigated to yourself; only into pages the user already opened or explicitly directed you to.',
  input: z
    .object({
      page: z.number().int(),
      kind: z.enum([
        'click',
        'click_at',
        'type',
        'type_at',
        'fill',
        'press',
        'hover',
        'hover_at',
        'focus',
        'check',
        'uncheck',
        'select',
        'scroll',
        'drag',
        'drag_at',
      ]),
      ref: z.string().optional().describe('Target element ref, e.g. "e12".'),
      text: z.string().optional().describe('Text for kind=type.'),
      value: z.string().optional().describe('Value for kind=fill/select.'),
      fields: z
        .array(z.object({ ref: z.string(), value: z.string() }).strict())
        .optional()
        .describe('Multiple fields for kind=fill, filled in order.'),
      key: z
        .string()
        .optional()
        .describe('Key/combo for kind=press, e.g. "Enter", "Control+a".'),
      direction: z.enum(['up', 'down', 'left', 'right']).optional(),
      amount: z
        .number()
        .optional()
        .describe('Scroll amount (wheel notches), default 3.'),
      x: z
        .number()
        .optional()
        .describe('Viewport x coordinate for *_at kinds.'),
      y: z
        .number()
        .optional()
        .describe('Viewport y coordinate for *_at kinds.'),
      targetRef: z.string().optional().describe('Target ref for kind=drag.'),
      startX: z.number().optional().describe('Drag start x coordinate.'),
      startY: z.number().optional().describe('Drag start y coordinate.'),
      endX: z.number().optional().describe('Drag end x coordinate.'),
      endY: z.number().optional().describe('Drag end y coordinate.'),
      button: z.enum(['left', 'middle', 'right']).optional(),
      clickCount: z.number().int().optional(),
      clear: z.boolean().optional(),
      autoRetry: z
        .boolean()
        .optional()
        .describe(
          'Optionally auto-retry when element handles become stale due to dynamic DOM mutations by re-taking a micro-snapshot and re-resolving the target selector. Defaults to true.',
        ),
    })
    .strict(),
  annotations: {
    title: 'Interact with page',
    destructiveHint: true,
  },
  handler: async (args, ctx, response) => {
    const input = ctx.session.input(args.page)
    const observer = ctx.session.observe(args.page)

    // Capture ref descriptors before action in case DOM mutation renders refs stale
    const descriptors = captureRefDescriptors(observer, args)

    let currentArgs: ActArgs = { ...args }
    let runError: unknown
    let toolResult: ToolResult | undefined

    try {
      toolResult = await runKind(currentArgs, input)
      if (toolResult?.isError) {
        const text = resultText(toolResult)
        if (isStaleRefError(text)) {
          runError = new Error(text)
        }
      }
    } catch (err) {
      runError = err
    }

    if (runError && isStaleRefError(runError)) {
      const canRetry = args.autoRetry !== false && descriptors.size > 0
      if (canRetry) {
        try {
          await observer.snapshot()
          const reResolved = reResolveArgsRefs(
            observer,
            currentArgs,
            descriptors,
          )
          if (reResolved.recovered) {
            currentArgs = reResolved.newArgs
            let retryError: unknown
            let retryResult: ToolResult | undefined
            try {
              retryResult = await runKind(currentArgs, input)
              if (retryResult?.isError) {
                const text = resultText(retryResult)
                if (isStaleRefError(text)) {
                  retryError = new Error(text)
                }
              }
            } catch (err) {
              retryError = err
            }

            if (!retryError && !retryResult?.isError) {
              response.data({
                kind: args.kind,
                autoRetried: true,
                recoveredRefs: reResolved.mapping,
              })
              response.text(
                `[Auto-retry: stale ref(s) re-resolved after micro-snapshot: ${Object.entries(
                  reResolved.mapping,
                )
                  .map(([oldRef, newRef]) => `"${oldRef}" -> "${newRef}"`)
                  .join(', ')}]`,
              )
              response.includeDiff(args.page, { includeStructured: true })
              return textResult(`ok (${args.kind})`)
            }
            if (retryError) {
              runError = retryError
            } else if (retryResult?.isError) {
              return retryResult
            }
          }
        } catch {
          // Snapshot or retry failed; fall through to instructive error result
        }
      }

      const rawMsg =
        runError instanceof Error ? runError.message : String(runError)
      const staleTarget =
        args.ref || args.targetRef || args.fields?.[0]?.ref
      const hint = formatStaleRefHint(args.page, staleTarget)
      const fullMessage = rawMsg.toLowerCase().includes('auto-retry hint')
        ? rawMsg
        : `${rawMsg}\n${hint}`

      return errorResult(fullMessage)
    }

    if (runError) {
      throw runError
    }

    if (toolResult) return toolResult

    response.data({ kind: args.kind })
    response.includeDiff(args.page, { includeStructured: true })
    return textResult(`ok (${args.kind})`)
  },
})

type ActArgs = {
  page: number
  kind: string
  ref?: string
  text?: string
  value?: string
  fields?: { ref: string; value: string }[]
  key?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  amount?: number
  x?: number
  y?: number
  targetRef?: string
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  button?: 'left' | 'middle' | 'right'
  clickCount?: number
  clear?: boolean
  autoRetry?: boolean
}

interface TargetRefDescriptor {
  ref: string
  role: string
  name: string
  nth: number
  frameId?: string
}

function captureRefDescriptors(
  observer: ReturnType<BrowserSession['observe']>,
  args: ActArgs,
): Map<string, TargetRefDescriptor> {
  const descriptors = new Map<string, TargetRefDescriptor>()
  if (!observer?.lastRefs?.get) return descriptors
  const recordRef = (ref?: string) => {
    if (!ref) return
    const entry = observer.lastRefs.get(ref)
    if (entry) {
      descriptors.set(ref, {
        ref: entry.ref,
        role: entry.role,
        name: entry.name,
        nth: entry.nth,
        frameId: entry.frameId,
      })
    }
  }

  recordRef(args.ref)
  recordRef(args.targetRef)
  if (args.fields) {
    for (const field of args.fields) {
      recordRef(field.ref)
    }
  }
  return descriptors
}

function reResolveRef(
  observer: ReturnType<BrowserSession['observe']>,
  descriptor: TargetRefDescriptor,
): string | undefined {
  if (!observer?.lastRefs?.byRef) return undefined
  // 1. Exact match on (role, name, frameId, nth)
  for (const candidate of observer.lastRefs.byRef.values()) {
    if (
      candidate.role === descriptor.role &&
      candidate.name === descriptor.name &&
      candidate.frameId === descriptor.frameId &&
      candidate.nth === descriptor.nth
    ) {
      return candidate.ref
    }
  }

  // 2. Exact match on (role, name, frameId)
  const matches: string[] = []
  for (const candidate of observer.lastRefs.byRef.values()) {
    if (
      candidate.role === descriptor.role &&
      candidate.name === descriptor.name &&
      candidate.frameId === descriptor.frameId
    ) {
      matches.push(candidate.ref)
    }
  }
  if (matches.length === 1) {
    return matches[0]
  }
  if (matches.length > 0) {
    return matches[Math.min(descriptor.nth, matches.length - 1)]
  }

  // 3. Match across frames if unique
  const crossFrameMatches: string[] = []
  for (const candidate of observer.lastRefs.byRef.values()) {
    if (
      candidate.role === descriptor.role &&
      candidate.name === descriptor.name
    ) {
      crossFrameMatches.push(candidate.ref)
    }
  }
  if (crossFrameMatches.length === 1) {
    return crossFrameMatches[0]
  }

  return undefined
}

function reResolveArgsRefs(
  observer: ReturnType<BrowserSession['observe']>,
  args: ActArgs,
  descriptors: Map<string, TargetRefDescriptor>,
): {
  recovered: boolean
  newArgs: ActArgs
  mapping: Record<string, string>
} {
  let recovered = false
  const newArgs: ActArgs = { ...args }
  const mapping: Record<string, string> = {}

  if (args.ref && descriptors.has(args.ref)) {
    const fresh = reResolveRef(observer, descriptors.get(args.ref)!)
    if (fresh) {
      newArgs.ref = fresh
      mapping[args.ref] = fresh
      recovered = true
    }
  }

  if (args.targetRef && descriptors.has(args.targetRef)) {
    const fresh = reResolveRef(observer, descriptors.get(args.targetRef)!)
    if (fresh) {
      newArgs.targetRef = fresh
      mapping[args.targetRef] = fresh
      recovered = true
    }
  }

  if (args.fields && args.fields.length > 0) {
    const updatedFields: { ref: string; value: string }[] = []
    let fieldsRecovered = false
    for (const f of args.fields) {
      if (descriptors.has(f.ref)) {
        const fresh = reResolveRef(observer, descriptors.get(f.ref)!)
        if (fresh) {
          updatedFields.push({ ref: fresh, value: f.value })
          mapping[f.ref] = fresh
          fieldsRecovered = true
        } else {
          updatedFields.push({ ...f })
        }
      } else {
        updatedFields.push({ ...f })
      }
    }
    if (fieldsRecovered) {
      newArgs.fields = updatedFields
      recovered = true
    }
  }

  return { recovered, newArgs, mapping }
}

function resultText(result: ToolResult): string {
  return result.content
    .map((item) => (item.type === 'text' ? item.text : ''))
    .filter(Boolean)
    .join('\n')
}

type ActHandler = (
  args: ActArgs,
  input: InputApi,
) => Promise<ToolResult | undefined>

const ACT_HANDLERS: Record<string, ActHandler> = {
  click: clickRef,
  click_at: clickAt,
  type: typeFocused,
  type_at: typeAt,
  fill,
  press,
  hover,
  hover_at: hoverAt,
  focus,
  check,
  uncheck,
  select,
  scroll,
  drag,
  drag_at: dragAt,
}

async function runKind(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  const handler = ACT_HANDLERS[args.kind]
  return handler
    ? handler(args, input)
    : errorResult(`act: unknown kind "${args.kind}".`)
}

async function clickRef(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref) return errorResult('act click: ref is required.')
  await input.click(args.ref, clickOptions(args))
  return undefined
}

async function clickAt(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  const point = pointFromArgs(args, 'click_at')
  if ('content' in point) return point
  await input.clickAt(point.x, point.y, clickOptions(args))
  return undefined
}

async function typeFocused(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (args.text === undefined) return errorResult('act type: text is required.')
  await input.type(args.text)
  return undefined
}

async function typeAt(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  const point = pointFromArgs(args, 'type_at')
  if ('content' in point) return point
  if (args.text === undefined)
    return errorResult('act type_at: text is required.')
  await input.typeAt(point.x, point.y, args.text, args.clear ?? false)
  return undefined
}

async function fill(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (args.fields) {
    for (const field of args.fields)
      await input.fill(field.ref, field.value, { clear: args.clear })
    return undefined
  }
  if (args.ref && args.value !== undefined) {
    await input.fill(args.ref, args.value, { clear: args.clear })
    return undefined
  }
  return errorResult('act fill: provide fields[] or both ref and value.')
}

async function press(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.key) return errorResult('act press: key is required.')
  await input.press(args.key)
  return undefined
}

async function hover(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref) return errorResult('act hover: ref is required.')
  await input.hover(args.ref)
  return undefined
}

async function hoverAt(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  const point = pointFromArgs(args, 'hover_at')
  if ('content' in point) return point
  await input.hoverAt(point.x, point.y)
  return undefined
}

async function focus(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref) return errorResult('act focus: ref is required.')
  await input.focus(args.ref)
  return undefined
}

async function check(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref) return errorResult('act check: ref is required.')
  await input.check(args.ref)
  return undefined
}

async function uncheck(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref) return errorResult('act uncheck: ref is required.')
  await input.uncheck(args.ref)
  return undefined
}

async function select(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref || args.value === undefined) {
    return errorResult('act select: ref and value are required.')
  }
  await input.selectOption(args.ref, args.value)
  return undefined
}

async function scroll(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  await input.scroll(args.direction ?? 'down', args.amount ?? 3, args.ref)
  return undefined
}

async function drag(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (!args.ref || !args.targetRef) {
    return errorResult('act drag: ref and targetRef are required.')
  }
  await input.drag(args.ref, args.targetRef)
  return undefined
}

async function dragAt(
  args: ActArgs,
  input: InputApi,
): Promise<ToolResult | undefined> {
  if (
    args.startX === undefined ||
    args.startY === undefined ||
    args.endX === undefined ||
    args.endY === undefined
  ) {
    return errorResult(
      'act drag_at: startX, startY, endX, and endY are required.',
    )
  }
  await input.dragAt(
    { x: args.startX, y: args.startY },
    { x: args.endX, y: args.endY },
  )
  return undefined
}

function pointFromArgs(
  args: ActArgs,
  kind: string,
): { x: number; y: number } | ToolResult {
  if (args.x === undefined || args.y === undefined) {
    return errorResult(`act ${kind}: x and y are required.`)
  }
  return { x: args.x, y: args.y }
}

function clickOptions(args: ActArgs): { button?: string; clickCount?: number } {
  return {
    ...(args.button && { button: args.button }),
    ...(args.clickCount !== undefined && { clickCount: args.clickCount }),
  }
}
