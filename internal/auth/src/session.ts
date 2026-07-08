/**
 * Server-side session helpers.
 *
 * @module Session
 *
 * Replaces the old `jwt.ts` module. Under next-auth we validated a JWT
 * cookie with `getToken()`; Better Auth uses database-backed sessions, so
 * we resolve the session by forwarding the incoming cookie headers to
 * `auth.api.getSession`, which in turn reads the `session` row.
 *
 * Two thin helpers are exported because callers have the headers in
 * different shapes:
 * - `getSessionFromRequest` — Hono / Next route handler (`c.req.raw`, `Request`)
 * - `getSessionFromHeaders` — Next.js App Router middleware / server components
 *   (output of `headers()` or `NextRequest.headers`)
 */

import { auth } from "./auth";

/**
 * Resolves the current session from an incoming `Request` object.
 * Returns `null` if there is no valid session cookie.
 *
 * @param {Request} req - An incoming fetch-style request. The Hono API's
 *   `c.req.raw` and Next.js route-handler `Request` both satisfy this.
 * @returns {Promise<Awaited<ReturnType<typeof auth.api.getSession>>>}
 *   The session + user, or `null` when unauthenticated.
 *
 * @example
 * ```typescript
 * // packages/api/src/middlewares/ensure-auth.ts
 * const session = await getSessionFromRequest(c.req.raw);
 * if (!session) return c.text("Unauthorized", 401);
 * c.set("user", { id: session.user.id, email: session.user.email });
 * ```
 */
export const getSessionFromRequest = (req: Request) => auth.api.getSession({ headers: req.headers });

/**
 * Resolves the current session from a pre-collected `Headers` object.
 * Preferred for Next.js server components and middleware where you already
 * have `await headers()` or `req.headers`.
 *
 * @param {Headers} headers - The collected request headers. Better Auth
 *   reads the session cookie out of these.
 * @returns {Promise<Awaited<ReturnType<typeof auth.api.getSession>>>}
 *   The session + user, or `null` when unauthenticated.
 *
 * @example
 * ```typescript
 * // apps/web/src/app/(auth)/login/page.tsx
 * import { headers } from "next/headers";
 * import { getSessionFromHeaders } from "@rentlydev/rnota-auth/session";
 *
 * const session = await getSessionFromHeaders(await headers());
 * if (session) redirect("/");
 * ```
 *
 * @example
 * ```typescript
 * // apps/web/src/middleware.ts
 * const session = await getSessionFromHeaders(req.headers);
 * if (!session) return NextResponse.redirect(new URL("/login", req.url));
 * ```
 */
export const getSessionFromHeaders = (headers: Headers) => auth.api.getSession({ headers });
