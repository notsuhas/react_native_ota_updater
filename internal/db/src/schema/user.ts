/**
 * User Schema Definition
 * This module defines the core user table and its relationships with
 * sessions, OAuth accounts, and CLI access keys. The shape matches Better
 * Auth's expected `user` table.
 *
 * @module UserSchema
 *
 * Notable column choices:
 * - `emailVerified` is a `boolean` (not a nullable timestamp) — Better Auth
 *   only tracks whether the email is verified, not when
 * - All timestamps use `mode: "date"` because Better Auth's Drizzle adapter
 *   passes `Date` objects when inserting rows; the Postgres column type is
 *   still `timestamp(0) with time zone` — only the JS/TS mapping differs
 */

import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId } from "./_table";
import { accessKey } from "./access-key";
import { account } from "./account";
import { session } from "./session";

/**
 * User Table Schema
 * Represents the core user entity. Rows survive the NextAuth → Better Auth
 * migration unchanged (only the `email_verified` column type was altered).
 */
export const user = pgTable(
	"user",
	{
		/** Primary key — nanoid generated on insert. */
		id: text()
			.$defaultFn(() => generateId())
			.primaryKey()
			.notNull(),

		/** Display name provided by the OAuth provider. */
		name: text().notNull(),

		/** Email address (unique, used by `accountLinking` to re-link old users). */
		email: text().notNull().unique(),

		/** URL to the user's profile image (nullable — not every provider returns one). */
		image: text(),

		/**
		 * Whether the email has been verified by the provider.
		 * For GitHub OAuth this is implicitly `true`; for other providers or
		 * credential flows it must be set explicitly.
		 */
		emailVerified: boolean().default(false).notNull(),

		/** Timestamp when the row was first inserted. */
		createdAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),

		/** Timestamp of the last modification. */
		updatedAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),
	},
	(table) => [
		// Index on email for fast lookups during account linking and admin grant.
		index("user_email_idx").on(table.email),
	],
);

/**
 * User Relationships
 *
 * Relationships:
 * - accounts: OAuth provider accounts linked to this user
 * - sessions: Active Better Auth sessions (DB-backed)
 * - accessKeys: CLI bearer tokens owned by this user
 */
export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	accessKeys: many(accessKey),
}));
