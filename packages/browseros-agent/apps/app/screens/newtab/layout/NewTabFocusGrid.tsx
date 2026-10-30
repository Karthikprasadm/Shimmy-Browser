import type { FC } from 'react'
import {
  useWallpaper,
  WALLPAPER_PRESETS,
} from '@/lib/personalization/wallpaperStorage'

interface NewTabFocusGridProps {
  hideDefaultGrid?: boolean
}

export const NewTabFocusGrid: FC<NewTabFocusGridProps> = ({
  hideDefaultGrid,
}) => {
  const { wallpaper } = useWallpaper()

  const activePreset =
    wallpaper.type === 'preset'
      ? WALLPAPER_PRESETS.find((p) => p.id === wallpaper.presetId)
      : null

  if (wallpaper.type === 'custom' && wallpaper.customDataUrl) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover transition-all duration-700"
          style={{
            backgroundImage: `url(${wallpaper.customDataUrl})`,
            filter: wallpaper.blur ? `blur(${wallpaper.blur}px)` : undefined,
            opacity: wallpaper.opacity ?? 0.85,
          }}
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />
      </div>
    )
  }

  if (activePreset) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: activePreset.style }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>
    )
  }

  if (hideDefaultGrid) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-gradient-radial-focus" />
    </div>
  )
}
