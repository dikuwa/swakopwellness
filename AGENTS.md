# AGENTS.md

## Project: Swakop Wellness Centre

This file contains repository-wide operating rules for all coding agents.

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue. You, 6 t

The repository is an existing production application. Work from the current implementation. Do not rebuild the application, replace the design system, or restart completed architecture unless the user explicitly requests it.

---

# 1. EXECUTION CONTRACT

When the user gives an implementation task, that task is authorisation to edit the code.
When the user provides a defined implementation task, do not present alternative improvement gaps or ask which issue to address first. Follow the user’s requested order. Repository audit findings that are unrelated to the task must not replace or delay implementation.

Follow this sequence:

1. Read this file.
2. Read only the repository files relevant to the requested change.
3. Create one short internal checklist.
4. Begin editing.
5. Validate the completed change.
6. Continue to the next checklist item.
7. Run final checks once near completion.

Do not stop after planning when implementation was requested.

Do not wait for a second approval to start coding.

---

# 2. ANTI-LOOP RULES

Do not repeatedly output or regenerate:

- Goal
- Progress
- Next Steps
- Critical Context
- Relevant Files
- rewritten task descriptions
- repeated todo lists
- repeated repository summaries
- repeated Git history
- repeated clean `git status` results
- repeated architecture reviews

A checklist may be created once. Update it briefly rather than recreating it.

After locating the correct file, stop broad repository exploration and work on that file.

If a search pattern returns no result, broaden the search once, locate the real path, and continue. A failed search is not a blocker.

If context compaction occurs:

1. Resume from the existing checklist.
2. Reopen only the next required file.
3. Continue implementation.
4. Do not restart repository discovery.
5. Do not rewrite the full task.

Previous commits, feature names, and historical notes are not proof that the reported bug is fixed. Reproduce or inspect the current behaviour before deciding that no change is required.

If the working tree remains unchanged after inspection, continue immediately to an edit.

---

# 3. PLANNING AND CLARIFICATION

Keep planning short and internal.

Ask the user a question only when implementation cannot safely continue because of a genuine blocker, such as:

- missing credentials required for the requested operation;
- an irreversible or destructive database decision;
- mutually exclusive requirements with no safe default;
- unavailable external access that is essential to the task;
- a corrupted or non-runnable repository.

Do not ask for clarification when the intent can be inferred from the existing code, screenshots, task wording, or established project patterns.

Do not treat a large task, unfamiliar folder structure, missing test script, or failed glob search as a blocker.

---

# 4. SUB-AGENTS

Sub-agents are optional helpers, not a requirement.

The main agent may implement directly.

Use sub-agents only when they provide clear value and do not delay execution. Do not delegate every task. Do not remain in coordinator mode while no code is being changed.

The main agent remains responsible for:

- integrating changes;
- preventing conflicting edits;
- verifying the result;
- completing the task.

---

# 5. WORK IN COMPLETED PHASES

For multi-part tasks:

1. Complete the smallest independent fix.
2. Save the code.
3. Run a focused validation.
4. Record concrete evidence of progress.
5. Move to the next fix.

Concrete evidence includes:

- changed files;
- a meaningful diff;
- a passing focused test;
- a verified browser interaction;
- a successful type check for the affected area.

Do not inspect the entire application repeatedly before making the first change.

---

# 6. EXISTING CODE FIRST

Before creating a new component, handler, API, schema field, or abstraction:

1. Search for the existing implementation.
2. Reuse or repair it.
3. Follow existing naming and folder conventions.
4. Remove obsolete duplicate code when replacing it.

Do not invent file paths.

Do not introduce:

- duplicate forms;
- duplicate APIs;
- parallel data models;
- a second design system;
- a new state-management library for a local fix;
- unrelated dependencies;
- unrelated redesigns;
- mock production data;
- hardcoded business records.

Preserve existing routes, permissions, workflows, references, and live data unless the task explicitly changes them.

---

# 7. UI AND DESIGN

For UI work, read `design-style-guide.md` once before editing the affected interface.

Preserve the established Swakop Wellness system:

- light cream and off-white surfaces;
- muted wellness greens;
- existing typography;
- existing spacing scale;
- existing radii;
- existing shadows;
- existing icons;
- existing form heights;
- existing responsive behaviour.

Reuse shared components.

Do not use:

- browser-default confirmation dialogs;
- browser-native date, time, or select controls where custom controls exist;
- gradients unless already part of the approved design;
- oversized shadows;
- unnecessary rounded cards;
- generic AI-style layouts;
- dark mode.

UI changes must be accessible, responsive, keyboard usable, and free of horizontal overflow.

---

# 8. FORMS AND ASYNC ACTIONS

Use the project’s existing form, validation, server-action/API, loading, modal, and toast patterns.

For every async mutation:

- show local loading state;
- disable the active submit/action control;
- prevent duplicate submission;
- show success feedback;
- show readable error feedback;
- preserve entered values when the request fails;
- close dialogs only after confirmed success;
- refresh or invalidate all affected data views.

Do not rely on toast feedback alone. The clicked control must visibly show that processing is in progress.

Do not expose raw database or server errors to users.

---

# 9. DATA INTEGRITY AND SECURITY

Always:

- validate input server-side;
- enforce permissions server-side;
- use record IDs for relationships rather than display labels;
- preserve booking, client, payment, document, and audit history;
- prevent duplicate booking submission;
- keep financial calculations server-authoritative;
- use transactions for multi-record financial or booking operations;
- avoid silently deleting audit-sensitive records;
- preserve historical service prices and issued-document values;
- avoid unnecessary storage of sensitive wellness information.

Use archive, cancel, void, reverse, or deactivate workflows where appropriate.

---

# 10. DATABASE CHANGES

Do not change the database schema unless the current schema cannot support the requested behaviour.

When a schema change is necessary:

1. Inspect the current schema and existing migrations.
2. Make the smallest compatible change.
3. Generate a proper migration.
4. Review the migration.
5. Apply it with the project’s migration command.
6. Preserve production data.

For Drizzle projects, use the project-equivalent generate and migrate commands.

Never use:

- `drizzle-kit push`
- `drizzle push`
- `db push`
- any equivalent direct schema-push workflow

---

# 11. TESTING

Use focused checks during implementation and full checks once near completion.

Do not run the full build, lint, type check, and test suite after every small edit.

Recommended sequence:

1. Focused validation after each completed phase.
2. Relevant browser flow after UI or workflow changes.
3. Final repository checks near completion.

Use the repository’s actual package manager and available scripts. Do not invent scripts.

Where available, final checks should include:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a script does not exist, report that fact and continue with the checks that are available. Do not stop to ask permission merely because one test script is missing.

For UI changes, test relevant desktop and mobile widths.

For data workflows, test both success and failure states.

Never claim a workflow works unless it was tested or clearly state that it could not be tested.

---

# 12. GIT AND CHANGE SAFETY

Use Git to understand and verify changes, not as a substitute for implementation.

Do not repeatedly run `git log` or `git status` while no code is changing.

Check the working tree:

- once before risky work when useful;
- after meaningful edits;
- at the end.

Do not overwrite unrelated user changes.

Do not reset, discard, or revert unrelated work.

Do not commit unless the user or environment explicitly requires it.

---

# 13. PROJECT GUARDRAILS

Swakop Wellness Centre is a dynamic wellness website and business-management dashboard.

Stable rules:

- Public pages, dashboard modules, booking flows, chatbot, services, prices, documents, and settings must use shared live data.
- Booking sources include website, chatbot, phone, manual admin, and WhatsApp only when enabled.
- A booking belongs to a client.
- A follow-up belongs to a client and may optionally link to one booking.
- Chatbot bookings must enter the same booking, reporting, notification, and activity flows as other bookings.
- WhatsApp controls must remain hidden when WhatsApp is disabled.
- Financial and document information must respect permissions.
- Business details, document details, prices, safety wording, and contact settings must remain editable.
- The site is light-only.
- Use Namibian Dollar formatting as `N$`.
- Preserve human-readable booking and document references.
- Do not hardcode seeded service records into UI components.

This section defines stable constraints only. Current task progress and historical audit notes do not belong in this file.

---

# 14. DEFINITION OF DONE

A task is complete only when:

- the requested behaviour is implemented;
- changed files contain the actual implementation;
- existing functionality is preserved;
- relevant validation and permissions remain enforced;
- loading, empty, success, and error states are handled;
- responsive behaviour is checked where relevant;
- focused tests pass;
- available final checks are run;
- browser behaviour is verified when browser tools are available;
- no critical console or type errors remain;
- the final response accurately reports what was and was not tested.

A clean `git diff` means no implementation was completed.

---

# 15. FINAL RESPONSE FORMAT

After implementation, respond only with:

## Completed
A concise list of changes actually implemented.

## Files Changed
The files actually modified.

## Testing
The checks and browser flows actually completed.

## Remaining Issues
Only genuine unresolved issues. Write `None` when there are none.

Do not repeat the task.

Do not provide another plan.

Do not claim completion for untested or unchanged work.
