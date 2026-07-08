/**
 * Database Schema Module Index
 *
 * This module serves as the central export point for all database schema definitions,
 * including tables, relations, and type definitions. It organizes the schema into
 * logical groups for better maintainability and access.
 *
 * Schema Organization:
 * - Authentication: User accounts, sessions, and access keys
 * - Common: Shared types and enums
 * - CodePush: Over-the-air update related schemas
 * - Validations: Schema validation utilities
 *
 * @module DatabaseSchema
 */

// CodePush Schema
export * from "./(codepush)/app";
export * from "./(codepush)/collaborator";
export * from "./(codepush)/deployment";
export * from "./(codepush)/metrics";
export * from "./(codepush)/platform";
export * from "./(codepush)/release";
// Authentication and User Management
export * from "./access-key";
export * from "./account";
// Common Types and Utilities
export * from "./common";
export * from "./session";
export * from "./user";
// Schema Validation
export * from "./validations";
export * from "./verification";
