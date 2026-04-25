/**
 * Account Schema Definition
 * This module defines the OAuth (and, if ever needed, credentials) provider
 * accounts linked to a user. Better Auth creates one row per
 * provider-per-user; on subsequent sign-ins the row is updated in place.
 *
 * @module AccountSchema
 *
 * Differences from the old `@auth/drizzle-adapter` shape:
 * - Single `id` primary key (was composite `(provider, providerAccountId)`)
 * - `provider` → `providerId`, `providerAccountId` → `accountId`
 * - OAuth token columns renamed to camelCase (`accessToken`, `refreshToken`,
 *   `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`)
 * - New `password` column for credentials logins (nullable; unused here)
 * - `type`, `token_type`, `session_state` columns dropped
 *
 * Timestamps use `mode: "date"` for Better Auth adapter compatibility.
 */

import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId, tableActions } from "./_table";
import { user } from "./user";

/**
 * Account Table Schema
 * Represents a third-party authentication identity linked to a user.
 * For this project we only wire up GitHub OAuth, but the shape supports
 * additional providers and the optional credentials flow.
 */
export const account = pgTable(
	"account",
	{
		/** Primary key — nanoid generated on insert. */
		id: text()
			.$defaultFn(() => generateId())
			.primaryKey()
			.notNull(),

		/**
		 * Identifier of the account at the provider (e.g. GitHub's numeric
		 * user id). Unique together with `providerId` logically, but not
		 * enforced as a composite constraint because Better Auth handles
		 * duplicate prevention at the application layer.
		 */
		accountId: text().notNull(),

		/** Provider name — `"github"` today. */
		providerId: text().notNull(),

		/** Owning user — cascades on delete/update. */
		userId: text()
			.notNull()
			.references(() => user.id, tableActions),

		/** OAuth access token. Nullable because it may not yet be exchanged. */
		accessToken: text(),

		/** OAuth refresh token. Nullable — GitHub apps often don't issue one. */
		refreshToken: text(),

		/** OIDC ID token. Unused for GitHub, kept for future providers. */
		idToken: text(),

		/** When the current `accessToken` expires; null if the provider didn't return one. */
		accessTokenExpiresAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }),

		/** When the current `refreshToken` expires. */
		refreshTokenExpiresAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }),

		/** Comma-separated OAuth scopes granted on this account. */
		scope: text(),

		/**
		 * Password hash for credentials provider. Left nullable because this
		 * project is OAuth-only — column exists so Better Auth can enable
		 * credentials later without a schema change.
		 */
		password: text(),

		/** Timestamp when this account row was first inserted. */
		createdAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),

		/** Timestamp of the last token refresh / row update. */
		updatedAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),
	},
	(table) => [
		// Index on user_id for fast "all linked accounts for user" lookups.
		index("account_user_id_idx").on(table.userId),
	],
);

/**
 * Account Relationships
 *
 * Relationships:
 * - user: The user this provider account belongs to
 */
export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
