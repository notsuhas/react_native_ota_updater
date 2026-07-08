/**
 * React client bindings for Better Auth.
 *
 * @module AuthReact
 *
 * Exposes the hooks and imperative helpers consumed by `apps/web`. The
 * underlying `authClient` is kept private because Better Auth's client
 * return type includes a `path-to-object` internal type that TypeScript
 * cannot name in emitted declaration files. Consumers should always
 * import the named helpers below.
 *
 * Behavioural differences from the previous `next-auth/react` setup:
 * - `SessionProvider` is no longer needed — `useSession` is backed by
 *   Better Auth's own client-side store
 * - `signIn(provider)` is now `signIn.social({ provider, callbackURL })`
 * - `useSession` returns `{ data, isPending, error, ... }` (was
 *   `{ data, status }` under next-auth); treat `isPending` like the old
 *   `status === "loading"`
 *
 * @example
 * ```tsx
 * "use client";
 * import { signIn, signOut, useSession } from "@rentlydev/rnota-auth/react";
 *
 * export function AuthButton() {
 *   const { data: session, isPending } = useSession();
 *   if (isPending) return <Skeleton />;
 *   if (!session) return (
 *     <button onClick={() => signIn.social({ provider: "github", callbackURL: "/" })}>
 *       Sign in with GitHub
 *     </button>
 *   );
 *   return <button onClick={() => signOut()}>Sign out</button>;
 * }
 * ```
 */

import { createAuthClient } from "better-auth/react";

const client = createAuthClient();

/**
 * React hook returning the active session (`{ data, isPending, error, ... }`).
 * `data` is `null` when unauthenticated.
 */
export const useSession = client.useSession;

/**
 * Imperative sign-in API. Use `signIn.social({ provider, callbackURL })`
 * for OAuth flows. Other methods (`signIn.email`, etc.) exist for the
 * providers we don't currently configure.
 */
export const signIn = client.signIn;

/**
 * Imperative sign-out. Clears the Better Auth session cookie and returns
 * once the server has invalidated the session row.
 */
export const signOut = client.signOut;

/**
 * Imperative session fetch (non-hook). Useful when you need the session
 * outside of React render — form submissions, event handlers, etc.
 */
export const getSession = client.getSession;
