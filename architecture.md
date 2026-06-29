# Architecture

## Recommended stack
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Lucide React, Framer Motion used sparingly, Sonner for non-critical toasts
- React Hook Form + Zod
- PostgreSQL on Neon or Supabase
- Drizzle ORM with generated reviewed migrations
- Auth.js or Better Auth with database-backed sessions
- S3-compatible object storage such as Cloudflare R2
- Resend for transactional email
- OpenAI Responses API or equivalent structured-tool model for chatbot
- Server-side PDF generation using React PDF or HTML-to-PDF service selected during implementation
- Vercel deployment

## Why this fits
It provides a single TypeScript stack, strong managed-service support, economical hosting for a local business, server-rendered public pages, secure server actions/routes and a clean path to future growth.

## Selected technologies
- PostgreSQL for relational integrity, document/payment transactions and reporting
- Drizzle for explicit SQL-oriented schema and safe migrations
- Object storage for service galleries, team/facility media and logo/signature assets
- Structured chatbot tool calls rather than free-form database access
- Server-side permission checks on every protected mutation

## Rejected for v1
- Redis: unnecessary at expected scale
- Dedicated queue platform: email and document jobs can start synchronously or with platform background execution
- Realtime subscriptions: not needed for core operations
- Docker in production: managed deployment is simpler
- Payment gateway: not currently required
- Full VibeKit scaffold: useful as reference, but project architecture remains project-specific

## Deferred
- Live availability locking and resource scheduling
- WhatsApp Business API
- Accounting integration
- Multi-branch support
- Analytics beyond privacy-conscious product and conversion events

## Application boundaries
### Public domain
Marketing pages, service catalogue, FAQs, policies, contact forms, booking form and chatbot UI.

### Authenticated domain
Dashboard, bookings, clients, follow-ups, services, content, media, documents, payments, settings, notifications, users and activity log.

### Server domain
Validation, permissions, document numbering, totals, payment allocation, booking references, chatbot tools, notifications and audit events.

## Data fetching and state
Prefer server components for public and dashboard reads. Use server actions or route handlers for mutations. TanStack Query is optional for highly interactive list/calendar screens; avoid duplicating server cache patterns unnecessarily.

## Authentication and sessions
- Email/password or magic-link capability based on owner preference
- Secure, httpOnly, sameSite cookies
- Session rotation and revocation
- First-owner bootstrap handled by deployment script, never public registration
- Optional invited-user onboarding

## Storage
Private-by-default bucket for signatures or sensitive exports; public/CDN bucket or signed URLs for public website images. Validate type, size and dimensions. Store metadata and ownership in PostgreSQL.

## Email
Use templates for booking acknowledgement, staff notifications, confirmations and document delivery. Email failure must not roll back a successfully saved booking; record delivery state and allow retry.

## AI chatbot architecture
The model receives a constrained system instruction and current approved business context. It may call explicit tools such as `listServices`, `getService`, `getBusinessInfo`, `getBookingRules`, `createBookingRequest` and `createGeneralEnquiry`. The model cannot write arbitrary SQL, set confirmed status, invent availability or provide diagnosis.

## Financial integrity
Use database transactions for document issue, numbering, payment recording, invoice allocation, receipt creation and void/reversal operations. Store line-item snapshots and monetary values as integer cents.

## Monitoring
- Application errors: Sentry or equivalent
- Vercel logs and analytics
- Structured audit logs for business actions
- Email delivery logs
- Chatbot tool-call error logs without retaining unnecessary health-related content

## Backup
Managed PostgreSQL point-in-time restore where available, daily backups, object-storage versioning where practical and quarterly restore test.

## Performance targets
- Public LCP under 2.5s on typical mobile connection
- CLS below 0.1
- Paginate large dashboard lists
- Index booking status/date, client contact fields, document numbers and payment relationships
- Optimise and lazy-load imagery

## Version rule
At implementation time verify stable compatible versions, document them here and lock them in the package manager lockfile. Do not blindly use versions from old examples.

## Phase 0 verified versions
- Node.js: 22.16.0
- npm: 11.7.0
- Next.js: 16.2.9 using App Router and Webpack build mode on local darwin/x64
- React / React DOM: 19.2.7
- TypeScript: 5.9.3
- Tailwind CSS / PostCSS plugin: 4.3.2
- ESLint / eslint-config-next: 9.39.4 / 16.2.9
- Zod: 4.4.3
- Drizzle ORM / Kit: 0.45.2 / 0.31.10
- PostgreSQL driver: postgres 3.4.9
- Password hashing: bcryptjs 3.0.3
- Test runner: Node.js native test runner with `tsx` 4.21.0

`next build` is configured as `next build --webpack` because Turbopack required native bindings that were not available on the local darwin/x64 verification environment.
