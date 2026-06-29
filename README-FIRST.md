# Swakop Wellness Centre — Project Package

## Package purpose
This package defines a complete implementation-ready specification for a modern public website and secure business-management application for Swakop Wellness Centre.

## Operating configuration
- **Mode:** PACKAGE
- **Execution:** CONTINUOUS
- **Project class:** New public website + authenticated operations dashboard + booking system
- **VibeKit/JB selection:** **B — references and components only**
- **Theme:** Light only for v1, with a calm botanical wellness identity
- **Approval state:** Generated from the supplied master generator and project brief; owner validation is still required before implementation begins.

## Read in this order
1. `project-description.md`
2. `design-style-guide.md`
3. `architecture.md`
4. `database-design.md`
5. `security-and-permissions.md`
6. `component-plan.md`
7. `project-phases.md`
8. `testing-plan.md`
9. `pre-deployment.md`
10. `MASTER-CODER-PROMPT.md`
11. `CODER-RULES.md`

## Conflict priority
1. Latest approved owner instruction
2. Verified implementation once coding starts
3. `project-description.md`
4. `design-style-guide.md`
5. `architecture.md`
6. Project-specific optional specifications
7. `project-phases.md`
8. `CODER-RULES.md`
9. VibeKit/JB reference guidance
10. Framework defaults

## Non-negotiable principles
- Do not build a static brochure site.
- Public website, booking form, chatbot, dashboard, documents, services, prices, policies and business settings must use shared dynamic data.
- No real secrets may appear in source control or generated documentation.
- Do not skip phases.
- Do not describe planned functionality as implemented.
- Financial and suitability workflows require server-side validation and permission enforcement.

## Current phase and next action
- **Current phase:** Documentation complete; implementation not started.
- **Next action:** Owner reviews unresolved assumptions, then a developer starts Phase 0 in `project-phases.md`.
