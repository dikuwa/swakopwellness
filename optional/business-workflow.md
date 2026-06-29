# Business Workflow

## Booking request
Public or chatbot submission creates/links client, snapshots selected service, stores preferences and screening answers, determines review flag, creates status history, sends notifications and returns a reference.

## Confirmation
Staff review request, contact client, choose confirmed time and set Confirmed. Every status change records actor, timestamp and optional note.

## Manual booking
Uses the same service layer and schema as public bookings. Source is Phone or Manual Admin. No parallel tables.

## Follow-up
Staff create follow-up linked to client and optionally booking. Scheduler derives due-today and overdue views from due timestamp and status.

## Invoice/payment/receipt
1. Create draft invoice from booking/service snapshot.
2. Edit line items and discounts.
3. Issue invoice and reserve unique number.
4. Record one or more payments.
5. Allocate payment to invoice and update balance/status.
6. Generate receipt for actual amount received.
7. Void/reverse rather than delete.

## Communication feature flags
Each public and staff action checks communication settings. Disabling WhatsApp hides UI and rejects WhatsApp as a new preferred channel while preserving historical records.
