# Security and Permissions

## Permission model
Use explicit permission checks, not role-name assumptions. Owner receives all permissions by default; Admin and Staff receive configurable subsets.

## Sensitive permissions
- `financials:view`
- `payments:record`
- `documents:void`
- `suitability:view`
- `settings:manage`
- `users:manage`
- `activity:view`

## Enforcement
- Check permissions on the server for every read and mutation.
- UI hiding is convenience only, never security.
- Scope data queries before serialisation.
- Log sensitive and financial actions.

## Health-related data minimisation
Only store booking suitability answers needed for review. Do not store diagnoses, full medical histories or treatment records. Define retention and deletion rules with the owner and legal adviser.

## Application controls
- Zod validation server-side
- Rate limit login, booking, enquiry and chatbot endpoints
- CSRF-safe session strategy
- Secure headers and strict content-security policy adapted for required services
- Sanitise rich content
- Validate uploads by MIME, extension, size and decoded content
- Signed private asset URLs
- No secrets in client environment variables

## Financial controls
- Transactions and row locking where sequence/allocation races are possible
- Idempotency keys for payment and document-issue mutations
- No destructive deletion of issued documents or recorded payments
- Void/reverse with reason, actor and timestamp
- Recalculate all totals server-side
