# Project Description

## 1. Product definition
Swakop Wellness Centre requires a mobile-first public website and secure operational platform. The system must explain services clearly, collect booking requests, support chatbot-assisted bookings, help staff manage clients and follow-ups, and generate invoices, quotations, receipts and payment records.

The application is not a medical diagnosis platform. It supports complementary wellness services and must present clear, editable disclaimers.

## 2. Classification
- New project / greenfield rebuild
- Public content website with authenticated dashboard
- Appointment-request and client-management system
- Lightweight financial-document and payment-recording system
- AI-assisted booking and knowledge interface
- Single-business deployment for v1; not multi-tenant
- Expected initial usage: low-to-moderate local-business traffic, fewer than 20 internal users
- Realtime: not required for core v1; polling or server refresh is sufficient
- Offline mode: not required
- Compliance posture: privacy-first handling of contact and suitability responses; minimise medical data
- Budget posture: practical small-business architecture with managed services

## 3. Users and roles
### Public client
Views content, services, prices, safety information and policies; submits booking or enquiry requests; uses chatbot for approved information and booking assistance.

### Owner
Full operational and financial access; manages users, permissions, settings, content, services, documents and communication channels.

### Admin
Operational access based on permissions. May manage bookings, clients, services, follow-ups and documents but does not automatically receive user-management or full financial privileges.

### Staff
Restricted access to assigned operational tasks. Sensitive suitability data and financial information require explicit permission.

## 4. Value proposition
- Faster service discovery and booking on mobile
- One source of truth for services, prices and business information
- Fewer missed follow-ups and untracked phone bookings
- Safer chatbot behaviour with approved dynamic knowledge
- Professional documents using current business settings
- Expandable service catalogue without code changes

## 5. Core workflow
1. Client discovers a service.
2. Client books through form, chatbot, phone/manual entry, or WhatsApp when enabled.
3. System creates a booking reference and links or creates a client record.
4. Screening answers may set `Requires review`; they never auto-reject.
5. Staff contact and confirm, reschedule or cancel the request.
6. Follow-ups are scheduled and tracked.
7. Staff create quotation/invoice, record payment and issue receipt when needed.
8. All significant actions create notifications and activity-log entries.

## 6. V1 scope
- Public pages: Home, Services, Service Detail, About, FAQs, Book, Contact and Policies
- Dynamic navigation, footer, business details and communication controls
- Multi-step booking request form
- AI booking assistant with structured tools and safety guardrails
- Dashboard overview
- Bookings and calendar
- Clients
- Services and service categories
- Follow-ups
- Quotations, invoices, receipts and payments
- Website content, FAQs, media and policy management
- Business and communication settings
- In-app notifications
- Users, roles and permissions
- Activity log
- PDF preview/download/print
- Email acknowledgement and staff notifications

## 7. Explicitly deferred
- Guaranteed real-time appointment-slot locking
- Online card payments or payment gateway
- Automated WhatsApp Business API messaging
- Medical records, diagnosis, prescriptions or treatment plans
- Multi-branch or multi-tenant SaaS
- Native mobile apps
- Advanced inventory management for supplements
- Accounting-package synchronisation

## 8. Business rules
- Default currency is N$.
- Phone is enabled by default; WhatsApp is disabled by default.
- At least one valid contact method is required for booking.
- Submitted dates are requests until confirmed by staff.
- A booking with flagged suitability responses is saved and marked for review.
- Service prices are editable; historical booking/document prices remain unchanged.
- Issued financial documents are immutable except through explicit void/reversal workflows.
- Document numbering is unique and never reused.
- Document totals are calculated and validated on the server.
- All public service data comes from active, visible database records.
- Deactivated WhatsApp removes all public and staff-facing WhatsApp actions.

## 9. Seed services
Seed as editable data only:
- Basic Health Scan — N$650 — 20–30 minutes
- Frequency Therapy — N$500
- Meridians — N$200
- Food Tolerance and Nutrition Testing — N$300

## 10. Pages and required states
Every data-driven page must support loading, empty, error, success and permission-denied states where applicable. Forms require field-level validation, submission progress, duplicate prevention and retry-safe behaviour.

## 11. Success criteria
- A mobile visitor can understand core services and start booking within two taps.
- A booking request can be completed through form or chatbot and appears in the same dashboard.
- Staff can create a phone booking without a separate workflow.
- Service or price updates propagate to public pages and chatbot knowledge automatically.
- WhatsApp can be enabled or disabled without code changes.
- Financial totals, partial payments and balances reconcile correctly.
- Business details on documents are entirely settings-driven.
- Lint, type checking, tests and production build pass before release.

## 12. Assumptions requiring owner confirmation
- No online payment gateway in v1.
- Booking requests are confirmed manually; there is no immediate slot guarantee.
- Namibia VAT/tax is disabled until the owner supplies valid tax configuration.
- English is the only launch language.
- Existing logo and real facility/staff photography will be supplied before visual sign-off.
- The owner will approve final medical disclaimer, consent and privacy wording.
