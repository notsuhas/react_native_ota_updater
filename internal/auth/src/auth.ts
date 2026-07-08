/**
 * Better Auth module — wires the framework-agnostic Better Auth core to
 * our Drizzle/Postgres stack, GitHub OAuth, and the codepush admin-grant
 * behaviour carried over from the previous next-auth setup.
 *
 * @module Auth
 *
 * Features:
 * - Drizzle adapter with the `user` / `session` / `account` / `verification`
 *   tables defined in `@rentlydev/rnota-db`
 * - GitHub OAuth social provider
 * - Database-backed sessions (cookie carries a session token; the row lives
 *   in the `session` table) with a 1-hour expiry
 * - `accountLinking` enabled with GitHub as a trusted provider — existing
 *   users sign in and get their old `user.id` auto-linked to a fresh
 *   `account` row by verified email match
 * - `databaseHooks.user.create.before` and `databaseHooks.session.create.before`
 *   enforce the optional `AUTH_ALLOWED_DOMAIN` email-domain allowlist on
 *   both first sign-up and every subsequent login — the verified OAuth
 *   email is on the user object at this stage, unlike `hooks.before` on
 *   `/callback` which runs before the profile is fetched. Gating session
 *   creation as well covers users that pre-date the env var being set
 *   (or pre-date the env var being tightened to a stricter domain)
 * - `databaseHooks.user.create.after` and `databaseHooks.session.create.after`
 *   port the old `events.createUser` / `events.signIn` admin-grant behaviour
 * - `handlers` re-export wraps the Better Auth handler for the Next.js App
 *   Router — consumers can keep the same `import { handlers }` shape
 */

import {
	ADMIN_USER_EMAILS,
	account,
	codepush_collaborator,
	db,
	Permission,
	session,
	user,
	verification,
} from "@rentlydev/rnota-db";
import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { toNextJsHandler } from "better-auth/next-js";

import env from "./env";

/**
 * Session lifetime in seconds.
 * Matches the previous next-auth JWT `maxAge` so existing UX stays the same.
 *
 * @constant {number}
 */
const SESSION_EXPIRES_IN = 60 * 60;

/**
 * Grants admin-level collaborator access on every existing codepush app to a
 * user whose email is in `ADMIN_USER_EMAILS`. No-op for non-admin emails.
 *
 * Called from:
 * - `databaseHooks.user.create.after` — covers first-time sign-in
 * - `databaseHooks.session.create.after` — covers subsequent sign-ins so
 *   admins pick up apps that were created after they first logged in
 *
 * @param {string} userId - ID of the user row to grant access to
 * @param {string | null | undefined} email - Email of the user; used for the admin check
 * @returns {Promise<void>}
 */
async function grantAdminAccessToAllApps(userId: string, email: string | null | undefined): Promise<void> {
	if (!email || !ADMIN_USER_EMAILS.includes(email as (typeof ADMIN_USER_EMAILS)[number])) return;

	console.log(`👑 Admin user detected: ${email}`);
	const codepushApps = await db.query.codepush_app.findMany();
	if (codepushApps.length === 0) return;

	await db
		.insert(codepush_collaborator)
		.values(
			codepushApps.map((app) => ({
				userId,
				appId: app.id,
				permission: Permission.ADMIN,
			})),
		)
		.onConflictDoNothing();

	console.log(`✨ Admin user ${email} granted access to all codepush apps`);
}

/**
 * Better Auth configuration.
 *
 * Typed explicitly as `BetterAuthOptions` (rather than relying on inference)
 * so the inferred type of the exported `auth` below collapses to the public
 * `Auth` shape — otherwise TypeScript's declaration emitter needs to name
 * deep internals like `@better-auth/core/dist/types/init-options.mjs` and
 * emits TS2742 "inferred type cannot be named" in consumers.
 *
 * @constant {BetterAuthOptions}
 */
const authOptions: BetterAuthOptions = {
	baseURL: env.AUTH_URL,
	secret: env.AUTH_SECRET,

	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user, session, account, verification },
	}),

	session: {
		expiresIn: SESSION_EXPIRES_IN,
	},

	socialProviders: {
		github: {
			clientId: env.AUTH_GITHUB_ID,
			clientSecret: env.AUTH_GITHUB_SECRET,
		},
	},

	/**
	 * Trust GitHub's verified emails and link OAuth sign-ins to any existing
	 * `user` row with the same email. This is what makes the path-1 migration
	 * work — dropping the old `account` rows is safe because Better Auth
	 * re-creates them and links them back to the pre-existing `user.id` here.
	 */
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["github"],
		},
	},

	databaseHooks: {
		user: {
			create: {
				/**
				 * Pre-creation domain allowlist enforcement.
				 *
				 * If `AUTH_ALLOWED_DOMAIN` is configured, reject sign-up for
				 * any verified email that doesn't match. Runs after Better
				 * Auth has fetched the OAuth profile but before the `user`
				 * row is inserted, so the OAuth flow returns FORBIDDEN
				 * instead of leaking through with a created account.
				 *
				 * Example:
				 * ```
				 * AUTH_ALLOWED_DOMAIN="@company.com"
				 * // user@company.com → allowed
				 * // user@other.com  → FORBIDDEN APIError
				 * ```
				 */
				before: async (newUser) => {
					if (env.AUTH_ALLOWED_DOMAIN && !newUser.email.endsWith(env.AUTH_ALLOWED_DOMAIN)) {
						throw new APIError("FORBIDDEN", {
							message: `Sign-in is restricted to ${env.AUTH_ALLOWED_DOMAIN} accounts.`,
						});
					}
				},
				/**
				 * Fires once on first-ever sign-in, when Better Auth creates
				 * the user row. Grants admin collaborator access if the email
				 * matches the admin allowlist.
				 */
				after: async (createdUser) => {
					await grantAdminAccessToAllApps(createdUser.id, createdUser.email);
				},
			},
		},
		session: {
			create: {
				/**
				 * Per-login domain allowlist enforcement.
				 *
				 * Fires on every session creation, including for users that
				 * already existed when `AUTH_ALLOWED_DOMAIN` was set or who
				 * predate a tightening of the allowed suffix. The
				 * `user.create.before` hook above only covers first-time
				 * sign-ups, so without this check a returning user with a
				 * non-matching email would still be admitted.
				 *
				 * Returns `false` rather than throwing because the OAuth
				 * callback flow only catches `APIError` thrown from the
				 * user-creation path (`handleOAuthUserInfo` wraps
				 * `createOAuthUser` in a try/catch). The `createSession`
				 * call sits outside that try/catch, so a thrown error here
				 * would escape the callback as a 403 JSON instead of a
				 * redirect. Returning `false` makes `createSession` resolve
				 * to `null`, which `handleOAuthUserInfo` converts into a
				 * clean error redirect — the same failure shape the new-user
				 * path produces.
				 */
				before: async (newSession) => {
					if (!env.AUTH_ALLOWED_DOMAIN) return;
					const owner = await db.query.user.findFirst({
						where: (u, { eq }) => eq(u.id, newSession.userId),
					});
					if (owner && !owner.email.endsWith(env.AUTH_ALLOWED_DOMAIN)) {
						console.warn(
							`Blocking sign-in for ${owner.email} — does not match AUTH_ALLOWED_DOMAIN=${env.AUTH_ALLOWED_DOMAIN}`,
						);
						return false;
					}
				},
				/**
				 * Fires on every login (new session row). Re-runs the admin
				 * grant so admins pick up apps that were created after they
				 * first signed in — matches the old `events.signIn` behaviour.
				 */
				after: async (createdSession) => {
					const owner = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.id, createdSession.userId) });
					if (owner) {
						await grantAdminAccessToAllApps(owner.id, owner.email);
					}
				},
			},
		},
	},
};

/**
 * Configured Better Auth instance.
 *
 * Exported as the single source of truth for server-side auth operations:
 * session retrieval (`auth.api.getSession`), request handling
 * (`auth.handler` / `handlers`), and the OpenAPI-like inferrable types
 * (`typeof auth.$Infer.Session`).
 *
 * @constant {Auth}
 *
 * @example
 * ```typescript
 * // Server-side session lookup (Hono, Next route handler, server component)
 * const session = await auth.api.getSession({ headers: req.headers });
 * if (!session) return new Response("Unauthorized", { status: 401 });
 * ```
 */
export const auth: Auth = betterAuth(authOptions);

/**
 * Next.js App Router route handlers (GET + POST).
 * Imported by `apps/web/src/app/api/auth/[...all]/route.ts`; exposes the
 * standard `{ GET, POST }` shape so the consumer file stays one line.
 *
 * @constant {ReturnType<typeof toNextJsHandler>}
 *
 * @example
 * ```typescript
 * // apps/web/src/app/api/auth/[...all]/route.ts
 * import { handlers } from "@rentlydev/rnota-auth";
 * export const { GET, POST } = handlers;
 * ```
 */
export const handlers = toNextJsHandler(auth);
