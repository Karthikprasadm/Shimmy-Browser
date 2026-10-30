import { describe, expect, it } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { KlavisStatusBadge } from './KlavisStatusBadge'

describe('KlavisStatusBadge', () => {
  it('renders checking badge when loading', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, { status: 'loading' }),
    )
    expect(html).toContain('Checking Klavis...')
  })

  it('renders unconfigured badge with amber styling when credentials are unconfigured', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, { status: 'unconfigured' }),
    )
    expect(html).toContain('Klavis: Credentials Unconfigured')
    expect(html).toContain('text-amber-600')
  })

  it('renders unreachable badge with destructive styling when cloud service is unreachable', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, { status: 'unreachable' }),
    )
    expect(html).toContain('Klavis: Service Unreachable')
    expect(html).toContain('text-destructive')
  })

  it('renders connected badge with emerald styling when cloud service is connected', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, { status: 'connected' }),
    )
    expect(html).toContain('Klavis: Connected')
    expect(html).toContain('text-emerald-600')
    expect(html).not.toContain('Retry Handshake')
  })

  it('renders direct Retry Handshake button when unreachable and onRetry is provided', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, {
        status: 'unreachable',
        onRetry: () => {},
      }),
    )
    expect(html).toContain('Klavis: Service Unreachable')
    expect(html).toContain('Retry Handshake')
    expect(html).toContain('title="Retry Klavis handshake"')
  })

  it('renders direct Retry Handshake button when unconfigured and onRetry is provided', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, {
        status: 'unconfigured',
        onRetry: () => {},
      }),
    )
    expect(html).toContain('Klavis: Credentials Unconfigured')
    expect(html).toContain('Retry Handshake')
    expect(html).toContain('title="Retry Klavis handshake"')
  })

  it('displays spinning animation and disabled attribute when isRetrying is true', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, {
        status: 'unreachable',
        onRetry: () => {},
        isRetrying: true,
      }),
    )
    expect(html).toContain('Retry Handshake')
    expect(html).toContain('animate-spin')
    expect(html).toContain('disabled=""')
  })

  it('does not render Retry Handshake button when onRetry is omitted', () => {
    const html = renderToStaticMarkup(
      createElement(KlavisStatusBadge, { status: 'unreachable' }),
    )
    expect(html).toContain('Klavis: Service Unreachable')
    expect(html).not.toContain('Retry Handshake')
  })
})
