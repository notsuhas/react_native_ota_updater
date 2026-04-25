/**
 * Authentication Middleware Module
 * Provides request authentication for the Hono API and sets up the user
 * context consumed by downstream routes.
 *
 * @module AuthMiddleware
 */

import { getSessionFromRequest } from "@rentlydev/rnota-auth/session";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { createFactoryMiddleware } from "@/api/lib/create/router";
import { STRINGS } from "@/api/utils/strings";

/**
 * Middleware that ensures the incoming request is authenticated and injects
 * a `user` (and optionally `accessKeyToken`) into the Hono context.
 *
 * Supports two authentication methods:
 * 1. **Bearer access-key (CLI)** — `Authorization: Bearer <access-key>`;
 *    looked up via `storage.getUserByAccessKeyToken`. Sets `accessKeyToken`
 *    in the context so release/deployment routes can record who pushed.
 * 2. **Better Auth session cookie (web)** — resolved via
 *    `auth.api.getSession`. No `accessKeyToken` is set for web sessions.
 *
 * The Bearer path is checked first so an explicit access-key on a browser
 * request wins over the ambient cookie.
 *
 * Context additions on success:
 * - `user: { id, email }`
 * - `accessKeyToken: string` (CLI only)
 *
 * @throws {Response} `401 Unauthorized` if neither method resolves a user
 *
 * @example
 * ```typescript
 * import { ensureAuthUser } from "./middlewares/ensure-auth";
 *
 * app.use("/management/*", ensureAuthUser);
 *
 * app.get("/management/profile", (c) => {
 *   const user = c.get("user");
 *   return c.json({ id: user.id, email: user.email });
 * });
 * ```
 *
 * @example
 * ```
 * # CLI access-key request
 * Authorization: Bearer <access-key>
 *
 * # Web session request
 * Cookie: better-auth.session_token=<session-token>
 * ```
 */
export const ensureAuthUser = createFactoryMiddleware(async (c, next) => {
	// Extract the Bearer token from the Authorization header if present.
	const authorizationHeader = c.req.header("Authorization") ?? "";
	const [, accessKey = ""] = authorizationHeader.split(" ");

	// CLI access-key path — unchanged from the NextAuth era.
	if (accessKey) {
		const storage = c.get("storage");
		const user = await storage.getUserByAccessKeyToken(accessKey);

		c.set("accessKeyToken", accessKey);
		c.set("user", {
			id: user.id,
			email: user.email,
		});

		return next();
	}

	// Web session path — Better Auth resolves the cookie-backed session via
	// a lookup against the `session` table.
	const session = await getSessionFromRequest(c.req.raw);

	if (!session?.user) {
		return c.text(STRINGS.UNAUTHORIZED, HttpStatusCodes.UNAUTHORIZED);
	}

	c.set("user", {
		id: session.user.id,
		email: session.user.email,
	});

	return next();
});
