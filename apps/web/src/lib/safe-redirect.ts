import { PAGES } from "@/web/lib/constants";

/**
 * Narrows an untrusted `callbackUrl` to a site-relative path.
 *
 * Anything that could leave the origin — absolute URLs, protocol-relative
 * `//evil.com`, backslash variants, or non-path values — falls back to the
 * home page rather than being followed (CWE-601).
 *
 * @param {string | null | undefined} callbackUrl - Raw value from the query string.
 * @returns {string} A safe same-origin path.
 *
 * @example
 * ```typescript
 * getSafeCallbackUrl("/settings");         // "/settings"
 * getSafeCallbackUrl("https://evil.com");  // "/"
 * getSafeCallbackUrl("//evil.com");        // "/"
 * ```
 */
export function getSafeCallbackUrl(callbackUrl: string | null | undefined): string {
	if (!callbackUrl?.startsWith("/")) return PAGES.HOME;
	if (callbackUrl.startsWith("//") || callbackUrl.startsWith("/\\")) return PAGES.HOME;

	return callbackUrl;
}
