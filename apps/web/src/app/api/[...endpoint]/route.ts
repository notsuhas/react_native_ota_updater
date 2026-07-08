/**
 * Catch-all API route — bridges Next.js App Router request handling to the
 * Hono app exported by `@rentlydev/rnota-api`. Every method is forwarded so
 * Hono's own routing decides what to do (404 / 405 / handler dispatch).
 *
 * @module ApiCatchAll
 *
 * @example
 * ```
 * GET    /api/codepush/apps           → Hono codepush.management.app
 * POST   /api/codepush/acquisition... → Hono codepush.acquisition
 * OPTIONS /api/anything               → CORS preflight, handled by Hono
 * ```
 */

import app from "@rentlydev/rnota-api/app";
import { handle } from "hono/vercel";

export const OPTIONS = handle(app);
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
