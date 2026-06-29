# Changelog

## 2026-06-29
### Phase 2 added
- Business settings, communication settings and booking rules tables
- Service categories, services, service galleries, service FAQs and suitability question tables
- Media asset metadata, public FAQs and policies tables
- Generated and applied `drizzle/0001_dark_slyde.sql`
- Idempotent `npm run db:seed:phase2` seed for editable business details, communication defaults, booking rules, default services, safety questions, FAQ and policy starter data
- Communication feature-flag helper and tests for WhatsApp visibility

### Phase 2 verified
- `npm run db:generate`
- Reviewed generated SQL migration
- `npm run db:migrate`
- `npm run db:seed:phase2`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with local `.env`

### Phase 1 completed
- Applied `drizzle/0000_fast_glorian.sql`
- Bootstrapped owner account from local `.env`
- Fixed owner bootstrap script exit behaviour after successful creation

### Phase 1 added
- Drizzle PostgreSQL schema for users, sessions, roles, permissions, role permissions and user roles
- Generated initial migration `drizzle/0000_fast_glorian.sql`
- Email/password password hashing and validation helpers
- Database-backed session helpers with secure HTTP-only cookie settings
- Server-side `requireAuth` and `requirePermission` primitives
- Owner bootstrap script for first account creation, without public registration
- Login page, protected dashboard page and permission-denied page
- Tests for password verification, permission defaults, session token hashing and environment validation

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
