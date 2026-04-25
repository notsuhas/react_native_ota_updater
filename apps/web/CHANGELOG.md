# @rentlydev/rnota-web

## 3.0.0

### Major Changes

- Major dependency and framework upgrade.

  - Toolchain: Node.js 18 → 22, pnpm 10.4 → 10.33, Turbo 2.5 → 2.9, TypeScript 5.9 → 6.0, Biome 1.9 → 2.
  - Frameworks: Next.js 15.5 → 16.2, Tailwind CSS 3.4 → 4.2 (CSS-first config), middleware.ts → proxy.ts (Next 16 rename).
  - Auth: next-auth 5.0.0-beta → Better Auth across the auth package, ensure-auth middleware, web auth routes/login pages/providers, and the DB schema. Ships migration `0002_better_auth.sql` adding the `verification` table and reshaping `account` / `session` / `user`. AUTH_ALLOWED_DOMAIN enforcement moved from hooks.before to databaseHooks.user.create.before / databaseHooks.session.create.before.
  - Path-store removal: `AppStoreProvider` / `AppStoreFragmentProvider` and per-segment templates replaced by a `useCodePushRouteParams` hook. `codepush-queries` factories now take explicit `{ appName, platform, ... }` args.
  - Schema/runtime: Zod 3.25 → 4.3 across schemas + consumers; Drizzle ORM bump; Hono / @hono/node-server v2 + @scalar/hono-api-reference 0.10; oclif refresh; mocha 11 + chai 6; sonner 2; lucide-react 1; pino 10; faker 10; aws-sdk 3.1035; @alwatr/parse-duration 9; conf 15 / which 6 / shx 0.4.
  - Lint hygiene: `biome check --write` across the workspace, Biome v2 schema in `biome.json`.
  - Seed: capture inserted platform rows via `.returning()` and group them under their app instead of re-querying.

  Breaking changes:

  - DB migration is destructive (table reshape) — back up before applying.
  - Node 22 is now the minimum runtime version.
  - All workspace packages bump from 2.0.0 to 3.0.0 in lockstep.

### Patch Changes

- Updated dependencies
  - @rentlydev/rnota-api@3.0.0
  - @rentlydev/rnota-api-client@3.0.0
  - @rentlydev/rnota-auth@3.0.0

## 2.0.0

### Major Changes

- Make Repo Open-Source 🎉

### Patch Changes

- Updated dependencies
  - @rentlydev/rnota-auth@2.0.0
  - @rentlydev/rnota-api@2.0.0
  - @rentlydev/rnota-api-client@2.0.0

## 1.0.13

### Patch Changes

- Update Readme
  Code Clean up
  Init Changeset
  Remove old Expo Dead Code
  Automate NPM Publish
- Updated dependencies
  - @rentlydev/rnota-api-client@1.0.13
  - @rentlydev/rnota-auth@1.0.13
  - @rentlydev/rnota-api@1.0.13
