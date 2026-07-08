/**
 * GitHub Sign-in Button
 * Renders the primary OAuth entry point on the login page, plus an
 * "auto sign-in on next visit" opt-in checkbox.
 *
 * @module GithubSignInButton
 *
 * Features:
 * - Initiates the Better Auth GitHub OAuth flow via
 *   `signIn.social({ provider: "github", callbackURL })`
 * - Honours the `callbackUrl` query parameter so users land on the page
 *   they were trying to reach before the redirect to `/login`
 * - Auto-login opt-in persisted in a cookie; redirects the user straight
 *   into the OAuth flow on subsequent visits unless they've manually
 *   signed out
 * - Uses `isPending` from Better Auth's `useSession` (the replacement for
 *   next-auth's `status === "loading"`)
 */

"use client";

import { signIn, useSession } from "@rentlydev/rnota-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import LoadingSpinner from "@/web/components/loading-spinner";
import { Button } from "@/web/components/ui/button";
import { Checkbox } from "@/web/components/ui/checkbox";
import { Icons } from "@/web/components/ui/icons";
import { PAGES } from "@/web/lib/constants";
import { clearUserLoggedOut, getAutoLoginCookie, hasUserLoggedOut, setAutoLoginCookie } from "@/web/lib/cookie";

/**
 * GithubSignInButton component.
 *
 * @returns {JSX.Element} A button that initiates GitHub OAuth, plus a
 *   checkbox that toggles the auto-login cookie.
 *
 * @example
 * ```tsx
 * // apps/web/src/app/(auth)/login/page.tsx
 * <Suspense fallback={<GithubSignInButtonLoading />}>
 *   <GithubSignInButton />
 * </Suspense>
 * ```
 */
export default function GithubSignInButton() {
	const { data: session, isPending } = useSession();
	const [isLoading, startTransition] = useTransition();
	const [autoLogin, setAutoLogin] = useState(false);
	const [isLoggedOut, setIsLoggedOut] = useState(false);

	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? PAGES.HOME;

	// On mount, hydrate the two cookie-backed flags from the browser.
	useEffect(() => {
		const isManuallyLoggedOut = hasUserLoggedOut();
		setIsLoggedOut(isManuallyLoggedOut);
		if (!isManuallyLoggedOut) {
			setAutoLogin(getAutoLoginCookie());
		}
	}, []);

	// Toast on successful authentication and clear the "manually logged out" flag.
	useEffect(() => {
		if (session?.user) {
			toast.success("Signed In Successfully!");
			clearUserLoggedOut();
		}
	}, [session]);

	// Auto-login flow — trigger OAuth automatically when:
	// 1. The user opted in
	// 2. The session has finished loading and is unauthenticated
	// 3. The user has not manually logged out from this browser
	useEffect(() => {
		if (autoLogin && !isPending && !session && !isLoggedOut) {
			toast.info("Signing in automatically...");
			signIn.social({ provider: "github", callbackURL: callbackUrl });
		}
	}, [autoLogin, isPending, session, callbackUrl, isLoggedOut]);

	/**
	 * Manual sign-in click handler. Wrapped in a React transition so the
	 * button disables while the redirect is kicked off.
	 */
	const onClickHandler = () => {
		startTransition(async () => {
			await signIn.social({ provider: "github", callbackURL: callbackUrl });
			clearUserLoggedOut();
		});
	};

	/**
	 * Auto-login checkbox handler. Persists the choice to a cookie so the
	 * next visit can read it server-agnostically.
	 */
	const handleAutoLoginChange = (checked: boolean) => {
		setAutoLogin(checked);
		setAutoLoginCookie(checked);
	};

	return (
		<div className="flex flex-col gap-6 items-center">
			<Button type="button" onClick={onClickHandler} disabled={isLoading} className="w-full">
				{isLoading ? <LoadingSpinner /> : <Icons.github />}
				Continue with GitHub
			</Button>

			<div className="flex items-center space-x-2">
				<Checkbox id="auto-login" checked={autoLogin} onCheckedChange={handleAutoLoginChange} />
				<label
					htmlFor="auto-login"
					className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
				>
					Sign in automatically
				</label>
			</div>
		</div>
	);
}
