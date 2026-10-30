import { MessageSquare, MousePointer2, RotateCcw } from 'lucide-react'
import type { FC } from 'react'
import { cn } from '@/lib/utils'
import type { ChatMode } from '@/modules/chat/chat-types'

export interface ModeSwitchNotice {
  id: string
  afterMessageId?: string
  from: ChatMode
  to: ChatMode
}

export interface ModeResetNoticeProps {
  notice: ModeSwitchNotice
}

export const ModeResetNotice: FC<ModeResetNoticeProps> = ({ notice }) => {
  const isNowChat = notice.to === 'chat'

  return (
    <div className="my-3 flex items-center justify-center gap-2 px-4">
      <div className="h-px flex-1 bg-border/70" />
      <div className="flex max-w-[85%] items-start gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-xs shadow-xs">
        <div
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
            isNowChat
              ? 'border-blue-500/30 bg-blue-500/15 text-blue-500'
              : 'border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/15 text-[var(--accent-orange)]',
          )}
        >
          {isNowChat ? (
            <MessageSquare className="h-3 w-3" />
          ) : (
            <MousePointer2 className="h-3 w-3" />
          )}
        </div>
        <div className="flex flex-col gap-1 text-left">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-foreground text-xs">
              {isNowChat ? 'Switched to Chat Mode' : 'Switched to Agent Mode'}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-border/80 bg-muted px-1.5 py-0.5 font-medium text-[10px] text-foreground/75">
              <RotateCcw className="h-2.5 w-2.5 text-foreground/60" />
              Tool state reset
            </span>
          </div>
          <p className="font-normal text-[11px] text-foreground/75 leading-relaxed">
            {isNowChat
              ? 'Active browser tool actions and memory were cleared. The AI is now in read-only mode and will observe pages without clicks or modifications.'
              : 'Full browser control restored. Tool execution state has been re-initialized for autonomous navigation and interactions.'}
          </p>
        </div>
      </div>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  )
}
