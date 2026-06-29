# API Specification

## Public reads
- `GET /api/public/services`
- `GET /api/public/services/:slug`
- `GET /api/public/business`
- `GET /api/public/faqs`
- `GET /api/public/policies/:slug`

## Public mutations
- `POST /api/bookings/request`
- `POST /api/enquiries`
- `POST /api/chat`

## Protected resources
- `/api/admin/bookings`
- `/api/admin/clients`
- `/api/admin/services`
- `/api/admin/follow-ups`
- `/api/admin/documents`
- `/api/admin/payments`
- `/api/admin/settings`
- `/api/admin/users`

## Conventions
- JSON responses with stable error codes
- Server validation for all inputs
- Cursor or page-based pagination for lists
- Idempotency header for booking, issue-document and payment endpoints
- Never return sensitive fields unless permission and route require them
- Prefer typed server actions for same-origin UI where appropriate; retain route handlers for chatbot/webhook integrations
