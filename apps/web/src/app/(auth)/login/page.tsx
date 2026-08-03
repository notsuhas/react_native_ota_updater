/**
 * Login Page (Server Component)
 * Renders the GitHub OAuth entry card. Resolves the current session
 * server-side and short-circuits to `callbackUrl` when already signed in,
 * so a refresh of `/login` never shows the form to an authenticated user.
 *
 * @module LoginPage
 *
 * Notable choices:
 * - Uses Better Auth's `getSessionFromHeaders(await headers())` instead of
 *   the old next-auth `auth()` server call; the underlying mechanism is a
 *   cookie → `session` row lookup, not a JWT decode
 * - `callbackUrl` is narrowed by `getSafeCallbackUrl` before any redirect, and
 *   is forwarded into the client `GithubSignInButton` via `useSearchParams`
 */

import { getSessionFromHeaders } from "@rentlydev/rnota-auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import GithubSignInButton from "@/web/components/github-button";
import GithubSignInButtonLoading from "@/web/components/github-button/loading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/web/components/ui/card";
import { getSafeCallbackUrl } from "@/web/lib/safe-redirect";
import pkgJson from "../../../../package.json";

/**
 * Props passed by the Next.js App Router.
 */
interface LoginPageProps {
	/** Async query params — `callbackUrl` is captured by the middleware's redirect. */
	searchParams: Promise<{ callbackUrl: string | undefined }>;
}

/**
 * LoginPage server component.
 *
 * @param {LoginPageProps} props - Next.js App Router props
 * @returns {Promise<JSX.Element>} The login card, or a server-side
 *   redirect when the request already carries a valid session cookie.
 *
 * @example
 * ```
 * GET /login                         → renders the card
 * GET /login?callbackUrl=%2Fsettings → renders the card; after sign-in
 *                                      the user lands on /settings
 * GET /login (with valid cookie)     → 307 redirect to callbackUrl
 * ```
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { callbackUrl } = await searchParams;
	const session = await getSessionFromHeaders(await headers());

	if (session) redirect(getSafeCallbackUrl(callbackUrl));

	return (
		<div className="w-full max-w-sm">
			<div className="flex flex-col gap-6 items-center">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">React-Native OTA Updater</CardTitle>
						<CardDescription>Welcome Back!</CardDescription>
					</CardHeader>

					<CardContent>
						<form>
							<div className="flex flex-col gap-6">
								<Suspense fallback={<GithubSignInButtonLoading />}>
									<GithubSignInButton />
								</Suspense>
							</div>
						</form>
					</CardContent>
				</Card>

				<p className="text-sm text-muted-foreground">v{pkgJson.version}</p>
			</div>
		</div>
	);
}
