# Database Design

## Core tables
- `users`, `roles`, `permissions`, `role_permissions`, `user_roles`
- `business_settings`, `communication_settings`, `booking_rules`
- `service_categories`, `services`, `service_images`, `service_faqs`, `service_questions`
- `content_pages`, `content_sections`, `faqs`, `media_assets`, `policies`
- `clients`, `client_notes`
- `bookings`, `booking_status_history`, `booking_answers`
- `follow_ups`
- `quotations`, `quotation_items`
- `invoices`, `invoice_items`
- `payments`, `payment_allocations`
- `receipts`, `receipt_items`
- `document_sequences`
- `chat_conversations`, `chat_messages`, `chat_tool_events`
- `notifications`, `notification_preferences`
- `activity_logs`

## Key design rules
- UUID primary keys.
- Money stored as integer cents.
- Timestamps stored in UTC; display in Africa/Windhoek.
- Soft archive for services/content; void/reversal for audit-sensitive financial records.
- Booking stores service name/price/duration snapshots.
- Document items store descriptions and unit prices independently of current services.
- Suitability responses are stored separately with restricted access.
- Contact fields may be normalised for matching but preserve user-entered display value.

## Important constraints
- Unique booking reference.
- Unique invoice, receipt and quotation number.
- Payment amount > 0.
- Document quantity > 0; unit price >= 0.
- Allocation totals cannot exceed payment or invoice balance.
- WhatsApp number required only when WhatsApp is enabled.
- At least one client contact method required at application-validation level.

## Suggested indexes
- bookings `(status, preferred_date)`, `(confirmed_at)`, `(client_id)`, `(created_at desc)`
- clients on normalised phone and lower(email)
- follow_ups `(status, due_at)`, `(assigned_user_id, due_at)`
- documents on number, status, client and issue date
- payments on invoice/client/date
- activity logs on actor/date/entity

## Migration policy
Use `drizzle-kit generate` and `drizzle-kit migrate`. Never use schema push in production. Review SQL before application and include rollback or compensating instructions.
