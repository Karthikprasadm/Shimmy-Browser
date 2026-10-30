export const COMPOSER_FOCUS_EVENT = 'browseros:focus-composer'

export const focusComposerInput = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMPOSER_FOCUS_EVENT))
  }
  if (typeof document !== 'undefined') {
    requestAnimationFrame(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[data-composer-input]',
      )
      if (textarea) {
        textarea.focus()
        const len = textarea.value.length
        textarea.setSelectionRange(len, len)
      }
    })
  }
}
