/**
 * App-wide Providers
 * Wraps the Next.js App Router tree with the client-only providers the app
 * depends on (URL-state, theme, React Query, toasts, top loader).
 *
 * @module Providers
 *
 * Notable differences from the previous next-auth wiring:
 * - No `<SessionProvider>` — Better Auth's `useSession` is backed by its
 *   own client-side store and does not need a context provider. Components
 *   can call `useSession()` directly from `@rentlydev/rnota-auth/react`.
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import ThemeProvider from "@/web/components/providers/ThemeToggle/theme-provider";
import { Toaster } from "@/web/components/ui/sonner";

import { getQueryClient } from "@/web/lib/query-client";

/**
 * Root providers wrapper.
 * Mounted once in `apps/web/src/app/layout.tsx` around `{children}`.
 *
 * @param {React.PropsWithChildren} props
 * @returns {JSX.Element}
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import Providers from "@/web/components/providers/providers";
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html><body>
 *       <Providers>{children}</Providers>
 *     </body></html>
 *   );
 * }
 * ```
 */
export default function Providers({ children }: React.PropsWithChildren) {
	const queryClient = getQueryClient();

	return (
		<NuqsAdapter>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				<QueryClientProvider client={queryClient}>
					<NextTopLoader showSpinner={false} />

					{children}

					<Toaster />
					<ReactQueryDevtools />
				</QueryClientProvider>
			</ThemeProvider>
		</NuqsAdapter>
	);
}
