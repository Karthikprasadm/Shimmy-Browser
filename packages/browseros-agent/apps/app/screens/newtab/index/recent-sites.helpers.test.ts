import { describe, expect, it } from 'bun:test'
import { mapTopSitesToRecentSites } from './recent-sites.helpers'

describe('mapTopSitesToRecentSites', () => {
  it('maps a top site to name, url, and the parsed host', () => {
    const [site] = mapTopSitesToRecentSites(
      [{ url: 'https://example.com/path', title: 'Example' }],
      5,
    )
    expect(site).toEqual({
      name: 'Example',
      url: 'https://example.com/path',
      host: 'example.com',
    })
  })

  it('leaves host undefined when the url cannot be parsed', () => {
    const [site] = mapTopSitesToRecentSites(
      [{ url: 'not-a-valid-url', title: 'Bad' }],
      5,
    )
    expect(site.host).toBeUndefined()
    expect(site.name).toBe('Bad')
  })

  it('returns at most max entries', () => {
    const sites = Array.from({ length: 8 }, (_, i) => ({
      url: `https://site${i}.com`,
      title: `Site ${i}`,
    }))
    expect(mapTopSitesToRecentSites(sites, 5)).toHaveLength(5)
  })

  it('provides default popular developer bookmarks for empty state fallback', async () => {
    const { DEFAULT_POPULAR_SITES } = await import('./recent-sites.helpers')
    expect(DEFAULT_POPULAR_SITES.length).toBeGreaterThanOrEqual(5)
    const names = DEFAULT_POPULAR_SITES.map((s) => s.name)
    expect(names).toContain('GitHub')
    expect(names).toContain('Docs')
    expect(names).toContain('Shimmy Home')
  })
})
