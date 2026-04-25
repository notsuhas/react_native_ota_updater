/**
 * Database Seed Script
 * This script populates the database with initial test data for development and testing.
 * It creates a complete set of interconnected records across all tables in the correct order.
 */

import { db } from "../client";
import * as schema from "../schema";
import * as seedData from "./faker";

/**
 * Main seeding function
 * Creates test data in the following order:
 * 1. Users and authentication
 * 2. CodePush applications
 * 3. Platform configurations
 * 4. Access control
 * 5. Deployments and releases
 * 6. Usage metrics
 * @returns {Promise<void>}
 */
async function seed() {
	try {
		console.log("🌱 Starting database seeding...");

		// Step 1: Users and Authentication
		// const users = await db.insert(schema.user).values(seedData.generateFakeUsers()).returning();
		// console.log("👥 Users created");

		// // @ts-expect-error Auth Adapter Type
		// await db.insert(schema.account).values(seedData.generateFakeAccounts(users));
		// console.log("🔑 OAuth accounts linked");

		// await db.insert(schema.accessKey).values(seedData.generateFakeAccessKeys(users));
		// console.log("🎫 Access keys generated");

		// Step 2: CodePush Applications
		const apps = await db.insert(schema.codepush_app).values(seedData.generateFakeApps()).returning();
		console.log("📱 Applications created");

		// Step 3: Platform Configurations
		const platforms = await db.insert(schema.codepush_platform).values(seedData.generatePlatforms(apps)).returning();
		console.log("⚙️ Platforms configured");

		// Step 4: Access Control
		// const adminUsers = await db.query.user.findMany({
		// 	where: inArray(schema.user.email, [...ADMIN_USER_EMAILS]),
		// });

		// await db
		// 	.insert(schema.codepush_collaborator)
		// 	.values(seedData.generateFakeAppCollaborators(users, adminUsers, apps));
		// console.log("👥 Collaborators assigned");

		// Step 5: Deployments and Releases
		// Build the nested shape from rows we just inserted instead of re-querying —
		// re-querying would pick up leftover apps from prior runs and try to re-insert
		// deployments for them, violating the (name, platform_id) unique constraint.
		const appsWithPlatforms = apps.map((app) => ({
			...app,
			platforms: platforms.filter((platform) => platform.appId === app.id),
		}));

		const _deployments = await db
			.insert(schema.codepush_deployment)
			.values(seedData.generateDeployments(appsWithPlatforms))
			.returning();
		console.log("🚀 Deployments created");

		// const releases = await db
		// 	.insert(schema.codepush_release)
		// 	.values(seedData.generateFakeReleases(deployments, users))
		// 	.returning();
		// console.log("📦 Releases generated");

		// Step 6: Usage Metrics
		// await db.insert(schema.codepush_metrics).values(seedData.generateFakeMetrics(releases));
		// console.log("📊 Metrics populated");

		console.log("✨ Database seeding completed successfully");
	} catch (error) {
		console.error("❌ Seeding failed:", error);
		throw error;
	}
}

// Execute the seeding script
seed()
	.then(() => {
		console.log("✅ Seed script finished successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Seed script failed:", error);
		process.exit(1);
	});
