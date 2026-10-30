import { beforeEach, describe, expect, it, mock } from 'bun:test'

const storageValues = new Map<string, unknown>()

mock.module('@wxt-dev/storage', () => ({
  storage: {
    defineItem: (key: string, options: { fallback: unknown }) => ({
      getValue: async () => storageValues.get(key) ?? options.fallback,
      setValue: async (val: unknown) => {
        storageValues.set(key, val)
      },
      watch: () => () => {},
    }),
  },
}))

const {
  WALLPAPER_PRESETS,
  wallpaperStorage,
  MAX_WALLPAPER_FILE_SIZE_BYTES,
  MAX_WALLPAPER_FILE_SIZE_MB,
  validateWallpaperFileSize,
} = await import('./wallpaperStorage')
type WallpaperConfig = import('./wallpaperStorage').WallpaperConfig

describe('wallpaper preferences', () => {
  beforeEach(() => {
    storageValues.clear()
  })

  it('defines curated wallpaper presets with non-empty styles', () => {
    expect(WALLPAPER_PRESETS.length).toBeGreaterThan(0)
    for (const preset of WALLPAPER_PRESETS) {
      expect(preset.id).toBeTruthy()
      expect(preset.name).toBeTruthy()
      expect(preset.style).toBeTruthy()
      expect(preset.previewClass).toBeTruthy()
    }
  })

  it('defaults to none when unconfigured', async () => {
    const value = await wallpaperStorage.getValue()
    expect(value).toEqual({ type: 'none' })
  })

  it('persists and retrieves preset wallpaper configuration', async () => {
    const presetConfig: WallpaperConfig = {
      type: 'preset',
      presetId: 'cosmic-dark',
    }
    await wallpaperStorage.setValue(presetConfig)
    const stored = await wallpaperStorage.getValue()
    expect(stored).toEqual(presetConfig)
  })

  it('persists and retrieves custom background image data URL', async () => {
    const customConfig: WallpaperConfig = {
      type: 'custom',
      customDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      blur: 4,
      opacity: 0.85,
    }
    await wallpaperStorage.setValue(customConfig)
    const stored = await wallpaperStorage.getValue()
    expect(stored).toEqual(customConfig)
  })

  it('clears wallpaper setting back to none', async () => {
    await wallpaperStorage.setValue({
      type: 'preset',
      presetId: 'cyber-sunset',
    })
    await wallpaperStorage.setValue({ type: 'none' })
    const stored = await wallpaperStorage.getValue()
    expect(stored).toEqual({ type: 'none' })
  })

  it('validates wallpaper file size up to 5MB', () => {
    expect(MAX_WALLPAPER_FILE_SIZE_MB).toBe(5)
    expect(MAX_WALLPAPER_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024)

    // Valid sizes
    expect(validateWallpaperFileSize(2 * 1024 * 1024)).toEqual({ valid: true })
    expect(validateWallpaperFileSize(5 * 1024 * 1024)).toEqual({ valid: true })

    // Invalid sizes
    const overLimit = validateWallpaperFileSize(5 * 1024 * 1024 + 1)
    expect(overLimit.valid).toBe(false)
    expect(overLimit.error).toContain('5MB')
    expect(overLimit.error).toContain('storage exhaustion')
  })
})
