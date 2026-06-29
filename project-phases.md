# Project Phases

## Phase 0 — Discovery and repository setup
Objective: confirm requirements, branding, legal wording and service ownership. Set up repository, environments and quality scripts.
Tests: lint/typecheck baseline, environment validation.
Gate: owner approves content, visual direction and deferred scope.
Rollback: remove only newly created scaffolding.

## Phase 1 — Foundation, auth and permissions
Implement design tokens, layouts, database foundation, authentication, roles and server-side permissions.
Tests: login, session expiry, permission matrix, protected routes.
Gate: owner/admin/staff access behaves correctly.

## Phase 2 — Business settings, media and services
Implement dynamic business/communication settings, service categories, services, galleries, FAQs, policies and media.
Tests: CRUD, archive, ordering, upload validation, WhatsApp feature flag.
Gate: no public business/service data is hardcoded.

## Phase 3 — Public website
Build Home, Services, Service Detail, About, FAQs, Contact and Policies from dynamic content.
Tests: SEO, responsive layout, accessibility, disabled-channel states.
Gate: approved visual review and content accuracy.

## Phase 4 — Booking and clients
Implement multi-step request form, manual booking, references, screening review, client matching and status history.
Tests: duplicate prevention, contact validation, review logic, status transitions.
Gate: all booking sources share one workflow.

## Phase 5 — Chatbot booking
Implement safe structured chatbot tools and booking flow.
Tests: no diagnosis, no invented prices/availability, successful persistence, failure recovery.
Gate: safety test set and owner-approved answers pass.

## Phase 6 — Calendar and follow-ups
Implement operational calendar, assignments, reminders and due/overdue views.
Tests: timezone, reschedule, cancellation, follow-up state calculations.
Gate: staff can run daily workflow from dashboard.

## Phase 7 — Documents and payments
Implement quotations, invoices, receipts, numbering, PDF output, discounts, partial payments and void/reversal.
Tests: calculations, concurrency, historical snapshots, permissions, PDF content.
Gate: financial reconciliation test suite passes.

## Phase 8 — Notifications, activity and reporting
Implement in-app/email events, activity log and dashboard metrics.
Tests: delivery failure, permission filtering, audit completeness.
Gate: key events are traceable.

## Phase 9 — Hardening and launch
Accessibility, security, performance, backup restore, content sign-off, smoke tests and deployment.
Gate: `pre-deployment.md` completed and signed.

For every phase: update `PROJECT-STATUS.md` and `CHANGELOG.md`, list files changed, migrations, tests, risks and rollback notes. Never silently skip a phase.
