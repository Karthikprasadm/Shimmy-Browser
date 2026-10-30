import { storage } from '@wxt-dev/storage'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface WallpaperPreset {
  id: string
  name: string
  style: string
  previewClass: string
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'cosmic-dark',
    name: 'Cosmic Dark',
    style:
      'radial-gradient(ellipse at 20% 20%, rgba(120, 40, 200, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(20, 100, 220, 0.2) 0%, transparent 50%), linear-gradient(180deg, #090a0f 0%, #030407 100%)',
    previewClass: 'from-purple-950 via-slate-950 to-blue-950',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    style:
      'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 90% 40%, rgba(99, 102, 241, 0.2) 0%, transparent 50%), linear-gradient(180deg, #05131a 0%, #03080c 100%)',
    previewClass: 'from-teal-950 via-slate-950 to-indigo-950',
  },
  {
    id: 'cyber-sunset',
    name: 'Cyber Sunset',
    style:
      'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0f0a0d 0%, #070305 100%)',
    previewClass: 'from-orange-950 via-slate-950 to-pink-950',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Deep',
    style:
      'radial-gradient(ellipse at 40% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(5, 150, 105, 0.15) 0%, transparent 50%), linear-gradient(180deg, #04100c 0%, #020705 100%)',
    previewClass: 'from-emerald-950 via-slate-950 to-zinc-950',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Minimal',
    style: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    previewClass: 'from-slate-900 to-slate-950',
  },
]

export interface WallpaperConfig {
  type: 'none' | 'preset' | 'custom'
  presetId?: string
  customDataUrl?: string
  blur?: number
  opacity?: number
}

export const MAX_WALLPAPER_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_WALLPAPER_FILE_SIZE_MB = 5

export function validateWallpaperFileSize(sizeInBytes: number): {
  valid: boolean
  error?: string
} {
  if (sizeInBytes > MAX_WALLPAPER_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size exceeds ${MAX_WALLPAPER_FILE_SIZE_MB}MB. Please select a smaller image to prevent storage exhaustion.`,
    }
  }
  return { valid: true }
}

export const wallpaperStorage = storage.defineItem<WallpaperConfig>(
  'local:newtab-wallpaper',
  {
    fallback: { type: 'none' },
  },
)

export function useWallpaper() {
  const [wallpaper, setWallpaperState] = useState<WallpaperConfig>({
    type: 'none',
  })
  const isLocalUpdate = useRef(false)

  useEffect(() => {
    wallpaperStorage.getValue().then((val) => {
      if (val) setWallpaperState(val)
    })
    const unwatch = wallpaperStorage.watch((newValue) => {
      if (!isLocalUpdate.current) {
        setWallpaperState(newValue ?? { type: 'none' })
      }
      isLocalUpdate.current = false
    })
    return unwatch
  }, [])

  const setWallpaper = useCallback(async (config: WallpaperConfig) => {
    setWallpaperState(config)
    isLocalUpdate.current = true
    await wallpaperStorage.setValue(config)
  }, [])

  const clearWallpaper = useCallback(async () => {
    const emptyConfig: WallpaperConfig = { type: 'none' }
    setWallpaperState(emptyConfig)
    isLocalUpdate.current = true
    await wallpaperStorage.setValue(emptyConfig)
  }, [])

  return {
    wallpaper,
    setWallpaper,
    clearWallpaper,
    presets: WALLPAPER_PRESETS,
  }
}
