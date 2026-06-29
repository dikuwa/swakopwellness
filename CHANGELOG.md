# Changelog

## 2026-06-29
### Phase 1 added
- Drizzle PostgreSQL schema for users, sessions, roles, permissions, role permissions and user roles
- Generated initial migration `drizzle/0000_fast_glorian.sql`
- Email/password password hashing and validation helpers
- Database-backed session helpers with secure HTTP-only cookie settings
- Server-side `requireAuth` and `requirePermission` primitives
- Owner bootstrap script for first account creation, without public registration
- Login page, protected dashboard page and permission-denied page
- Tests for password verification, permission defaults, session token hashing and environment validation

### Phase 1 blocked
- `npm run db:migrate` could not run because no reachable `DIRECT_URL` or `DATABASE_URL` is configured in this environment.

### Phase 1 verified
- `npm run db:generate`
- Reviewed generated SQL migration
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with placeholder-safe development values

### Phase 0 added
- Phase 0 Next.js App Router scaffold with TypeScript, Tailwind CSS v4 tokens, ESLint, Node test runner and Webpack production build script
- Impeccable `PRODUCT.md` and `DESIGN.md` context derived from the approved package docs
- `.env.example` and `npm run env:check` environment validation using Zod
- Baseline environment validation tests for required provider variables
- Locked npm dependency graph in `package-lock.json`

### Verified
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with placeholder-safe development values

### Known risks
- `npm audit` still reports 3 framework/tooling findings after `npm audit fix`; forced fix was not applied because it suggested incompatible dependency changes.
- Production providers, final brand assets, legal/medical wording, tax/banking details and auth method remain unconfirmed.

### Package added
- Complete project package for Swakop Wellness Centre
- Public website, booking, chatbot, dashboard, client, follow-up and financial-document specifications
- Architecture, design system, database, security, testing and deployment guidance
- VibeKit/JB reference manifest and local reference folder

### Package-mode note
The original package was generated without application code, migrations or production configuration. Phase 0 has now added the initial application scaffold only; database schema, migrations, authentication and business features are not implemented yet.
