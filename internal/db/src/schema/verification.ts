/**
 * Verification Schema Definition
 * This module defines the transient-token table Better Auth uses for OAuth
 * state, email magic-links, email-change confirmations, and similar
 * short-lived verification flows.
 *
 * @module VerificationSchema
 *
 * For our GitHub-OAuth-only setup this table holds one row per in-progress
 * sign-in — Better Auth inserts a row before redirecting to GitHub (carrying
 * the PKCE code verifier and the post-login callback URL) and deletes it
 * after the callback completes. The table is expected to stay near-empty.
 *
 * Timestamps use `mode: "date"` for Better Auth adapter compatibility.
 */

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId } from "./_table";

/**
 * Verification Table Schema
 * Short-lived tokens used by Better Auth's sign-in and email-change flows.
 */
export const verification = pgTable(
	"verification",
	{
		/** Primary key — nanoid generated on insert. */
		id: text()
			.$defaultFn(() => generateId())
			.primaryKey()
			.notNull(),

		/**
		 * Identifier whose verification this row represents — e.g. the OAuth
		 * state parameter for a pending sign-in, or the email being verified.
		 */
		identifier: text().notNull(),

		/**
		 * Opaque payload — typically a JSON blob containing the PKCE code
		 * verifier, callback URL, and OAuth state. Interpretation is internal
		 * to Better Auth.
		 */
		value: text().notNull(),

		/** When this token becomes invalid. Better Auth filters on this at read time. */
		expiresAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).notNull(),

		/** Timestamp when the verification was initiated. */
		createdAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),

		/** Timestamp of the last modification (usually unchanged — rows are short-lived). */
		updatedAt: timestamp({ mode: "date", withTimezone: true, precision: 0 }).defaultNow().notNull(),
	},
	(table) => [
		// Index on identifier for fast lookups during OAuth callback / magic-link consumption.
		index("verification_identifier_idx").on(table.identifier),
	],
);
