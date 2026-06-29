# Component Plan

## Existing/project-specific components to prioritise
No existing repository was supplied. Build project-specific compositions around approved primitives.

## Candidate VibeKit/JB references
Use only after verifying their current source and prerequisites:
- Accessible responsive navigation patterns
- Dashboard shell/sidebar patterns
- Form stepper patterns
- Data-table shells
- Empty/loading state patterns
- Chat interface primitives

## shadcn/ui primitives
Button, Card, Input, Textarea, Select, Checkbox, Radio Group, Form, Dialog, Alert Dialog, Drawer/Sheet, Tabs, Accordion, Dropdown Menu, Popover, Calendar, Badge, Table, Tooltip, Scroll Area, Skeleton, Command and Toast/Sonner.

## Custom components required
- PublicHeader and MobileActionBar
- ServiceCard and ServiceDetailSections
- BookingStepper and BookingSummary
- SuitabilityQuestionRenderer
- ChatBookingWidget
- BookingStatusTimeline
- AvailabilityRequestPicker
- DashboardShell and PermissionGate
- ClientProfileHeader
- FollowUpCard
- MoneyInput and DiscountEditor
- DocumentLineItemsEditor
- DocumentPreview
- PaymentAllocationDialog
- CommunicationChannelToggleGroup
- DynamicBusinessDetails
- MediaPicker
- RichContentEditor with safe output
- ActivityLogList

## Merge rules
- Inspect generated registry files before installation.
- Never overwrite global layout, theme providers, routes or tokens.
- Copy only required dependencies.
- Record every adopted component and local modification.
- Accessibility and project styling override registry demos.

## Deliberately rejected
- Generic prebuilt medical dashboard templates
- Unverified AI chat widgets with direct database access
- Component packs that introduce a second styling system
- Highly animated hero or glassmorphism components
