/**
 * @license
 * Copyright 2025 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { MiddlewareHandler } from 'hono'
import { isAllowedOrigin, LOOPBACK_HOSTS } from '../utils/cors'

export { isAllowedOrigin, LOOPBACK_HOSTS }

/**
 * Middleware that rejects requests with an Origin header that is not trusted.
 * Requests without an Origin header are allowed to proceed (e.g. non-browser clients,
 * CLI tools, or service workers).
 *
 * For loopback origins, [::1] (IPv6) is explicitly included in allowed origin checks
 * alongside 127.0.0.1 and localhost to handle Windows 11 and dual-stack origin resolution.
 */
export function requireTrustedOrigin(): MiddlewareHandler {
  return async (c, next) => {
    const origin = c.req.header('Origin')
    if (origin !== undefined && !isAllowedOrigin(origin)) {
      return c.json(
        {
          error: {
            name: 'ForbiddenOrigin',
            message: 'Origin not allowed',
            code: 'FORBIDDEN_ORIGIN',
            statusCode: 403,
          },
        },
        403,
      )
    }
    return next()
  }
}
