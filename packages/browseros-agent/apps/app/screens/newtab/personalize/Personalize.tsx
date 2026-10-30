import {
  Check,
  ChevronDown,
  Copy,
  Palette,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { usePersonalization } from '@/lib/personalization/personalizationStorage'
import {
  useWallpaper,
  validateWallpaperFileSize,
} from '@/lib/personalization/wallpaperStorage'
import { cn } from '@/lib/utils'
import { NewTabBranding } from '../index/NewTabBranding'
import { templates } from './templates'

const sections = [
  {
    key: 'aboutYou' as const,
    title: 'Add more info about you',
    description: 'Help Shimmy understand who you are',
  },
  {
    key: 'expectations' as const,
    title: 'What you expect from the browser',
    description: 'Share your preferences and needs',
  },
  {
    key: 'commonActions' as const,
    title: 'Your commonly performed actions',
    description: 'Describe your daily workflows',
  },
]

export const Personalize = () => {
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(
    sections[0].key,
  )
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { personalization, setPersonalization } = usePersonalization()
  const { wallpaper, setWallpaper, clearWallpaper, presets } = useWallpaper()

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyTemplate = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey].template
    navigator.clipboard.writeText(template)
    setCopiedSection(templateKey)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handleCustomImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB to prevent extension storage quota overflow
    const validation = validateWallpaperFileSize(file.size)
    if (!validation.valid) {
      setUploadError(
        validation.error ??
          'Image size exceeds 5MB. Please select a smaller image.',
      )
      return
    }

    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setWallpaper({
        type: 'custom',
        customDataUrl: dataUrl,
        blur: wallpaper.blur ?? 0,
        opacity: wallpaper.opacity ?? 0.85,
      })
    }
    reader.onerror = () => {
      setUploadError('Failed to read selected image file.')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <NewTabBranding />

      {/* Wallpaper & Background Customization */}
      <div
        className={cn(
          'space-y-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-500',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">
                Wallpaper & Background
              </h2>
            </div>
            <p className="text-muted-foreground text-xs">
              Choose a curated atmosphere or upload your own wallpaper. Saved
              automatically in extension storage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-accent/40 font-mono text-[11px] text-muted-foreground"
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Saved Locally
            </Badge>
            {wallpaper.type !== 'none' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWallpaper}
                className="flex h-7 items-center gap-1.5 px-2 text-muted-foreground text-xs hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to Default
              </Button>
            )}
          </div>
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Default Focus Grid */}
          <button
            type="button"
            onClick={clearWallpaper}
            className={cn(
              'group relative flex h-24 flex-col items-center justify-center overflow-hidden rounded-lg border p-3 text-left transition-all',
              wallpaper.type === 'none'
                ? 'border-primary bg-accent/30 ring-2 ring-primary/20'
                : 'border-border/60 hover:border-border hover:bg-accent/20',
            )}
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-40 transition-opacity group-hover:opacity-60" />
            <div className="absolute inset-0 bg-gradient-radial-focus opacity-50" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="font-medium text-foreground text-xs">
                Default Grid
              </span>
              <span className="text-[10px] text-muted-foreground">
                Original theme
              </span>
            </div>
            {wallpaper.type === 'none' && (
              <div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground shadow-sm">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>

          {/* Curated Presets */}
          {presets.map((preset) => {
            const isSelected =
              wallpaper.type === 'preset' && wallpaper.presetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setWallpaper({ type: 'preset', presetId: preset.id })
                }
                className={cn(
                  'group relative flex h-24 flex-col items-center justify-center overflow-hidden rounded-lg border p-3 text-left transition-all',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border/60 hover:scale-[1.02] hover:border-border',
                )}
                style={{ background: preset.style }}
              >
                <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="font-medium text-white text-xs drop-shadow-sm">
                    {preset.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}

          {/* Custom Upload Card */}
          <div
            className={cn(
              'relative flex h-24 flex-col items-center justify-center overflow-hidden rounded-lg border transition-all',
              wallpaper.type === 'custom'
                ? 'border-primary bg-accent/30 ring-2 ring-primary/20'
                : 'border-border/70 border-dashed hover:border-border hover:bg-accent/10',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="hidden"
            />
            {wallpaper.type === 'custom' && wallpaper.customDataUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-center bg-cover opacity-60"
                  style={{ backgroundImage: `url(${wallpaper.customDataUrl})` }}
                />
                <div className="absolute inset-0 bg-background/60" />
                <div className="relative z-10 flex flex-col items-center gap-1 text-center">
                  <span className="font-medium text-foreground text-xs">
                    Custom Image
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-6 px-2 text-[10px]"
                  >
                    Change Image
                  </Button>
                </div>
                <div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                <span className="font-medium text-xs">Upload Image</span>
                <span className="text-[10px] text-muted-foreground/80">
                  PNG, JPG, WebP (max 5MB)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Image Adjustments */}
        {wallpaper.type === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 border-border/40 border-t pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Blur:</span>
              {[0, 4, 8, 16].map((b) => (
                <Button
                  key={b}
                  variant={(wallpaper.blur ?? 0) === b ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setWallpaper({ ...wallpaper, blur: b })}
                  className="h-6 px-2 text-xs"
                >
                  {b === 0 ? 'None' : `${b}px`}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Opacity:</span>
              {[0.5, 0.75, 0.9, 1.0].map((o) => (
                <Button
                  key={o}
                  variant={
                    (wallpaper.opacity ?? 0.85) === o ? 'secondary' : 'ghost'
                  }
                  size="sm"
                  onClick={() => setWallpaper({ ...wallpaper, opacity: o })}
                  className="h-6 px-2 text-xs"
                >
                  {Math.round(o * 100)}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {uploadError && (
          <p className="text-destructive text-xs">{uploadError}</p>
        )}
      </div>

      <div
        className={cn(
          'space-y-3 transition-all duration-500',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <Label htmlFor="personalization">Your Information</Label>
        <MarkdownEditor
          id="personalization"
          value={personalization}
          autoFocus
          onChange={setPersonalization}
          placeholder="Tell Shimmy about yourself..."
          className="styled-scrollbar h-96 overflow-y-auto"
        />
        <p className="text-muted-foreground text-xs">
          Your information is saved locally and never leaves your device.
          Markdown formatting is supported.
        </p>
      </div>

      <div
        className={cn(
          'space-y-3 transition-all delay-100 duration-500',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Need help getting started?
        </h2>
        <div className="space-y-2">
          {sections.map((section) => (
            <Collapsible
              key={section.key}
              open={expandedSection === section.key}
              onOpenChange={(open) =>
                setExpandedSection(open ? section.key : null)
              }
              className="w-full rounded-xl border border-border/50 bg-card hover:border-border"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-auto w-full items-center justify-between p-4 text-left hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-foreground text-sm">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {section.description}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${expandedSection === section.key ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="space-y-3 px-4 pb-4">
                  <div>
                    <p className="mb-2 font-medium text-muted-foreground text-xs">
                      Template (click to copy):
                    </p>
                    <div className="relative">
                      <pre className="styled-scrollbar overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-accent/50 p-4 text-foreground text-xs">
                        {templates[section.key].template}
                      </pre>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => copyTemplate(section.key)}
                        className="absolute top-3 right-3"
                        title="Copy template"
                      >
                        {copiedSection === section.key ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-medium text-muted-foreground text-xs">
                      Example:
                    </p>
                    <pre className="styled-scrollbar overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border/30 bg-muted/30 p-4 text-muted-foreground text-xs">
                      {templates[section.key].example}
                    </pre>
                  </div>

                  <p className="text-muted-foreground text-xs">
                    Click the copy button to add this template to your
                    clipboard, then paste it into the text area above and
                    customize it.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
