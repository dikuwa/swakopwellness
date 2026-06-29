# Testing Plan

## Unit
Money calculations, discounts, tax, balance, numbering format, booking reference generation, status transitions, follow-up due-state logic and communication feature flags.

## Integration
Booking persistence, client matching, service snapshots, notification creation, document issue, payment allocation, receipt generation, void/reversal and chatbot tool calls.

## End-to-end
Public booking, chatbot booking, manual booking, review-required path, confirmation/reschedule/cancel, invoice-to-partial-payment-to-receipt, content edits reflected publicly and WhatsApp enabled/disabled.

## Permissions
Test every protected route and mutation for Owner, Admin, Staff and unauthenticated user. Include suitability and financial-field redaction.

## Validation and abuse
Malformed contacts, missing contact method, impossible dates, duplicate submits, oversized uploads, unsupported MIME, rate limits, prompt injection and replayed payment requests.

## Responsive/accessibility
320, 375, 768, 1024 and 1440 widths; keyboard-only flows; screen-reader names; focus order; dialogs; contrast; reduced motion; mobile keyboard and chatbot overlap.

## Performance
Core Web Vitals, image sizes, database query plans, pagination and dashboard list loads.

## Release commands
Use actual project scripts, expected to include lint, typecheck, test and production build. No release with failing required checks.
