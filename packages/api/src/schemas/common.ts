/**
 * Common Schema Definitions Module
 *
 * This module provides centralized schema definitions for both CodePush
 * API endpoints. It uses Zod for runtime type validation and OpenAPI documentation
 * generation. The schemas are organized into several categories:
 *
 * Features:
 * - Request/response validation
 * - OpenAPI documentation generation
 * - Type-safe schema definitions
 * - Shared validation rules
 * - Platform-specific schemas
 *
 * Categories:
 * - General App Management
 * - Deployment Management
 * - Release Management
 * - Collaborator Management
 */

import {
	Permission,
	Platform,
	selectCodePushAppWithPlatformsAndDeploymentsSchema,
	selectCodePushCollaboratorWithAppSchema,
	selectCodePushDeploymentSchema,
	selectCodePushReleaseSchema,
	selectCodePushReleaseStatsSchema,
	selectCodePushReleaseWithUserAndMetricsSchema,
} from "@rentlydev/rnota-db";
// import { coerce, valid } from "semver";
import { z } from "zod";

// export const ValidAppVersionSchema = z.string().refine((value) => valid(value), { message: "Invalid app version" });

// export const ValidAppVersionCoercedSchema = z
// 	.string()
// 	.refine((value) => valid(coerce(value)) !== null, { message: "Invalid app version" })
// 	.transform((value) => valid(coerce(value)) as string);

/**
 * Regular expression for validating version labels
 * Requires format: 'v' followed by a positive integer (e.g., v1, v2, v10)
 * @constant {RegExp}
 */
const VALID_LABEL_REGEX = /^v[1-9][0-9]*$/;

/**
 * Schema for validating version labels
 * Enforces format and length constraints
 *
 * @example
 * ```typescript
 * // Valid labels
 * LabelSchema.parse("v1")  // ✓
 * LabelSchema.parse("v42") // ✓
 *
 * // Invalid labels
 * LabelSchema.parse("v0")  // ✗ (must start with v1 or higher)
 * LabelSchema.parse("1.0") // ✗ (wrong format)
 * ```
 */
export const LabelSchema = z
	.string()
	.min(2)
	.max(100)
	.regex(VALID_LABEL_REGEX, { message: "Invalid label format" })
	.meta({ description: "Version label in the format v1, v2, etc." });

/**
 * Schema for validating rollout percentages
 * Ensures values are integers between 1 and 100
 *
 * @example
 * ```typescript
 * // Valid rollouts
 * ValidRolloutSchema.parse(50)  // ✓
 * ValidRolloutSchema.parse(100) // ✓
 *
 * // Invalid rollouts
 * ValidRolloutSchema.parse(0)    // ✗ (below minimum)
 * ValidRolloutSchema.parse(50.5) // ✗ (must be integer)
 * ```
 */
export const ValidRolloutSchema = z
	.number()
	.int()
	.min(1)
	.max(100)
	.meta({ description: "Integer between 1 and 100 representing rollout percentage" });

// ==========================================
// App Management Schemas
// ==========================================

/**
 * Basic app name request body schema
 * Used for simple operations requiring only the app name
 */
export const AppNameBodySchema = z
	.object({
		appName: z.string().meta({ description: "The name of the CodePush app" }),
	})
	.meta({ description: "The request body containing the CodePush app name" });

/**
 * Extended app creation request body schema
 * Includes app name and icon URL
 */
export const AddAppBodySchema = z
	.object({
		...AppNameBodySchema.shape,
		appIcon: z.string().url().meta({ description: "The icon URL of the app" }),
	})
	.meta({ description: "The request body for creating a new CodePush app" });

/**
 * Single app response schema
 * Returns app details with collaborator information
 */
export const GetAppResponseSchema = z
	.object({
		app: selectCodePushCollaboratorWithAppSchema.meta({
			description: "The CodePush app details including collaborator information",
		}),
	})
	.meta({ description: "Returns the CodePush app details for the authenticated collaborator" });

/**
 * Multiple apps response schema
 * Returns list of apps with collaborator information
 */
export const GetAppsResponseSchema = z
	.object({
		apps: z
			.array(selectCodePushCollaboratorWithAppSchema)
			.meta({ description: "Array of CodePush apps with collaborator details" }),
	})
	.meta({ description: "Returns all CodePush apps accessible to the authenticated collaborator" });

/**
 * Detailed app response schema
 * Includes platforms and deployments information
 */
export const AppWithPlatformsAndDeploymentsResponseSchema = z
	.object({
		app: selectCodePushAppWithPlatformsAndDeploymentsSchema.meta({
			description: "The complete CodePush app details including platforms and deployments",
		}),
	})
	.meta({ description: "Returns the CodePush app with its platforms and deployments configuration" });

/**
 * App name query parameter schema
 * Used for URL query parameters
 */
export const AppNameQuerySchema = z.object({
	appName: z.string().meta({
		description: "The unique name identifier of the CodePush app",
		param: {
			in: "query",
			name: "appName",
			required: true,
		},
	}),
});

// ==========================================
// Collaborator Management Schemas
// ==========================================

/**
 * Basic collaborator management schema
 * Used for operations requiring app name and collaborator email
 */
export const AppNameEmailBodySchema = z
	.object({
		appName: z.string().meta({ description: "The unique name identifier of the CodePush app" }),
		email: z.string().email().meta({ description: "The email address of the collaborator" }),
	})
	.meta({ description: "Basic collaborator management request body" });

/**
 * Extended collaborator management schema
 * Includes permission level specification
 */
export const AppNameEmailPermissionBodySchema = z
	.object({
		...AppNameEmailBodySchema.shape,
		permission: z
			.enum([Permission.ADMIN, Permission.COLLABORATOR, Permission.OWNER])
			.meta({ description: "The access level to grant to the collaborator" }),
	})
	.meta({ description: "Extended collaborator management request body with permissions" });

// ==========================================
// Deployment Management Schemas
// ==========================================

/**
 * Deployment query parameter schema
 * Used for operations requiring app, platform, and deployment name
 */
export const AppNamePlatformDeploymentQuerySchema = z
	.object({
		appName: z.string().meta({
			description: "The unique name identifier of the CodePush app",
			param: {
				in: "query",
				name: "appName",
				required: true,
			},
		}),

		platform: z.enum([Platform.IOS, Platform.ANDROID]).meta({
			description: "The target platform (ios or android)",
			param: {
				in: "query",
				name: "platform",
				required: true,
			},
		}),

		deploymentName: z.string().meta({
			description: "The unique name identifier of the deployment",
			param: {
				in: "query",
				name: "deploymentName",
				required: true,
			},
		}),
	})
	.meta({ description: "Query parameters for deployment operations" });

/**
 * Release details query parameter schema
 * Extends deployment query schema with release label
 */
export const ReleaseDetailsQuerySchema = z
	.object({
		...AppNamePlatformDeploymentQuerySchema.shape,
		label: LabelSchema.meta({
			description: "The label identifier of the release",
			param: {
				in: "query",
				name: "label",
				required: true,
			},
		}),
	})
	.meta({ description: "Query parameters for release detail operations" });

/**
 * Basic deployment management schema
 * Used for operations requiring app and deployment names
 */
export const AppNameDeploymentBodySchema = z
	.object({
		appName: z.string().meta({ description: "The unique name identifier of the CodePush app" }),
		deploymentName: z.string().meta({ description: "The unique name identifier of the deployment" }),
	})
	.meta({ description: "Basic deployment management request body" });

/**
 * Roll deployment key schema
 * Used for rolling (regenerating) a deployment key
 */
export const RollDeploymentKeyBodySchema = z
	.object({
		appName: z.string().meta({ description: "The unique name identifier of the CodePush app" }),
		deploymentName: z.string().meta({ description: "The unique name identifier of the deployment" }),
		platform: z.enum([Platform.IOS, Platform.ANDROID]).meta({
			description: "The target platform (ios or android)",
		}),
	})
	.meta({ description: "Request body for rolling a deployment key" });

/**
 * Custom deployment key schema
 * Used for setting a custom deployment key
 */
export const CustomDeploymentKeyBodySchema = z
	.object({
		appName: z.string().meta({ description: "The unique name identifier of the CodePush app" }),
		deploymentName: z.string().meta({ description: "The unique name identifier of the deployment" }),
		platform: z.enum([Platform.IOS, Platform.ANDROID]).meta({
			description: "The target platform (ios or android)",
		}),
		customKey: z.string().min(16).max(64).meta({
			description: "The custom deployment key to set (16-64 characters)",
		}),
	})
	.meta({ description: "Request body for setting a custom deployment key" });

/**
 * Deployment response schema
 * Returns deployment details
 */
export const DeploymentResponseSchema = z
	.object({
		deployment: selectCodePushDeploymentSchema.meta({
			description: "The complete deployment configuration and status",
		}),
	})
	.meta({ description: "Response containing deployment details" });

/**
 * Deployment history response schema
 * Returns list of releases with user and metrics information
 */
export const DeploymentReleaseHistoryResponseSchema = z
	.object({ history: z.array(selectCodePushReleaseWithUserAndMetricsSchema) })
	.meta({
		description: "Returns the complete release history with metrics for the deployment and user information",
	});

// ==========================================
// Release Management Schemas
// ==========================================

/**
 * Release verification request schema
 * Used for validating new release information before upload
 */
export const VerifyReleaseBodySchema = z
	.object({
		packageInfo: z
			.object({
				appVersion: z.string().meta({ description: "The semantic version of the target app" }),
				isDisabled: z.boolean().meta({ description: "Flag to disable the release" }),
				isMandatory: z.boolean().meta({ description: "Flag to mark the release as mandatory update" }),
				rollout: ValidRolloutSchema.nullish().meta({
					description: "The percentage of users who should receive this update",
				}),
				description: z.string().nullish().meta({ description: "Release notes or description" }),

				packageName: z.string().meta({ description: "The filename of the update package (zip)" }),
				packageHash: z.string().meta({ description: "The SHA256 hash of the update package" }),
				size: z.number().int().min(1).meta({ description: "The size of the update package in bytes (max 200MB)" }),
			})
			.meta({ description: "The metadata and configuration for the new release" }),
	})
	.meta({ description: "The request body for verifying a new release" });

/**
 * Release verification response schema
 * Returns pre-signed URL for package upload
 */
export const ReleaseVerifiedResponseSchema = z
	.object({
		verified: z
			.object({
				releaseId: z.number().meta({ description: "The unique label identifier of the pre-committed release" }),
				preSignedUrl: z.string().url().meta({ description: "The temporary URL for uploading the release package" }),
			})
			.meta({ description: "Verification details for the release" }),
	})
	.meta({ description: "Returns the verification details and upload URL" });

/**
 * Basic release response schema
 * Returns release details
 */
export const ReleaseResponseSchema = z
	.object({ release: selectCodePushReleaseSchema })
	.meta({ description: "Returns the basic release information" });

/**
 * Detailed release response schema
 * Returns release details with user and metrics information
 */
export const GetReleaseResponseSchema = z
	.object({ release: selectCodePushReleaseWithUserAndMetricsSchema })
	.meta({ description: "Returns the complete release details including metrics and user information" });

/**
 * Release update request schema
 * Used for modifying existing release properties
 */
export const UpdateReleaseBodySchema = z
	.object({
		packageInfo: z
			.object({
				label: LabelSchema.optional().meta({ description: "The unique label identifier for an existing release" }),
				appVersion: z.string().nullish().meta({ description: "The new target app version" }),
				description: z.string().nullish().meta({ description: "Updated release notes or description" }),
				rollout: ValidRolloutSchema.nullish().meta({ description: "Updated rollout percentage" }),
				isDisabled: z.boolean().nullish().meta({ description: "Updated disabled status" }),
				isMandatory: z.boolean().nullish().optional().meta({ description: "Updated mandatory update status" }),
			})
			.meta({ description: "The properties to update for the release" }),
	})
	.meta({ description: "The request body for updating a release" });

/**
 * Release promotion request schema
 * Used for promoting a release to another deployment
 */
export const PromoteReleaseBodySchema = z
	.object({
		...UpdateReleaseBodySchema.shape,
		targetDeployment: z.string().meta({ description: "The name of the deployment to promote to" }),
	})
	.meta({ description: "The request body for promoting a release to another deployment" });

/**
 * Release rollback query schema
 * Used for rolling back to a previous release
 */
export const RollbackQuerySchema = z
	.object({
		...AppNamePlatformDeploymentQuerySchema.shape,
		targetReleaseLabel: LabelSchema.optional().meta({
			description: "The unique label identifier of the existing release to rollback to",
			param: {
				in: "query",
				name: "targetReleaseLabel",
				required: true,
			},
		}),
	})
	.meta({ description: "Query parameters for rollback operations" });

/**
 * Release download URL query schema
 * Used for getting the download URL for a release
 */
export const ReleaseDownloadUrlQuerySchema = z
	.object({ blobId: z.string().meta({ description: "The unique identifier of the release" }) })
	.meta({ description: "Query parameters for release download URL operations" });

// ==========================================
// Stats Management Schemas
// ==========================================

/**
 * Release stats response schema
 * Returns release statistics
 */
export const ReleaseStatsResponseSchema = z
	.object({ stats: z.array(selectCodePushReleaseStatsSchema) })
	.meta({ description: "Returns the release statistics" });
