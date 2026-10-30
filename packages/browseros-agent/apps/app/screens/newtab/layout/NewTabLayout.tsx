import type { FC } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ChatSessionProvider } from '@/modules/chat/chat-session-context'
import { NewTabFocusGrid } from './NewTabFocusGrid'
import { shouldHideFocusGrid, shouldUseChatSession } from './route-utils'

export const NewTabLayout: FC = () => {
  const location = useLocation()
  const hideGrid = shouldHideFocusGrid(location.pathname)
  const useChatSession = shouldUseChatSession(location.pathname)
  const content = (
    <div className="relative min-h-full">
      <NewTabFocusGrid hideDefaultGrid={hideGrid} />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  )

  if (!useChatSession) return content

  // Each history selection gets its own SDK session and composer. A late
  // stream or restore from the previous selection cannot replace this view.
  const conversationId = new URLSearchParams(location.search).get(
    'conversationId',
  )
  return (
    <ChatSessionProvider key={conversationId ?? 'new'} origin="newtab">
      {content}
    </ChatSessionProvider>
  )
}
