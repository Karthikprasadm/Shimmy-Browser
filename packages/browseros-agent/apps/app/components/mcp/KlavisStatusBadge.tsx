import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import type { FC } from 'react'
import { Badge } from '@/components/ui/badge'
import type { KlavisServiceStatus } from '@/modules/mcp/user-integrations.hooks'

export interface KlavisStatusBadgeProps {
  status: KlavisServiceStatus
  className?: string
  onRetry?: () => unknown
  isRetrying?: boolean
}

export const KlavisStatusBadge: FC<KlavisStatusBadgeProps> = ({
  status,
  className,
  onRetry,
  isRetrying,
}) => {
  if (status === 'loading') {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border-border/60 bg-muted/40 font-medium text-muted-foreground text-xs ${className ?? ''}`}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking Klavis...
      </Badge>
    )
  }

  if (status === 'unconfigured') {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border-amber-500/40 bg-amber-500/10 font-medium text-amber-600 text-xs dark:text-amber-400 ${className ?? ''}`}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Klavis: Credentials Unconfigured</span>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRetry()
            }}
            disabled={isRetrying}
            className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-[10px] text-amber-700 transition-colors hover:bg-amber-500/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:text-amber-300"
            title="Retry Klavis handshake"
            aria-label="Retry Klavis handshake"
          >
            <RefreshCw
              className={`h-2.5 w-2.5 shrink-0 ${isRetrying ? 'animate-spin' : ''}`}
            />
            <span>Retry Handshake</span>
          </button>
        )}
      </Badge>
    )
  }

  if (status === 'unreachable') {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border-destructive/40 bg-destructive/10 font-medium text-destructive text-xs ${className ?? ''}`}
      >
        <CloudOff className="h-3.5 w-3.5 shrink-0" />
        <span>Klavis: Service Unreachable</span>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRetry()
            }}
            disabled={isRetrying}
            className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 font-semibold text-[10px] text-destructive transition-colors hover:bg-destructive/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            title="Retry Klavis handshake"
            aria-label="Retry Klavis handshake"
          >
            <RefreshCw
              className={`h-2.5 w-2.5 shrink-0 ${isRetrying ? 'animate-spin' : ''}`}
            />
            <span>Retry Handshake</span>
          </button>
        )}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 border-emerald-500/40 bg-emerald-500/10 font-medium text-emerald-600 text-xs dark:text-emerald-400 ${className ?? ''}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Klavis: Connected
    </Badge>
  )
}
