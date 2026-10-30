/**
 * @license
 * Copyright 2025 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { cors } from 'hono/cors'
import { logger } from '../../lib/logger'

export type CorsOptions = Parameters<typeof cors>[0]

const STATIC_ALLOWED_ORIGINS = new Set<string>([
  'chrome-extension://bflpfmnmnokmjhmgnolecpppdbdophmk',
])
const EXTENSION_PROTOCOLS = new Set(['chrome-extension:', 'moz-extension:'])

let cachedAllowedOrigins: Set<string> | null = null

/**
 * Converts configured URLs into the exact origin strings browsers send.
 * Extension origins need special handling because URL.origin is "null" for them.
 */
function normalizeTrustedOrigin(value: string): string | null {
  try {
    const url = new URL(value)
    const isExtensionOrigin = EXTENSION_PROTOCOLS.has(url.protocol)
    const normalized = isExtensionOrigin
      ? `${url.protocol}//${url.host}`
      : url.origin

    if (normalized === 'null' || url.host.length === 0) {
      logger.warn('Ignoring invalid BROWSEROS_TRUSTED_ORIGINS entry', {
        value,
      })
      return null
    }

    if (normalized !== value) {
      logger.warn('Normalized BROWSEROS_TRUSTED_ORIGINS entry to origin', {
        value,
        normalized,
      })
    }

    return normalized
  } catch {
    logger.warn('Ignoring invalid BROWSEROS_TRUSTED_ORIGINS entry', { value })
    return null
  }
}

export const LOOPBACK_HOSTS = new Set([
  '127.0.0.1',
  'localhost',
  '[::1]',
  '::1',
])

export const LOOPBACK_HOST_VARIANTS = [
  'localhost',
  '127.0.0.1',
  '[::1]',
] as const

function expandLoopbackOrigins(origins: string[]): string[] {
  const result: string[] = []
  for (const origin of origins) {
    result.push(origin)
    try {
      const url = new URL(origin)
      if (LOOPBACK_HOSTS.has(url.hostname)) {
        for (const variant of LOOPBACK_HOST_VARIANTS) {
          result.push(
            `${url.protocol}//${variant}${url.port ? `:${url.port}` : ''}`,
          )
        }
      }
    } catch {
      // Non-parseable or special scheme, keep as-is
    }
  }
  return result
}

function buildAllowedOrigins(): Set<string> {
  const fromEnv = (process.env.BROWSEROS_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(normalizeTrustedOrigin)
    .filter((value): value is string => value !== null)
  return new Set([...STATIC_ALLOWED_ORIGINS, ...expandLoopbackOrigins(fromEnv)])
}

function getAllowedOrigins(): Set<string> {
  if (!cachedAllowedOrigins) {
    cachedAllowedOrigins = buildAllowedOrigins()
  }
  return cachedAllowedOrigins
}

export function resetAllowedOriginsForTesting(): void {
  cachedAllowedOrigins = null
}

export function isAllowedOrigin(origin: string): boolean {
  const allowed = getAllowedOrigins()
  if (allowed.has(origin)) {
    return true
  }

  try {
    const url = new URL(origin)
    if (url.origin !== origin) {
      return false
    }

    if (LOOPBACK_HOSTS.has(url.hostname)) {
      for (const variant of LOOPBACK_HOST_VARIANTS) {
        const candidate = `${url.protocol}//${variant}${url.port ? `:${url.port}` : ''}`
        if (allowed.has(candidate)) {
          return true
        }
      }
    }
  } catch {
    // Malformed origin URL
  }

  return false
}

export const defaultCorsConfig: CorsOptions = {
  origin: (origin: string | undefined) => {
    if (origin && isAllowedOrigin(origin)) return origin
    return null
  },
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}
