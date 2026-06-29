# Coder Rules

1. Read the package before implementation.
2. Preserve the shared-data principle: no duplicate hardcoded service, price or business data.
3. Use reviewed migrations; never use production schema push.
4. Never expose secrets or service-role credentials.
5. Enforce permissions on the server.
6. Validate every public and admin input server-side.
7. Use transactions for financial operations.
8. Never trust client-submitted totals.
9. Preserve historical service and document values.
10. Use void/reversal/archive workflows where required.
11. Do not add mock data to production paths.
12. Handle loading, empty, error, success and permission-denied states.
13. Maintain 320px mobile compatibility and keyboard accessibility.
14. Do not add gradients, glassmorphism or unrelated dashboard patterns.
15. Hide WhatsApp everywhere when disabled.
16. Chatbot cannot diagnose or confirm unsaved bookings.
17. Registry components must be inspected and merged, not blindly installed.
18. Add no dependency without a documented need.
19. Update status and changelog after every phase.
20. Production deployment requires the complete pre-deployment checklist.
