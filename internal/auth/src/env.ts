import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "production"]).optional(),
		AUTH_URL: z.url(),
		AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
		AUTH_GITHUB_ID: z.string(),
		AUTH_GITHUB_SECRET: z.string(),
		// Leading "@" is load-bearing: auth.ts matches with endsWith, so "rently.com" would also admit "@evilrently.com"
		AUTH_ALLOWED_DOMAIN: z
			.string()
			.startsWith("@", "AUTH_ALLOWED_DOMAIN must start with '@' (e.g. @rently.com)")
			.optional()
			.or(z.literal("")),
	},
	client: {},
	experimental__runtimeEnv: {},
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});

export default env;
