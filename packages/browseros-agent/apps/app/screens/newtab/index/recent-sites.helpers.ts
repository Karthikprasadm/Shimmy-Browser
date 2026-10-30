export interface RecentSite {
  name: string
  url: string
  host?: string
}

/** Trim raw `chrome.topSites` entries into the shape the row renders: keep the
 * title and url, extract the host for favicon lookup (left undefined when the
 * url can't be parsed), and cap the list at `max`. */
export function mapTopSitesToRecentSites(
  sites: readonly { url: string; title: string }[],
  max: number,
): RecentSite[] {
  return sites.slice(0, max).map((site) => {
    let host: string | undefined
    try {
      host = new URL(site.url).host
    } catch {
      // Unparseable url — the row falls back to a generic glyph.
    }
    return { name: site.title, url: site.url, host }
  })
}

export const DEFAULT_POPULAR_SITES: readonly RecentSite[] = [
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
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    host: 'developer.mozilla.org',
  },
  {
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    host: 'chatgpt.com',
  },
  {
    name: 'Google',
    url: 'https://google.com',
    host: 'google.com',
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    host: 'stackoverflow.com',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com',
    host: 'youtube.com',
  },
]
