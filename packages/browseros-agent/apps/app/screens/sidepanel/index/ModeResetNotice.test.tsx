import { describe, expect, it } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ModeResetNotice, type ModeSwitchNotice } from './ModeResetNotice'

describe('ModeResetNotice', () => {
  it('renders high-contrast Chat Mode notice with read-only explanation', () => {
    const notice: ModeSwitchNotice = {
      id: 'notice-1',
      from: 'agent',
      to: 'chat',
    }

    const html = renderToStaticMarkup(
      createElement(ModeResetNotice, { notice }),
    )

    expect(html).toContain('Switched to Chat Mode')
    expect(html).toContain('Tool state reset')
    expect(html).toContain('read-only mode')
    expect(html).toContain('bg-card')
    expect(html).toContain('border-border')
    expect(html).toContain('dark:bg-muted/80')
    expect(html).toContain('border-blue-500/30')
  })

  it('renders high-contrast Agent Mode notice with control restoration explanation', () => {
    const notice: ModeSwitchNotice = {
      id: 'notice-2',
      from: 'chat',
      to: 'agent',
    }

    const html = renderToStaticMarkup(
      createElement(ModeResetNotice, { notice }),
    )

    expect(html).toContain('Switched to Agent Mode')
    expect(html).toContain('Tool state reset')
    expect(html).toContain('Full browser control restored')
    expect(html).toContain('border-amber-500/30')
    expect(html).toContain('dark:text-amber-300')
  })
})
