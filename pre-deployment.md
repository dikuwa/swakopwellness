# Pre-Deployment Checklist

## Code and data
- [ ] Lint, typecheck, tests and production build pass
- [ ] Migrations reviewed and tested on staging copy
- [ ] Seed is idempotent and contains no secrets
- [ ] Backup and rollback verified

## Authentication and security
- [ ] Owner recovery tested
- [ ] Permission matrix tested
- [ ] Rate limits active
- [ ] CSP/security headers checked
- [ ] Upload validation checked
- [ ] No secrets in client bundle or repository

## Business configuration
- [ ] Business details, logo, hours and address approved
- [ ] Services, prices and durations approved
- [ ] WhatsApp state and number verified
- [ ] Document prefixes and starting numbers approved
- [ ] Tax and banking details confirmed or disabled

## Content and legal
- [ ] Medical disclaimer approved
- [ ] Privacy, consent, cancellation and refund wording approved
- [ ] Images licensed and alt text reviewed

## Booking/chatbot
- [ ] Form and chatbot create the same booking records
- [ ] Review-required logic tested
- [ ] Chatbot safety test set passed
- [ ] No invented availability or prices

## Financial
- [ ] Discounts, partial payments and balances reconcile
- [ ] PDF output reviewed
- [ ] Void/reversal audited
- [ ] Issued document snapshots preserved

## Operations
- [ ] Email sender verified
- [ ] Monitoring and alerts enabled
- [ ] Daily workflow documented
- [ ] Production smoke tests complete
- [ ] Owner sign-off recorded
