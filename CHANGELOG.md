# Changelog

## 2026-06-30
### Phase 7 added
- Activity log table for recording user actions with entity references and metadata
- Document number sequences table for configurable invoice/receipt/quotation numbering (prefix, padding, next number)
- Invoices table with line items, discount (percentage/fixed), tax, payment status tracking and lifecycle (draft, issued, paid, voided)
- Payments table linked to clients, invoices and bookings
- Receipts table linked to payments, clients, invoices with void support
- Generated and applied `drizzle/0005_bent_prowler.sql`
- `src/activity-log/record.ts` — server-side activity recording helper
- `src/documents/number.ts` — atomic document number generation with `getNextDocumentNumber()`
- `src/invoices/create.ts` — create, issue and void invoices with transactional line item persistence; server-side financial calculations (subtotal, discount, total, balance)
- `src/payments/record.ts` — record payment with automatic invoice balance update and optional receipt generation; payment void with invoice rollback
- Seeded document number sequences (SWC-INV-, SWC-REC-, SWC-QUO-) with idempotent seed script update
- Dashboard overview — stats cards for bookings, new requests, today, requires review, clients, follow-ups due, outstanding invoices
- Dashboard navigation — Clients, Invoices and Receipts links added
- `/dashboard/clients` — client list table linking to detail
- `/dashboard/clients/[id]` — client detail with bookings, invoices and payments sections
- `/dashboard/invoices` — invoice list with status badges and balance
- `/dashboard/invoices/new` — create invoice form with dynamic line items, service autofill, discount and terms
- `/dashboard/invoices/[id]` — invoice detail with issue, record payment and void actions
- `/dashboard/receipts` — receipt list with active/voided status
- `/dashboard/receipts/new` — create receipt (records payment + generates receipt)
- `/dashboard/receipts/[id]` — receipt detail with void action
- Permission enforcement on all new routes (`financials:view`, `documents:create`, `documents:void`)
- Tests for document number formatting and invoice financial calculations (32 total tests)

### Phase 7 verified
- `npm run db:generate` reviewed
- `npm run db:migrate` applied
- `npm run db:seed:phase2` idempotent (added document sequences)
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm run test` — 32/32 pass
- `npm run build` — all 24 routes compiling
- `npm run env:check` — passed
- Browser smoke: all public routes 200, dashboard routes 307 (redirect to login)

## 2026-06-29
### Phase 6 added
- Follow-up schema with client, booking, due date, method, assignee, reminder and status fields
- Generated and applied `drizzle/0004_slippery_toro.sql`
- Follow-up due-state helper for pending, due today, overdue, completed and cancelled states
- Protected dashboard navigation, bookings view, operational calendar view and follow-ups view
- Dashboard data loaders for bookings, calendar and follow-ups
- Tests for follow-up due-state calculations

### Phase 6 verified
- `npm run db:generate`
- Reviewed generated SQL migration
- `npm run db:migrate`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with local `.env`
- Browser smoke tested authenticated dashboard, calendar and follow-ups routes

### Phase 5 added
- Chat conversation, chat message and chat tool-event persistence tables
- Generated and applied `drizzle/0003_plain_the_santerians.sql`
- Public `/chat` route for constrained chat-to-book flow
- Chat booking server action using the same booking creation workflow as the standard booking form
- Public navigation and mobile action links for Chat to Book
- Chatbot safety helpers that refuse diagnosis/treatment requests and avoid claiming confirmed availability
- Tests for chatbot refusal wording and booking confirmation wording

### Phase 5 verified
- `npm run db:generate`
- Reviewed generated SQL migration
- `npm run db:migrate`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with local `.env`
- Browser smoke test submitted a chat booking request and returned a reference

### Phase 4 added
- Clients, bookings, booking answers and booking status history schema
- Generated and applied `drizzle/0002_cool_moira_mactaggert.sql`
- Server-side booking request workflow with service validation, service snapshots, client matching, duplicate-window handling, suitability answer storage and status history creation
- Human-readable booking reference generation with database uniqueness
- Public `/book` form using dynamic services, booking rules, communication settings and suitability questions
- Success and error states for booking request submission
- Tests for booking references, contact normalization, suitability status and booking validation

### Phase 4 verified
- `npm run db:generate`
- Reviewed generated SQL migration
- `npm run db:migrate`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with local `.env`
- Browser smoke test submitted a booking request and returned a reference

### Phase 3 added
- Dynamic Home page using database-backed business settings, communication settings, services and FAQs
- Dynamic Services and Service Detail pages using editable service records and prices
- Dynamic About, FAQs, Contact, Policies and Policy Detail pages
- Booking placeholder route that lists database-backed booking-enabled services for Phase 4 handoff
- Shared public data loaders, public header, footer and mobile action bar
- Updated app metadata for Swakop Wellness Centre

### Phase 3 verified
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run env:check` with local `.env`
- Browser smoke test for Home and Services rendering seeded database content

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
