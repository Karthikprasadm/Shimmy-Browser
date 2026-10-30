/**
 * @license
 * Copyright 2025 BrowserOS
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { requireTrustedOrigin } from '../../../src/api/middleware/require-trusted-origin'
import { resetAllowedOriginsForTesting } from '../../../src/api/utils/cors'

function buildApp() {
  return new Hono()
    .use('/*', requireTrustedOrigin())
    .get('/probe', (c) => c.json({ ok: true }))
    .post('/probe', (c) => c.json({ ok: true, method: 'POST' }))
}

describe('requireTrustedOrigin', () => {
  const previousEnv = process.env.BROWSEROS_TRUSTED_ORIGINS

  beforeEach(() => {
    process.env.BROWSEROS_TRUSTED_ORIGINS = 'chrome-extension://allowed'
    resetAllowedOriginsForTesting()
  })
  afterEach(() => {
    process.env.BROWSEROS_TRUSTED_ORIGINS = previousEnv
    resetAllowedOriginsForTesting()
  })

  it('passes when no Origin header is set', async () => {
    const res = await buildApp().request('/probe')
    expect(res.status).toBe(200)
  })

  it('passes when Origin matches the allowlist', async () => {
    const res = await buildApp().request('/probe', {
      headers: { Origin: 'chrome-extension://allowed' },
    })
    expect(res.status).toBe(200)
  })

  it('rejects with 403 when Origin is unknown', async () => {
    const res = await buildApp().request('/probe', {
      headers: { Origin: 'https://example.com' },
    })
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('FORBIDDEN_ORIGIN')
  })

  it('rejects with 403 when Origin is the literal "null"', async () => {
    const res = await buildApp().request('/probe', {
      headers: { Origin: 'null' },
    })
    expect(res.status).toBe(403)
  })

  it('rejects POST with disallowed Origin without invoking the route handler', async () => {
    const app = new Hono()
      .use('/*', requireTrustedOrigin())
      .post('/probe', () => {
        throw new Error('handler must not run')
      })

    const res = await app.request('/probe', {
      method: 'POST',
      headers: { Origin: 'https://example.com' },
    })
    expect(res.status).toBe(403)
  })

  it('rejects port mismatches even when host matches', async () => {
    process.env.BROWSEROS_TRUSTED_ORIGINS = 'http://localhost:5173'
    resetAllowedOriginsForTesting()
    const res = await buildApp().request('/probe', {
      headers: { Origin: 'http://localhost:5174' },
    })
    expect(res.status).toBe(403)
  })

  it('treats the allowlist as case-sensitive', async () => {
    const res = await buildApp().request('/probe', {
      headers: { Origin: 'CHROME-EXTENSION://allowed' },
    })
    expect(res.status).toBe(403)
  })

  it('allows Windows 11 IPv6 [::1] origin when localhost is allowlisted', async () => {
    process.env.BROWSEROS_TRUSTED_ORIGINS = 'http://localhost:5173'
    resetAllowedOriginsForTesting()

    // Windows 11 fetch("http://localhost:5173") resolving to ::1 / [::1]
    const resIpv6 = await buildApp().request('/probe', {
      headers: { Origin: 'http://[::1]:5173' },
    })
    expect(resIpv6.status).toBe(200)

    // IPv4 127.0.0.1
    const resIpv4 = await buildApp().request('/probe', {
      headers: { Origin: 'http://127.0.0.1:5173' },
    })
    expect(resIpv4.status).toBe(200)

    // Port mismatch on [::1] rejected
    const resMismatch = await buildApp().request('/probe', {
      headers: { Origin: 'http://[::1]:5174' },
    })
    expect(resMismatch.status).toBe(403)
  })
})
