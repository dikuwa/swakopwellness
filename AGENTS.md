# AGENTS.md

## Project: Swakop Wellness Centre

This file defines the operating rules, project context, implementation standards, and quality requirements for all AI coding agents working on this repository.

---

# CRITICAL RULES — MUST FOLLOW

## Responses

- Keep responses concise and focused unless the user explicitly asks for more detail.
- Clearly state what changed, what remains, and any blockers.
- Do not provide unnecessary commentary.
- Never claim something works unless it has been tested.

## Planning Mode

- Always ask clarifying questions before finalising a plan when requirements, design, workflow, or technical choices are unclear.
- Never assume the design system, tech stack, data model, integrations, or features.
- Inspect the existing repository before proposing structural changes.
- Use deep-dive sub-agents for research, architecture review, database review, UI review, security review, and implementation planning when available.
- Use deep-dive sub-agents to review different parts of the plan before presenting it to the user.
- Identify dependencies, risks, migrations, shared components, and affected areas.
- Do not implement changes while still in planning mode unless the user explicitly authorises implementation.

## Change / Edit Mode

- Never implement features yourself when suitable sub-agents are available.
- Use sub-agents for implementation wherever practical.
- Identify work that can be safely completed in parallel and delegate it to separate sub-agents.
- Act as coordinator when sub-agents are implementing:
  - define scope;
  - assign responsibilities;
  - prevent overlapping edits;
  - review outputs;
  - integrate changes;
  - run final verification.
- Use premium or high-capability models for complex coding, architecture, database, security, and debugging tasks.
- Use mid-tier models for simpler tasks such as documentation, content cleanup, and basic analysis.
- Preserve existing functionality unless a change is explicitly required.
- Do not introduce unrelated redesigns, dependencies, abstractions, or features.
- After every completed feature or meaningful edit, run the project’s available quality checks.

Required checks should include, where available:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Use the repository's actual package manager and scripts. Do not invent scripts that do not exist.

---

# DATABASE SCHEMA CHANGES

- Whenever the database schema changes, always generate and apply a proper migration.
- For Drizzle projects, always run the project-equivalent commands for:

```bash
drizzle-kit generate
drizzle-kit migrate
```

- Never run:

```bash
drizzle-kit push
```

- Never use `drizzle push`, `db push`, or any equivalent schema-push workflow.
- Review generated migrations before applying them.
- Preserve production data.
- Use transactions for multi-record financial and booking operations.
- Never silently delete financial, booking, client, or audit data.
- Use archive, cancel, reverse, or void workflows where appropriate.
- Record the user responsible for important changes.
- Preserve historical service prices and issued-document values even when current prices change.

---

# TESTING

- Use all testing tools, libraries, scripts, MCP tools, browser tools, and project skills available in the repository.
- Never assume changes work.
- Test all affected workflows.
- Test both success and failure states.
- Test mobile and desktop behaviour for UI changes.
- Test permissions for protected dashboard functionality.
- Test financial calculations server-side.
- Test booking duplicate prevention and validation.
- Test generated PDFs and print layouts.
- Test chatbot booking persistence and error handling.
- Test communication buttons only when the relevant contact method exists and is enabled.
- If the project has no test tools, scripts, browser tools, MCP tools, or relevant skills, ask the user whether testing may be skipped.
- Do not skip testing without explicit user approval.

---

# UI DESIGN

- Always follow the established UI design system.
- Design system source: `@design-style-guide.md`
- Read `design-style-guide.md` before creating or reviewing any component, page, modal, form, card, table, navigation element, document preview, or responsive layout.
- Reuse existing components, spacing, typography, colours, radii, shadows, icon patterns, form heights, and interaction behaviour.
- Do not create unrelated visual styles.
- Do not use browser-default confirmation dialogs.
- Use the project’s existing modal, toast, drawer, alert, and confirmation patterns.
- Maintain consistent form-control heights across inputs, selects, date pickers, text areas, and buttons.
- Avoid oversized shadows, excessive rounded corners, unnecessary gradients, visual clutter, and generic AI-style layouts.
- Prioritise accessibility, readability, mobile usability, clear hierarchy, and large tap targets.

---

# BUSINESS OVERVIEW

Swakop Wellness Centre is a holistic wellness practice in Swakopmund, Namibia.

## Core business details

- Business name: Swakop Wellness Centre
- Address: Shop 11, Wasserfall Street, Swakopmund, Namibia
- Telephone: +264 64 463 200
- Email: swakopwellnesscentre@gmail.com
- Operating hours: 08:00–17:00
- Appointment model: By appointment only
- Default currency: Namibian Dollar, displayed as `N$`

The business offers non-invasive wellness assessments and frequency-based wellness support using Diacom technology.

The platform must clearly explain that these are complementary wellness services and not a replacement for conventional medical diagnosis or treatment.

All medical, wellness, safety, and treatment-related wording must be editable by authorised administrators.

---

# PRODUCT GOAL

Build a modern, responsive public website and secure business-management dashboard that allows the centre to:

- present its services clearly;
- reduce text-heavy pages;
- allow clients to request appointments;
- allow clients to book through a chatbot;
- allow clients to call the centre;
- optionally enable WhatsApp later;
- manage services and pricing;
- manage clients and bookings;
- follow up with clients;
- create invoices, receipts, and optional quotations;
- record payments;
- manage website content;
- manage chatbot knowledge;
- manage users, roles, permissions, and business settings.

Do not rebuild the old website as a static copy.

The public website, booking system, chatbot, dashboard, services, prices, documents, and business settings must use shared dynamic data.

---

# DEFAULT SERVICES

Create these as initial seeded services only. They must remain fully editable and must not be hardcoded into components.

## Basic Health Scan

- Default price: N$650
- Non-invasive full-body wellness assessment
- May include scan, analysis, wellness report, and follow-up discussion
- Approximate scan duration currently described as 20–30 minutes

## Frequency Therapy

- Default price: N$500
- Frequency-based wellness support tailored to assessment results

## Meridians

- Default price: N$200
- Wellness service focused on meridian pathways and lymphatic support

## Food Tolerance and Nutrition Testing

- Default price: N$300
- May include:
  - food tolerance test;
  - allergen-related wellness test;
  - diet-related wellness recommendations.

---

# SERVICE MANAGEMENT

Administrators must be able to:

- create, edit, archive, delete, activate, deactivate, and reorder services;
- change prices and durations;
- add consultation fees and follow-up services;
- add products, supplements, and future services;
- hide services publicly;
- disable online booking per service;
- manage service-specific safety questions, FAQs, images, and galleries.

Each service should support:

- name;
- slug;
- category;
- short description;
- full description;
- price;
- duration;
- featured image;
- gallery;
- benefits;
- what to expect;
- preparation;
- safety information;
- suitability questions;
- FAQs;
- public visibility;
- booking availability;
- featured status;
- sort order;
- active status.

All public pages, booking forms, chat flows, and documents must read service data from the database.

---

# PUBLIC WEBSITE

Required pages:

- Home
- Services
- Individual service pages
- About
- FAQs
- Book Appointment
- Contact
- Policies

## Homepage priorities

The homepage should make these actions immediately visible:

- Book an Appointment
- Chat to Book
- Call Now
- WhatsApp only when enabled

The homepage should include:

- concise hero;
- service cards;
- prices;
- how the process works;
- why choose the centre;
- safety notice;
- FAQ preview;
- contact and location;
- final booking CTA.

Avoid long uninterrupted text.

---

# BOOKING SYSTEM

Clients must be able to book through:

- standard online booking form;
- chatbot booking assistant;
- telephone;
- manual admin booking;
- WhatsApp only when enabled.

## Booking form requirements

Collect:

- selected service;
- preferred date and time;
- alternative date and time;
- full name;
- phone number;
- optional email;
- optional WhatsApp number when enabled;
- new or returning client;
- optional note;
- preferred contact method;
- suitability responses.

At least one valid contact method is required.

Default booking hours are 08:00–17:00 and must be editable.

The first release should treat submitted times as booking requests unless confirmed availability is implemented.

## Booking statuses

- New request
- Requires review
- Contacting client
- Awaiting client response
- Confirmed
- Rescheduled
- Completed
- Cancelled
- No-show

## Booking sources

- Website form
- Chatbot
- Phone
- Manual admin booking
- WhatsApp when enabled

Every booking must receive a unique, human-readable reference.

Do not confirm a booking unless the booking has been saved successfully.

---

# SUITABILITY SCREENING

Initial configurable questions:

- Are you currently undergoing chemotherapy?
- Are you currently taking strong medication such as antibiotics?
- Do you have a pacemaker or another implanted electronic medical device?

Requirements:

- Questions must be manageable from the dashboard.
- A flagged response must not automatically reject a client.
- Mark flagged bookings as `Requires review`.
- Notify authorised staff.
- Do not allow the chatbot to override safety rules.
- Avoid unnecessary storage of sensitive medical information.
- Restrict access to sensitive responses by permission.

---

# CHATBOT BOOKING ASSISTANT

The chatbot is primarily a booking assistant, not a medical assistant.

It should:

- greet clients;
- show services and prices;
- explain approved service information;
- help clients choose a service;
- collect appointment preferences;
- collect client details;
- ask preferred contact method;
- ask relevant suitability questions;
- show a booking summary;
- save the booking;
- generate a booking reference;
- confirm the request was received;
- offer a call action;
- offer WhatsApp only when enabled.

It must not:

- diagnose;
- confirm medical conditions;
- advise stopping medication;
- promise treatment outcomes;
- claim services cure conditions;
- override restrictions;
- invent prices;
- invent availability;
- confirm unsaved bookings.

The chatbot must read dynamic data from services, prices, durations, FAQs, business settings, operating hours, address, communication settings, safety information, policies, and booking rules.

---

# COMMUNICATION CHANNELS

## Phone

Phone is enabled by default.

Configurable settings:

- main number;
- enable calls;
- show in header, hero, service pages, contact page, mobile action bar, and chatbot.

## Email

Configurable settings:

- business email;
- booking notification email;
- acknowledgement email;
- reply-to address;
- enable email contact.

## WhatsApp

WhatsApp is optional and disabled by default.

Configurable settings:

- enable WhatsApp;
- WhatsApp number;
- default message;
- show in header, hero, service pages, contact section, and chatbot;
- enable staff follow-up.

When disabled:

- do not show WhatsApp publicly;
- do not show WhatsApp as a contact preference;
- do not show WhatsApp actions in the dashboard.

Never assume the WhatsApp number matches the telephone number.

---

# CLIENT MANAGEMENT

Create or update a client record when a booking is submitted.

Client records should support:

- full name;
- phone;
- email;
- WhatsApp number;
- preferred contact method;
- appointment history;
- services received;
- invoices;
- receipts;
- payments;
- follow-ups;
- notes;
- creation date;
- last visit.

Avoid storing unnecessary medical data.

---

# FOLLOW-UPS

Staff must be able to follow up by phone, email, WhatsApp when enabled, in person, or another method.

Follow-up fields:

- client;
- booking;
- due date and time;
- method;
- assigned staff member;
- internal note;
- status;
- reminder setting.

Statuses:

- Pending
- Due today
- Overdue
- Completed
- Cancelled

Provide dashboard views for due today, overdue, upcoming, unconfirmed bookings, and clients awaiting response.

---

# DOCUMENTS

Required document types:

- Invoices
- Receipts
- Quotations, recommended

Documents may be linked to a client, booking, services, and payments.

The original booked service should preload as a line item but must remain editable before the document is issued.

## Editable line items

The owner must be able to:

- add an existing service;
- add a custom item;
- edit description, quantity, and unit price;
- apply line discounts;
- remove line items;
- add consultation, follow-up, report, administration, product, supplement, and future fees.

Custom document items must not require a matching service record.

## Financial calculations

Support:

- subtotal;
- line discounts;
- overall fixed or percentage discount;
- tax when configured;
- amount paid;
- balance due;
- grand total;
- partial payments.

All totals must be calculated and validated server-side.

---

# INVOICES

Invoice fields:

- invoice number;
- issue date;
- due date;
- client;
- booking;
- line items;
- subtotal;
- discount;
- tax;
- total;
- amount paid;
- balance;
- payment status;
- notes;
- terms;
- created by.

Statuses:

- Draft
- Issued
- Partially paid
- Paid
- Overdue
- Cancelled
- Voided

Actions:

- Save draft
- Preview
- Download PDF
- Print
- Email
- Mark issued
- Record payment
- Create receipt
- Duplicate
- Void

Issued invoices must preserve their historical values even when service prices later change.

---

# RECEIPTS

Receipts represent payments actually received.

Receipt fields:

- receipt number;
- payment date;
- client;
- booking;
- linked invoice, optional;
- line items or payment description;
- amount received;
- payment method;
- payment reference;
- notes;
- received by.

Payment methods:

- Cash
- Card
- Bank transfer
- Mobile payment
- Other

Actions:

- Preview
- Download PDF
- Print
- Email
- Duplicate
- Void with reason

Do not assume an invoice is fully paid when generating a receipt.

---

# PAYMENTS

Payment fields:

- client;
- invoice;
- booking;
- amount;
- payment date;
- method;
- reference;
- notes;
- recorded by.

Recording a payment must update invoice balance and status, add payment to client history, support receipt generation, and create an activity-log entry.

Use reversal or void workflows instead of silent deletion.

---

# DOCUMENT NUMBERING

Configurable prefixes:

- Invoice: `SWC-INV-`
- Receipt: `SWC-REC-`
- Quotation: `SWC-QUO-`

Allow configuration of prefix, starting number, padding, reset behaviour, and display format.

Document numbers must be unique and must never be reused after voiding or deletion.

---

# DOCUMENT BUSINESS DETAILS

All document details must come from business settings:

- business name;
- logo;
- address;
- telephone;
- email;
- registration number;
- tax number;
- banking details;
- payment instructions;
- footer message;
- terms;
- authorised name or signature.

Never hardcode banking details, owner names, addresses, telephone numbers, or email addresses in templates.

---

# DASHBOARD MODULES

Required modules:

- Overview
- Bookings
- Calendar
- Clients
- Services
- Service categories
- Follow-ups
- Invoices
- Receipts
- Payments
- Documents
- Chat conversations
- FAQs
- Website content
- Media
- Notifications
- Users and roles
- Business settings
- Communication settings
- Activity log

## Dashboard overview

Show new booking requests, confirmed appointments, appointments today, bookings requiring review, follow-ups due today, overdue follow-ups, outstanding invoices, payments received, recent chatbot bookings, and recent activity.

Quick actions:

- Add booking
- Add client
- Create invoice
- Create receipt
- Add service
- Schedule follow-up

---

# USER ROLES AND PERMISSIONS

Recommended roles:

## Owner

Full access.

## Admin

Operational access subject to permissions.

## Staff

Limited operational access.

Use permission-based authorisation.

Suggested permissions:

- `bookings:view`
- `bookings:create`
- `bookings:update`
- `bookings:delete`
- `clients:view`
- `clients:update`
- `services:manage`
- `documents:create`
- `documents:void`
- `payments:record`
- `financials:view`
- `settings:manage`
- `users:manage`

Only authorised users may access financial information, sensitive screening responses, user management, and business settings.

---

# NOTIFICATIONS

Notify authorised staff when:

- a booking is created;
- a chatbot booking is created;
- a booking requires review;
- a booking is cancelled;
- rescheduling is requested;
- a follow-up is due;
- an invoice is overdue;
- a payment is recorded.

Support in-app and email notifications, with optional WhatsApp notifications in a future phase.

---

# ACTIVITY LOG

Record booking changes, appointment confirmation, client contact, follow-up completion, service and price changes, invoice and receipt creation, payments, document voiding, settings changes, and user-management actions.

Each entry should include user, action, date and time, related record, and a readable summary.

Do not expose raw internal identifiers in the normal UI.

---

# MOBILE REQUIREMENTS

- Design mobile-first.
- No horizontal scrolling.
- Use large tap targets.
- Keep navigation compact.
- Keep text concise.
- Make forms easy to complete.
- Ensure the chatbot does not cover controls.
- Use a sticky mobile booking bar.

When WhatsApp is disabled:

- Call
- Chat to Book
- Book Online

When enabled, options may be configured to show Call, WhatsApp, and Book.

---

# SECURITY AND DATA INTEGRITY

- Validate all input server-side.
- Enforce permissions server-side.
- Protect client and financial information.
- Avoid exposing sensitive screening information.
- Use secure authentication and session handling.
- Prevent duplicate booking submissions.
- Use database constraints where appropriate.
- Use transactions for financial and multi-step operations.
- Preserve issued documents and historical pricing.
- Never silently delete audit-sensitive data.
- Never trust totals or prices submitted from the client.
- Prevent unauthorised document voiding or payment changes.

---

# IMPLEMENTATION ORDER

1. Inspect repository and `design-style-guide.md`
2. Confirm stack and architecture
3. Define database schema
4. Implement authentication and permissions
5. Implement business settings
6. Implement service management
7. Implement public pages
8. Implement booking form
9. Implement chatbot booking
10. Implement booking dashboard
11. Implement clients
12. Implement follow-ups
13. Implement invoices
14. Implement receipts
15. Implement payments
16. Implement notifications
17. Implement activity log
18. Run testing, lint, type checking, and production build

Do not begin with isolated hardcoded static pages. Build shared data and business logic first.

---

# DEFINITION OF DONE

A task is complete only when:

- requirements are implemented;
- existing functionality is preserved;
- UI follows `design-style-guide.md`;
- database changes have generated migrations;
- migrations have been applied using migrate, never push;
- permissions are enforced;
- validation is present;
- error states are handled;
- responsive behaviour has been checked;
- relevant tests have passed;
- lint has passed;
- type checking has passed;
- production build has passed;
- changes have been reviewed for regressions;
- the final response clearly states what changed and what was tested.
