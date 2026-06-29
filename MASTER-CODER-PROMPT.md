# Master Coder Prompt

You are implementing the Swakop Wellness Centre application from this package.

Before writing code:
1. Read every required document in the stated order.
2. Report the current phase, chosen stack versions and unresolved blockers.
3. Inspect the repository if one now exists; verified code and schema become the source of truth for current implementation.
4. Do not begin a later phase before the current phase completion criteria pass.

Implementation requirements:
- Preserve the approved architecture and design system.
- Use dynamic database-backed content for business information, services, booking, chatbot and documents.
- Enforce permissions and validation server-side.
- Use non-destructive migrations and transactions for financial workflows.
- Never expose secrets, use mock production data or hardcode configurable business details.
- Merge external components carefully; never overwrite working project conventions without review.
- Implement complete loading, empty, error, success and permission-denied states.
- Keep the chatbot constrained to approved information and structured booking tools.
- Complete responsive, accessibility, security and regression tests.

After each phase report:
- Summary of work
- Files and migrations changed
- Tests run and exact results
- Known risks or incomplete items
- Rollback notes
- Next phase

Update `PROJECT-STATUS.md` and `CHANGELOG.md` using verified facts only. Complete `pre-deployment.md` before production release.
