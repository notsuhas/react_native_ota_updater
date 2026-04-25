/**
 * Database Module Entry Point
 *
 * This module serves as the main entry point for the database package,
 * exporting all essential components for database interaction.
 *
 * Exports:
 * - Database client and configuration
 * - Schema definitions and types
 * - Storage management functionality
 * - Error handling utilities
 * - Common enums and constants
 *
 * @module Database
 */

import { STORAGE_ERROR_STRINGS } from "./lib/strings";
import { StorageManager } from "./manager";
import { DEFAULT_CODEPUSH_DEPLOYMENT_NAMES } from "./manager/codepush";
import { Permission, Platform, ReleaseMethod } from "./schema";

// Export database client and schema
export * from "./client";
export * from "./schema";
export { ADMIN_USER_EMAILS } from "./schema/_table";
// Export core functionality
export {
	DEFAULT_CODEPUSH_DEPLOYMENT_NAMES,
	Permission,
	Platform,
	ReleaseMethod,
	STORAGE_ERROR_STRINGS,
	StorageManager,
};
