/**
 * Session Schema Definition
 * This module defines the structure for Better Auth's database-backed
 * sessions. A fresh row is inserted on every login; the cookie set in the
 * browser carries the `token` column's value, and `auth.api.getSession`
 * looks the row up to resolve the current user.
 *
 * @module SessionSchema
 *
 * Shape matches Better Auth's default `session` table.
 * Timestamps use `mode: "date"` because Better Auth's adapter passes `Date`
 * objects; the Postgres column type remains `timestamp(0) with time zone`.
 */

import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId, tableActions } from "./_table";
import { user } from "./user";

/**
 * Session Table Schema
 * Represents an active authenticated session. Replaces the old NextAuth
 * `session` table (which was never written to when we were on JWT strategy).
 */
export const session = pgTable(
	"session",
	{
		/** Primary key — nanoid generated on insert. */
		id: text()
			.$defaultFn(() => generateId())
			.primaryKey()
			.notNull(),

		/**
		 * Opaque session token. Stored in the browser cookie; used by
		 * `auth.api.getSession` to look up this row. Kept unique so the
		 * cookie value is a direct primary-ish identifier.
		 */
		token: text().notNull().unique(),

		/** Owning user — cascades on delete/update. */
		userId: text()
			.notNull()
			.references(() => user.id, tableActions),

		/** When this session becomes invalid. Enforced in `auth.api.getSession`. */
		expiresAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).notNull(),

		/** Optional client IP recorded at session creation (nullable for test/seed). */
		ipAddress: text(),

		/** Optional User-Agent string recorded at session creation. */
		userAgent: text(),

		/** Timestamp when this session row was created. */
		createdAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),

		/** Timestamp of the last modification (Better Auth rolls this on activity). */
		updatedAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),
	},
	(table) => [
		// Index on user_id for fast "all sessions for user" lookups and revocation.
		index("session_user_id_idx").on(table.userId),
	],
);

/**
 * Session Relationships
 *
 * Relationships:
 * - user: The user who owns this session
 */
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));
