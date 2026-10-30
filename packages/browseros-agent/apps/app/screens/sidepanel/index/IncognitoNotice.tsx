import { VenetianMask, X } from 'lucide-react'
import { useState } from 'react'

/**
 * Shown while the assistant runs in an incognito window so the user knows the
 * chat is not saved to history (#1189).
 */
export const IncognitoNotice = () => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
      <VenetianMask className="h-4 w-4 shrink-0" />
      <span className="flex-1">Incognito mode: this chat is not saved to history.</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss incognito notice"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
