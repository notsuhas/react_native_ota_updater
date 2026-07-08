/**
 * Next.js Proxy — Auth Gatekeeper
 * Runs on every matched request, resolves the Better Auth session via a
 * lookup against the `session` table, and redirects unauthenticated users
 * to the login page with the intended destination captured in `callbackUrl`.
 *
 * @module Proxy
 *
 * Notable config:
 * - Next 16 renamed the `middleware.ts` convention to `proxy.ts`. Proxy
 *   always runs on the Node.js runtime, so we no longer need the
 *   `runtime: "nodejs"` config export (Next rejects it here).
 * - `PUBLIC_PATHS` is an allowlist used to short-circuit the redirect on
 *   routes that would otherwise loop (`/login` redirecting to `/login?…`)
 *   or that must stay unauthenticated (`/api/auth/*` callbacks).
 * - `matcher` deliberately excludes `/api/*`, `_next/static`, `_next/image`,
 *   and common metadata files; API routes run their own auth via the Hono
 *   `ensureAuthUser` middleware.
 */

import { getSessionFromHeaders } from "@rentlydev/rnota-auth/session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Paths that should never trigger an auth redirect.
 *
 * - `/login` — destination of the redirect, would loop otherwise
 * - `/api/auth` — Better Auth's own endpoints (OAuth callbacks, session
 *   probes) must stay unauthenticated by definition
 *
 * @constant {readonly string[]}
 */
const PUBLIC_PATHS = ["/login", "/api/auth"] as const;

/**
 * Returns `true` when the incoming path is either one of the public paths
 * or a sub-path of one (so `/api/auth/callback/github` also matches).
 */
function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Proxy entry point.
 *
 * @param {NextRequest} req - Incoming Next.js request
 * @returns {Promise<NextResponse>} Either `NextResponse.next()` (authenticated
 *   or public) or `NextResponse.redirect(/login?callbackUrl=...)` for
 *   unauthenticated requests to protected routes.
 */
export default async function proxy(req: NextRequest) {
	if (isPublicPath(req.nextUrl.pathname)) {
		return NextResponse.next();
	}

	const session = await getSessionFromHeaders(req.headers);

	if (!session) {
		const signInUrl = new URL("/login", req.url);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

/**
 * Proxy config.
 * Matcher patterns are evaluated by Next.js against the pathname; the
 * `isPublicPath` check inside the handler is the second layer that
 * prevents redirect loops on `/login` and `/api/auth/*`.
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes — run their own Hono auth)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
		/**
		 * Protected routes that the exclusion pattern above would otherwise miss.
		 */
		"/cli-login",
		"/",
		"/codepush/(.*)",
		"/apps/(.*)",
	],
};
