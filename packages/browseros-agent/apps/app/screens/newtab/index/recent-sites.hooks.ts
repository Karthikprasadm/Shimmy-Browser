import { useEffect, useState } from 'react'
import {
  DEFAULT_POPULAR_SITES,
  mapTopSitesToRecentSites,
  type RecentSite,
} from './recent-sites.helpers'

export const MAX_RECENT_SITES = 8

export interface UseRecentSitesResult {
  sites: RecentSite[]
  isFallback: boolean
}

async function fetchTopSites(max: number): Promise<RecentSite[]> {
  if (typeof chrome === 'undefined' || !chrome.topSites?.get) return []
  try {
    const top = await chrome.topSites.get()
    return top && top.length > 0 ? mapTopSitesToRecentSites(top, max) : []
  } catch {
    return []
  }
}

async function fetchHistorySites(max: number): Promise<RecentSite[]> {
  if (typeof chrome === 'undefined' || !chrome.history?.search) return []
  try {
    const historyItems = await chrome.history.search({
      text: '',
      maxResults: max * 3,
      startTime: 0,
    })
    if (!historyItems || historyItems.length === 0) return []
    const valid: { url: string; title: string }[] = []
    for (const item of historyItems) {
      const url = item.url
      if (!url) continue
      if (
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://')
      ) {
        continue
      }
      let title = item.title
      if (!title) {
        try {
          title = new URL(url).hostname
        } catch {
          title = url
        }
      }
      valid.push({ url, title })
    }
    return mapTopSitesToRecentSites(valid, max)
  } catch {
    return []
  }
}

export function useRecentSites(): UseRecentSitesResult {
  const [result, setResult] = useState<UseRecentSitesResult>({
    sites: Array.from(DEFAULT_POPULAR_SITES.slice(0, MAX_RECENT_SITES)),
    isFallback: true,
  })

  useEffect(() => {
    let cancelled = false

    const loadSites = async () => {
      const top = await fetchTopSites(MAX_RECENT_SITES)
      if (cancelled) return
      if (top.length > 0) {
        setResult({ sites: top, isFallback: false })
        return
      }

      const history = await fetchHistorySites(MAX_RECENT_SITES)
      if (cancelled) return
      if (history.length > 0) {
        setResult({ sites: history, isFallback: false })
        return
      }

      setResult({
        sites: Array.from(DEFAULT_POPULAR_SITES.slice(0, MAX_RECENT_SITES)),
        isFallback: true,
      })
    }

    loadSites()
    return () => {
      cancelled = true
    }
  }, [])

  return result
}
