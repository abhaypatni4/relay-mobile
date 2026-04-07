# Relay — MVP Scope

## MVP Definition

The MVP delivers three complete end-to-end workflows on a shared foundational layer. No workflow is partially built. Each must be usable in real team conditions without forcing users back to WhatsApp for any critical final step.

## Foundational Layer (Required for All Workflows)

- Team creation and role-based membership
- Member invitation (link + phone number)
- Pending / Invited / Active member states
- Minimal player profile with emergency info
- Event object (Match, Training, Trip)
- Role-based visibility throughout
- Push notification system (all critical triggers)
- Offline read-only access to critical data
- Coordinator handoff / ownership transfer
- Light context-aware coordinator event prompting

## Workflow 1: Trip Coordination

Complete end-to-end: itinerary → squad assignment → document checklist → pre-departure checklist → emergency info access.

**In scope:**
- Trip creation with structured itinerary fields
- Departure Time + Departure Meeting Point as Critical Fields (re-acknowledgment on change)
- Traveling squad assignment from roster
- Document checklist (confirm only; no file upload)
- Pre-departure coordinator checklist (auto-populated + custom items)
- Emergency info access from trip squad list (≤3 taps, offline)
- Trip states: Draft, Active, Cancelled, Postponed, Complete
- Cancellation and postponement notification flows

## Workflow 2: Player Availability and Selection

Complete end-to-end: availability window → player submission → coach squad view → selection decision → player notification.

**In scope:**
- Coordinator opens availability window for event
- Player submits: Available / Limited / Unavailable + optional note
- Coach views squad roster with availability + operational states
- Staff sets Medically Restricted (coach-visible, not player-visible)
- Coach sets: Selected / Not Selected / Traveling / Medically Restricted
- Coordinator locks availability window
- Selection notifications sent to all players individually
- Players view their selection status in event detail

## Workflow 3: Structured Communication

Complete end-to-end: post creation → role-filtered delivery → acknowledgment → delivery state visibility → escalation.

**In scope:**
- Post types: Schedule Update, Travel Info, General Announcement, Urgent Alert
- Recipient targeting: Full Team, Traveling Squad, Coaching Staff, All Staff
- Acknowledgment required: Schedule Update, Urgent Alert
- Read-only: Travel Info, General Announcement
- Coordinator sees: Not Seen / Seen / Acknowledged per member
- Overdue detection after configurable threshold (default 4hrs)
- One-tap nudge to all overdue members
- No general chat; no open messaging threads
- Urgent Alert: visually elevated; high-priority push

## Full MVP Scope Classification Table

| Feature | Status | Notes |
|---|---|---|
| Team creation + role setup | **MVP** | |
| Member invitation (link + phone) | **MVP** | |
| Pending/invited player state | **MVP** | |
| Minimal player profile | **MVP** | |
| Emergency info (5 fields) | **MVP** | |
| Event object (Match/Training/Trip) | **MVP** | |
| Trip itinerary + critical fields | **MVP** | |
| Trip squad assignment | **MVP** | |
| Document checklist (confirm only) | **MVP** | |
| Emergency info access in trip | **MVP** | |
| Pre-departure coordinator checklist | **MVP** | |
| Trip states incl. Cancelled/Postponed | **MVP** | |
| Player availability (3 states) | **MVP** | |
| Coach squad view + operational states | **MVP** | |
| Medically Restricted state | **MVP** | |
| Availability lock + selection notification | **MVP** | |
| Structured communication feed | **MVP** | |
| Post types + recipient targeting | **MVP** | |
| Read/acknowledgment states | **MVP** | |
| Overdue detection + one-tap nudge | **MVP** | |
| Coordinator handoff | **MVP** | |
| Push notifications (all triggers) | **MVP** | |
| Coordinator-led onboarding | **MVP** | |
| Offline read-only cache | **MVP** | |
| Document file upload/storage | **Near-term** | Checklist covers MVP need |
| Return travel structured workflow | **Near-term** | Fields exist; workflow later |
| Dietary/accommodation collection | **Near-term** | |
| Recurring trip templates | **Near-term** | |
| Coach session/training notes | **Near-term** | |
| Historical availability trends | **Later** | Needs full season data |
| Player wellness self-report | **Later** | |
| Web coordinator dashboard | **Later** | Justified post-MVP |
| Multi-team administration | **Later** | |
| Calendar integration | **Later** | |
| Roster/eligibility compliance | **Later** | |
| Attendance logging | **Later** | |
| Player whereabouts/check-in | **Later** | Privacy design needed |
| General chat / open messaging | **Never** | |
| Performance analytics / GPS | **Never** | |
| Video and tactical analysis | **Never** | |
| Financial tracking | **Never** | |
| Scouting and recruitment | **Never** | |
| Fan-facing features | **Never** | |
