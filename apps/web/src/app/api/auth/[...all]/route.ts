/**
 * Better Auth route handler mount point.
 * Catches every `/api/auth/*` request and forwards it to Better Auth,
 * which exposes sign-in, sign-out, OAuth callback, session probe, and
 * verification endpoints under this prefix.
 *
 * @module AuthRoute
 *
 * @example
 * ```
 * POST /api/auth/sign-in/social      # triggers the GitHub OAuth redirect
 * GET  /api/auth/callback/github     # handles the OAuth callback
 * GET  /api/auth/get-session         # returns the current session (or null)
 * POST /api/auth/sign-out            # clears the session cookie + row
 * ```
 */

import { handlers } from "@rentlydev/rnota-auth";

export const { GET, POST } = handlers;
