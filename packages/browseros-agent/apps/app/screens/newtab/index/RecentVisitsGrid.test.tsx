import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { RecentSite } from './recent-sites.helpers'

let mockRecentResult: { sites: RecentSite[]; isFallback: boolean } = {
  sites: [],
  isFallback: false,
}

mock.module('./recent-sites.hooks', () => ({
  useRecentSites: () => mockRecentResult,
}))

const { RecentVisitsGrid } = await import('./RecentVisitsGrid')

describe('RecentVisitsGrid / RecentSites', () => {
  beforeEach(() => {
    mockRecentResult = {
      sites: [],
      isFallback: false,
    }
  })

  it('renders visited sites with Recent sites heading when history has entries', () => {
    mockRecentResult = {
      sites: [
        {
          name: 'My Workspace',
          url: 'https://workspace.dev',
          host: 'workspace.dev',
        },
        {
          name: 'Project Jira',
          url: 'https://jira.corp',
          host: 'jira.corp',
        },
      ],
      isFallback: false,
    }

    const html = renderToStaticMarkup(createElement(RecentVisitsGrid))

    expect(html).toContain('Recent sites')
    expect(html).toContain('My Workspace')
    expect(html).toContain('Project Jira')
    expect(html).toContain('https://workspace.dev')
    expect(html).toContain('https://jira.corp')
  })

  it('renders inviting fallback bookmarks with Popular sites heading when empty', () => {
    mockRecentResult = {
      sites: [
        {
          name: 'GitHub',
          url: 'https://github.com',
          host: 'github.com',
        },
        {
          name: 'Docs',
          url: 'https://docs.browseros.com',
          host: 'docs.browseros.com',
        },
        {
          name: 'Shimmy Home',
          url: 'https://browseros.com',
          host: 'browseros.com',
        },
      ],
      isFallback: true,
    }

    const html = renderToStaticMarkup(createElement(RecentVisitsGrid))

    expect(html).toContain('Popular sites')
    expect(html).toContain('GitHub')
    expect(html).toContain('Docs')
    expect(html).toContain('Shimmy Home')
    expect(html).toContain('https://github.com')
  })

  it('returns null if sites list is completely empty', () => {
    mockRecentResult = {
      sites: [],
      isFallback: false,
    }

    const html = renderToStaticMarkup(createElement(RecentVisitsGrid))

    expect(html).toBe('')
  })
})
