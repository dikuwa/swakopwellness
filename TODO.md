# TODO - Swakop Wellness fixes

- [ ] Phase 2: Fix OPERATIONS sidebar accordion toggle + chevron/aria consistency (in progress)

- [ ] Phase 3/4: Keep compact Bookings layout; implement “More” menu with valid secondary actions only (status-valid, permissions-respecting, portal/z-index correct, close on outside/Esc, focus return)
- [ ] Phase 5: Implement Reschedule modal/drawer workflow that saves a new date + time (no off-by-one/UTC shifts) and updates all dashboard destinations after success
- [ ] Phase 6: Implement expandable action reason input (textarea with max height + internal scroll, modal/popover with loading/validation)
- [ ] Phase 7: Add global loading + completion feedback (toast.loading/success/error + button disabled/spinner) for all dashboard actions touched
- [ ] Phase 9: Verify chatbot bookings are first-class booking records (source=chatbot, flow into bookings/calendar/reports/activity) and fix conversion if needed
- [ ] Phase 10: Repair manual booking form bindings so selected values populate + save correctly
- [ ] Phase 11/12: Repair follow-up form population + relationship logic (client required, booking optional, filter bookings by client, enforce server-side)
- [ ] Phase 13: Fix searchable select dropdown overflow (multiline structured option, bounded popover, scrolling, portal/z-index)
- [ ] Phase 8: Ensure every successful mutation updates dashboard data integrity (overview/counts/calendar/follow-ups/notifications/activity/reports)
- [ ] Phase 17/18: Run lint/typecheck/build and complete browser testing for Operations and bookings/follow-ups/reschedule/manual/chatbot flows
