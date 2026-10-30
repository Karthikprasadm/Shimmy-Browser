import { describe, expect, it } from 'bun:test'
import type { BrowserSession } from '@browseros/browser-core/core/session'
import { act } from './act'
import {
  defineTool,
  executeTool,
  formatStaleRefHint,
  isStaleRefError,
} from './framework'

describe('stale ref detection and hints', () => {
  it('identifies various stale element and ref errors', () => {
    expect(isStaleRefError(new Error('Stale ref e12 (button "Submit"); take a new snapshot.'))).toBe(true)
    expect(isStaleRefError(new Error('Unknown ref e999; take a new snapshot.'))).toBe(true)
    expect(isStaleRefError(new Error('Node is detached from document'))).toBe(true)
    expect(isStaleRefError(new Error('Could not find node with given id'))).toBe(true)
    expect(isStaleRefError(new Error('Node with given id does not belong to the document'))).toBe(true)
    expect(isStaleRefError(new Error('stale element reference: element is not attached to the page document'))).toBe(true)
    expect(isStaleRefError(new Error('Element not found in DOM'))).toBe(true)
    expect(isStaleRefError('Cannot find context with specified id')).toBe(true)

    expect(isStaleRefError(new Error('act click: ref is required.'))).toBe(false)
    expect(isStaleRefError(new Error('Network timeout'))).toBe(false)
    expect(isStaleRefError(null)).toBe(false)
    expect(isStaleRefError(undefined)).toBe(false)
  })

  it('formats actionable auto-retry hints', () => {
    const hintWithTarget = formatStaleRefHint(1, 'e12')
    expect(hintWithTarget).toContain('element ref "e12"')
    expect(hintWithTarget).toContain('snapshot({ page: 1 })')

    const hintGeneric = formatStaleRefHint()
    expect(hintGeneric).toContain('the element handle')
    expect(hintGeneric).toContain('snapshot({ page })')
  })
})

describe('act tool stale ref recovery', () => {
  function createMockSession(options: {
    initialRefs: Map<string, { ref: string; role: string; name: string; nth: number; frameId?: string; backendNodeId: number }>
    updatedRefs: Map<string, { ref: string; role: string; name: string; nth: number; frameId?: string; backendNodeId: number }>
    simulateStaleFirstTry?: boolean
  }) {
    let snapshotCount = 0
    let clickCalls: string[] = []
    let currentRefs = options.initialRefs

    const observer = {
      get lastRefs() {
        return {
          get: (ref: string) => currentRefs.get(ref),
          byRef: currentRefs,
        }
      },
      snapshot: async () => {
        snapshotCount++
        currentRefs = options.updatedRefs
        return { text: 'snapshot updated' }
      },
      diff: async () => ({
        changed: true,
        text: 'diff',
      }),
    }

    let firstClick = true
    const input = {
      click: async (ref: string) => {
        clickCalls.push(ref)
        if (options.simulateStaleFirstTry && firstClick) {
          firstClick = false
          throw new Error(`Stale ref ${ref} (button "Submit"); take a new snapshot.`)
        }
      },
      fill: async () => {},
      type: async () => {},
      typeAt: async () => {},
      hover: async () => {},
      hoverAt: async () => {},
      focus: async () => {},
      check: async () => {},
      uncheck: async () => {},
      selectOption: async () => null,
      scroll: async () => {},
      drag: async () => {},
      dragAt: async () => {},
      press: async () => {},
    }

    const session = {
      observe: () => observer,
      input: () => input,
      pages: {
        getInfo: () => ({ url: 'https://example.com' }),
      },
    } as unknown as BrowserSession

    return {
      session,
      getSnapshotCount: () => snapshotCount,
      getClickCalls: () => clickCalls,
    }
  }

  it('auto-retries after micro-snapshot and re-resolves target selector before failing turn', async () => {
    const initialRefs = new Map([
      ['e1', { ref: 'e1', role: 'button', name: 'Submit', nth: 0, backendNodeId: 10 }],
    ])
    // After DOM mutation, button "Submit" was re-created as ref e5
    const updatedRefs = new Map([
      ['e5', { ref: 'e5', role: 'button', name: 'Submit', nth: 0, backendNodeId: 25 }],
    ])

    const mock = createMockSession({
      initialRefs,
      updatedRefs,
      simulateStaleFirstTry: true,
    })

    const result = await executeTool(
      act,
      { page: 1, kind: 'click', ref: 'e1' },
      { session: mock.session },
    )

    expect(result.isError).toBeFalsy()
    expect(mock.getSnapshotCount()).toBe(1)
    expect(mock.getClickCalls()).toEqual(['e1', 'e5'])

    const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
    expect(text).toContain('Auto-retry: stale ref(s) re-resolved')
    expect(text).toContain('"e1" -> "e5"')

    const structured = result.structuredContent as Record<string, unknown>
    expect(structured.autoRetried).toBe(true)
    expect(structured.recoveredRefs).toEqual({ e1: 'e5' })
  })

  it('fails with actionable auto-retry hint when element cannot be re-resolved after micro-snapshot', async () => {
    const initialRefs = new Map([
      ['e1', { ref: 'e1', role: 'button', name: 'Delete', nth: 0, backendNodeId: 10 }],
    ])
    // After DOM mutation, button "Delete" is completely gone
    const updatedRefs = new Map([
      ['e2', { ref: 'e2', role: 'button', name: 'Cancel', nth: 0, backendNodeId: 20 }],
    ])

    const mock = createMockSession({
      initialRefs,
      updatedRefs,
      simulateStaleFirstTry: true,
    })

    const result = await executeTool(
      act,
      { page: 1, kind: 'click', ref: 'e1' },
      { session: mock.session },
    )

    expect(result.isError).toBe(true)
    expect(mock.getSnapshotCount()).toBe(1)
    const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
    expect(text).toContain('Stale ref e1')
    expect(text).toContain('Auto-retry hint:')
    expect(text).toContain('element ref "e1" is stale or detached')
    expect(text).toContain('snapshot({ page: 1 })')
  })

  it('skips micro-snapshot when autoRetry is false and returns error with hint', async () => {
    const initialRefs = new Map([
      ['e1', { ref: 'e1', role: 'button', name: 'Submit', nth: 0, backendNodeId: 10 }],
    ])
    const updatedRefs = new Map([
      ['e5', { ref: 'e5', role: 'button', name: 'Submit', nth: 0, backendNodeId: 25 }],
    ])

    const mock = createMockSession({
      initialRefs,
      updatedRefs,
      simulateStaleFirstTry: true,
    })

    const result = await executeTool(
      act,
      { page: 1, kind: 'click', ref: 'e1', autoRetry: false },
      { session: mock.session },
    )

    expect(result.isError).toBe(true)
    expect(mock.getSnapshotCount()).toBe(0) // No snapshot taken
    expect(mock.getClickCalls()).toEqual(['e1'])

    const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
    expect(text).toContain('Auto-retry hint:')
    expect(text).toContain('snapshot({ page: 1 })')
  })

  it('executeTool appends auto-retry hint when any tool throws unhandled stale ref error', async () => {
    const testTool = defineTool({
      name: 'test_stale_thrower',
      description: 'Test tool',
      input: act.input,
      handler: async () => {
        throw new Error('Node is detached from document')
      },
    })

    const result = await executeTool(
      testTool,
      { page: 2, kind: 'click', ref: 'e1' },
      { session: {} as BrowserSession },
    )

    expect(result.isError).toBe(true)
    const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
    expect(text).toContain('Node is detached from document')
    expect(text).toContain('Auto-retry hint:')
    expect(text).toContain('snapshot({ page: 2 })')
  })
})
