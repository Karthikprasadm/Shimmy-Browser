import { Globe, X } from 'lucide-react'
import { type FC, useEffect, useMemo, useState } from 'react'

export interface ChatAttachedTabsProps {
  tabs: chrome.tabs.Tab[]
  onRemoveTab: (tabId?: number) => void
}

export const ChatAttachedTabs: FC<ChatAttachedTabsProps> = ({
  tabs,
  onRemoveTab,
}) => {
  const [windowOrder, setWindowOrder] = useState<number[]>([])

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.windows?.getAll) return

    const refreshWindows = () => {
      chrome.windows
        .getAll()
        .then((windows) => {
          setWindowOrder(
            windows
              .map((w) => w.id)
              .filter((id): id is number => typeof id === 'number'),
          )
        })
        .catch(() => {})
    }

    refreshWindows()

    const onCreated = () => refreshWindows()
    const onRemoved = () => refreshWindows()
    chrome.windows.onCreated?.addListener(onCreated)
    chrome.windows.onRemoved?.addListener(onRemoved)

    return () => {
      chrome.windows.onCreated?.removeListener(onCreated)
      chrome.windows.onRemoved?.removeListener(onRemoved)
    }
  }, [])

  const windowIndexMap = useMemo(() => {
    const map = new Map<number, number>()
    if (windowOrder.length > 0) {
      for (let idx = 0; idx < windowOrder.length; idx++) {
        const id = windowOrder[idx]
        if (id !== undefined) {
          map.set(id, idx + 1)
        }
      }
    }
    let nextIdx = windowOrder.length + 1
    for (const tab of tabs) {
      if (typeof tab.windowId === 'number' && !map.has(tab.windowId)) {
        map.set(tab.windowId, nextIdx++)
      }
    }
    return map
  }, [windowOrder, tabs])

  const hasMultipleWindows = useMemo(() => {
    if (windowOrder.length > 1) return true
    const ids = new Set<number>()
    for (const t of tabs) {
      if (typeof t.windowId === 'number') ids.add(t.windowId)
    }
    return ids.size > 1
  }, [windowOrder, tabs])

  if (tabs.length === 0) return null

  return (
    <div className="px-3 pt-2">
      <div className="mb-1 flex items-center gap-1.5 px-0.5 text-[10px] text-muted-foreground">
        <Globe className="h-2.5 w-2.5 text-emerald-500" />
        <span className="font-medium text-foreground">
          Attached tabs ({tabs.length})
        </span>
        <span>•</span>
        <span className="text-muted-foreground/80">
          AI has access to these tabs
        </span>
      </div>
      <div className="styled-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="flex min-w-0 max-w-[220px] flex-shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-accent/50 px-2 py-1.5 shadow-2xs"
            title={tab.title}
          >
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-border bg-background">
              {tab.favIconUrl ? (
                <img src={tab.favIconUrl} alt="" className="h-3 w-3" />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 truncate font-medium text-foreground text-xs">
              {tab.title}
            </div>
            {hasMultipleWindows &&
              tab.windowId !== undefined &&
              windowIndexMap.has(tab.windowId) && (
                <span
                  className="shrink-0 rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 font-semibold text-[9px] text-blue-600 dark:text-blue-400"
                  title={`Browser Window ${windowIndexMap.get(tab.windowId)}`}
                >
                  Win {windowIndexMap.get(tab.windowId)}
                </span>
              )}
            <button
              type="button"
              onClick={() => onRemoveTab(tab.id)}
              className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-background"
              title="Remove tab"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
