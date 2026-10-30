import { describe, expect, it } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChatAttachedTabs } from './ChatAttachedTabs'

describe('ChatAttachedTabs', () => {
  it('returns null when no tabs are attached', () => {
    const html = renderToStaticMarkup(
      createElement(ChatAttachedTabs, {
        tabs: [],
        onRemoveTab: () => {},
      }),
    )

    expect(html).toBe('')
  })

  it('renders attached tabs without window badge when only one window is present', () => {
    const tabs = [
      {
        id: 101,
        windowId: 1,
        title: 'Google Search',
        url: 'https://google.com',
      } as chrome.tabs.Tab,
      {
        id: 102,
        windowId: 1,
        title: 'Google Docs',
        url: 'https://docs.google.com',
      } as chrome.tabs.Tab,
    ]

    const html = renderToStaticMarkup(
      createElement(ChatAttachedTabs, {
        tabs,
        onRemoveTab: () => {},
      }),
    )

    expect(html).toContain('Active Browser Leases (2)')
    expect(html).toContain('#tab-101')
    expect(html).toContain('#tab-102')
    expect(html).toContain('Google Search')
    expect(html).toContain('Google Docs')
    expect(html).not.toContain('Win 1')
  })

  it('renders Win 1 and Win 2 badges when multiple windows exist to distinguish same-titled tabs', () => {
    const tabs = [
      {
        id: 101,
        windowId: 50,
        title: 'GitHub - Shimmy-Browser',
        url: 'https://github.com/Karthikprasadm/Shimmy-Browser',
      } as chrome.tabs.Tab,
      {
        id: 202,
        windowId: 60,
        title: 'GitHub - Shimmy-Browser',
        url: 'https://github.com/Karthikprasadm/Shimmy-Browser/pulls',
      } as chrome.tabs.Tab,
    ]

    const html = renderToStaticMarkup(
      createElement(ChatAttachedTabs, {
        tabs,
        onRemoveTab: () => {},
      }),
    )

    expect(html).toContain('Active Browser Leases (2)')
    expect(html).toContain('Win 1')
    expect(html).toContain('Win 2')
    expect(html).toContain('#tab-101')
    expect(html).toContain('#tab-202')
    expect(html).toContain('Browser Window 1')
    expect(html).toContain('Browser Window 2')
  })
})
