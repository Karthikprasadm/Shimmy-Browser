/**
 * @license
 * Copyright 2025 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Context } from 'hono'
import type { Env } from '../types'
import { LOOPBACK_HOSTS } from './cors'

const LOCALHOST_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function extractHostname(host: string): string {
  if (host.startsWith('[')) {
    const closingBracket = host.indexOf(']')
    return closingBracket !== -1 ? host.slice(0, closingBracket + 1) : host
  }
  if (host === '::1') {
    return '::1'
  }
  return host.split(':')[0]
}

export function isLocalhostRequest(c: Context<Env>): boolean {
  const server = c.env?.server
  if (!server) return false
  const request = c.req.raw

  const socketAddr = server.requestIP(request)
  if (!socketAddr || !LOCALHOST_ADDRESSES.has(socketAddr.address)) {
    return false
  }

  const host = c.req.header('host')
  if (!host) return false
  const hostname = extractHostname(host)
  if (!LOOPBACK_HOSTS.has(hostname)) return false

  const referer = c.req.header('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      if (!LOOPBACK_HOSTS.has(url.hostname)) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}
