import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { COMPOSER_FOCUS_EVENT, focusComposerInput } from './composer-focus'

describe('focusComposerInput', () => {
  let originalWindow: typeof globalThis.window
  let originalDocument: typeof globalThis.document
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame

  beforeEach(() => {
    originalWindow = globalThis.window
    originalDocument = globalThis.document
    originalRequestAnimationFrame = globalThis.requestAnimationFrame
  })

  afterEach(() => {
    globalThis.window = originalWindow
    globalThis.document = originalDocument
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  })

  it('dispatches browseros:focus-composer event on window', () => {
    let capturedEventName = ''
    const mockWindow = {
      dispatchEvent: (event: CustomEvent) => {
        capturedEventName = event.type
        return true
      },
    }
    // @ts-expect-error test mock
    globalThis.window = mockWindow

    focusComposerInput()

    expect(capturedEventName).toBe(COMPOSER_FOCUS_EVENT)
  })

  it('queries composer textarea and places focus and caret at the end', () => {
    let focusCalled = false
    let selectionStart = -1
    let selectionEnd = -1

    const mockTextarea = {
      value: 'Hello world',
      focus: () => {
        focusCalled = true
      },
      setSelectionRange: (start: number, end: number) => {
        selectionStart = start
        selectionEnd = end
      },
    }

    // @ts-expect-error test mock
    globalThis.requestAnimationFrame = (callback: () => void) => {
      callback()
      return 1
    }

    const mockDocument = {
      querySelector: (selector: string) => {
        if (selector === 'textarea[data-composer-input]') {
          return mockTextarea
        }
        return null
      },
    }
    // @ts-expect-error test mock
    globalThis.document = mockDocument

    focusComposerInput()

    expect(focusCalled).toBe(true)
    expect(selectionStart).toBe(11)
    expect(selectionEnd).toBe(11)
  })
})
