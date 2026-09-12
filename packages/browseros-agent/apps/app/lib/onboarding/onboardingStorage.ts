import { storage } from '@wxt-dev/storage'

export const importHintDismissedAtStorage = storage.defineItem<number | null>(
  'local:importHintDismissedAt',
  { fallback: null },
)

export const authRedirectPathStorage = storage.defineItem<string | null>(
  'local:authRedirectPath',
  { fallback: null },
)

export const firstRunConfettiShownStorage = storage.defineItem<boolean>(
  'local:firstRunConfettiShown',
  { fallback: false },
)

// Tracks whether the initial onboarding tab has ever been auto-opened.
// This prevents showing onboarding on every startup/reinstall-like event.
export const onboardingShownOnceStorage = storage.defineItem<boolean>(
  'local:onboardingShownOnce',
  { fallback: false },
)
