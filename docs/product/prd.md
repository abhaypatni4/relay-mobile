# Relay — Product Requirements Document (PRD)
### Version 1.0 — MVP

---

## 1. Product Overview

**Product name:** Relay (working name; fallback: Muster)
**Platform:** Mobile-first iOS and Android application
**Stage:** MVP — single team, greenfield, no required third-party integrations
**Target market:** USA — college sports teams and small competitive traveling sports teams
**Coordination threshold:** Teams of 18 or more actively coordinated participants per event

Relay is a mobile-first team coordination platform that replaces fragmented group chats, spreadsheets, and verbal handoffs with a structured, role-aware, confirmation-native system built for the real conditions of traveling team operations.

---

## 2. Feature Requirements

### F-01: Team Creation and Setup

- FR-01.1: Coordinator enters team name (required), sport (optional), home location (optional)
- FR-01.2: Coordinator selects their own role
- FR-01.3: Team created immediately; no approval flow required
- FR-01.4: Coordinator auto-assigned Coordinator role with full permissions
- FR-01.5: After creation, coordinator immediately prompted to create first event or invite members — never an empty dashboard
- FR-01.6: Team name editable after creation
- FR-01.7: Single Coordinator per team at any time; explicit handoff mechanism

**Connected problem:** O-4 (every trip rebuilt from scratch), E-2 (coordinator carries invisible load)

---

### F-02: Member Invitation and Onboarding

- FR-02.1: Coordinator invites via shareable link (unique, expires 7 days) or phone number
- FR-02.2: Invitation link shareable via SMS/iMessage/any messaging app
- FR-02.3: New member flow: confirm name → select role → complete emergency info (skippable once)
- FR-02.4: Emergency info completion prompted but not required to join
- FR-02.5: Members not yet joined shown in Pending state
- FR-02.6: Coordinator sees per-member onboarding state: Invited / Profile Incomplete / Active
- FR-02.7: Coordinator can resend invite with single tap
- FR-02.8: Coordinator can remove member; removed members lose access immediately
- FR-02.9: Pending member state does not block coordinator from including them in trip; blocked actions are visually indicated
- FR-02.10: Invitation link expires after 7 days; coordinator can generate new link

---

### F-03: Player Profile and Emergency Info

- FR-03.1: Profile contains: display name, role, jersey number (optional), emergency info
- FR-03.2: Emergency info fields: Emergency Contact Name (required), Emergency Contact Phone (required), Critical Allergy or Medical Alert (required; "None" is valid), Additional Staff Note (optional)
- FR-03.3: Emergency info displays Last Updated timestamp
- FR-03.4: Emergency info older than 180 days flagged with stale indicator to coordinator
- FR-03.5: Emergency info visible to: own member, Coordinator, Coach, Staff — NOT other Players
- FR-03.6: Emergency info included in offline cache for active trips
- FR-03.7: Member can update own emergency info at any time; coordinator can prompt update
- FR-03.8: Profile photo not in MVP
- FR-03.9: Coordinator can access emergency info from trip squad list within 3 taps

---

### F-04: Event Object

Types: Match | Training | Trip
States: Draft → Active → Cancelled | Postponed | Complete

- FR-04.1: Coordinator creates Event with: type, name, date, start time, location
- FR-04.2: Event types have default behaviors: Match enables availability by default; Trip enables travel workspace
- FR-04.3: Events exist in states: Draft, Active, Cancelled, Postponed, Complete
- FR-04.4: Draft events visible to coordinator only; no notifications sent
- FR-04.5: Active events visible to all assigned members per role
- FR-04.6: Cancelled event: confirms → notifies all → removes from active views → accessible in history
- FR-04.7: Postponed event: notifies all → fresh acknowledgment required if new date/time entered
- FR-04.8: Events displayed chronologically; past events accessible in history
- FR-04.9: Coordinator prompted to create next event if none exist within 14 days (once per 7-day period)
- FR-04.10: Event editing available to Coordinator before event is complete

---

### F-05: Trip Workspace

#### F-05a: Itinerary

Critical Fields (trigger re-acknowledgment on change after publish):
- Departure Time (required)
- Departure Meeting Point (required)

Standard fields (optional):
- Transportation Notes
- Accommodation Name, Address, Check-in Time
- Match/Event Time, Location
- Return Departure Time, Return Departure Point
- Additional Notes

- FR-05a.1: All itinerary fields as defined above
- FR-05a.2: Critical field change after acknowledgment resets all acknowledging players and sends push notification
- FR-05a.3: Player sees "Details coming soon" for empty optional fields
- FR-05a.4: Coordinator sees empty field placeholders
- FR-05a.5: Itinerary included in offline cache
- FR-05a.6: Version-based acknowledgment tracking (itineraryVersion increments on critical field change)

#### F-05b: Trip Squad List

- FR-05b.1: Coordinator selects traveling members from roster
- FR-05b.2: Status per member: Traveling / Not Traveling / Unassigned
- FR-05b.3: Pending members shown with indicator; blocked actions labeled
- FR-05b.4: Coordinator can add/remove until trip marked departed/complete
- FR-05b.5: Players see squad list (names + roles) after trip published
- FR-05b.6: Staff/Coach see full list including operational states

#### F-05c: Document Checklist

- FR-05c.1: Coordinator defines items with name + applicability (All Players / Traveling Squad / Specific)
- FR-05c.2: Suggested list available + custom entry
- FR-05c.3: Player confirms each item with single tap ("I have this")
- FR-05c.4: File upload NOT supported in MVP
- FR-05c.5: Coordinator sees: X of Y confirmed per item + per-player breakdown
- FR-05c.6: One-tap document reminder to members with outstanding items
- FR-05c.7: Pending players show all items as Outstanding

#### F-05d: Pre-Departure Coordinator Checklist

Fixed auto-populated items:
- Squad confirmed (all Traveling assigned)
- Documents collected (all items confirmed or waived)
- Itinerary acknowledged (count of acknowledged players)
- Emergency info on file (all traveling players complete)

Custom items: up to 5 free-text; manually marked complete
Visibility: Coordinator only
Behavior: informational — not a gate to publishing or departure

#### F-05e: Emergency Info Access During Trip

- FR-05e.1: Access path: Trip → Squad List → Player → Emergency Info (≤3 taps)
- FR-05e.2: Read-only card: Contact Name, Phone (tappable), Allergy/Alert, Staff Note, Last Updated
- FR-05e.3: Available to: Coordinator, Coach, Staff only
- FR-05e.4: Cached offline for active trips
- FR-05e.5: Access logged server-side with user ID and timestamp

---

### F-06: Player Availability and Selection

#### F-06a: Player Availability Submission

- FR-06a.1: Coordinator opens availability window; players notified via push
- FR-06a.2: Player submits: Available / Limited / Unavailable
- FR-06a.3: Optional note: max 120 characters
- FR-06a.4: Updateable until coordinator locks
- FR-06a.5: Not Submitted state shown for non-submitters
- FR-06a.6: Maximum 3 taps from notification to submitted state

#### F-06b: Coach/Coordinator Squad View

- FR-06b.1: Per-event roster: name, availability status, operational status, note indicator
- FR-06b.2: Operational states (set by coach/coordinator): Selected / Not Selected / Traveling / Medically Restricted / Unassigned
- FR-06b.3: Medically Restricted: set by Staff or Coordinator; visible to Coach + Coordinator only; NOT to players
- FR-06b.4: State picker: bottom sheet, 1 additional tap to confirm
- FR-06b.5: Filter by availability status / operational status / role
- FR-06b.6: Summary counts: X Available, Y Limited, Z Unavailable, W Not Submitted

#### F-06c: Availability Lock and Selection Notification

- FR-06c.1: Coordinator locks availability; players notified; no more submissions
- FR-06c.2: Confirmation prompt before selection notifications sent
- FR-06c.3: Each player receives individual push: selected or not selected
- FR-06c.4: Notification wording neutral and respectful; no reason required
- FR-06c.5: Medically Restricted players receive not-selected notification without restriction reason
- FR-06c.6: Players view selection status in event detail at any time
- FR-06c.7: Coordinator can send partial notifications and re-notify when complete

---

### F-07: Structured Communication Feed

#### F-07a: Post Creation

- FR-07a.1: Creators: Coordinator and Coach only
- FR-07a.2: Post types: Schedule Update (acknowledgment required), Travel Info (read only), General Announcement (read only), Urgent Alert (acknowledgment required; high-priority push)
- FR-07a.3: Recipient targeting: Full Team / Traveling Squad / Coaching Staff Only / All Staff
- FR-07a.4: Optional: link to specific Event
- FR-07a.5: Coordinator can mark any post Urgent
- FR-07a.6: Plain text only in MVP; no rich media
- FR-07a.7: Grace period deletion: ≤5 minutes; after 5 min requires coordinator confirmation + recipients notified
- FR-07a.8: Posts cannot be edited after publishing

#### F-07b: Feed and Player Experience

- FR-07b.1: Role-filtered feed; posts not targeted to user do not appear
- FR-07b.2: Chronological; pinned posts at top
- FR-07b.3: Unread posts visually distinct
- FR-07b.4: Acknowledgment: single-tap; persists
- FR-07b.5: Last 50 posts cached offline

#### F-07c: Delivery State and Escalation

- FR-07c.1: Coordinator sees per-post summary: Sent / Seen / Acknowledged counts
- FR-07c.2: Coordinator can expand to see per-member status: Not Seen / Seen / Acknowledged
- FR-07c.3: Overdue list after threshold (default 4hrs; coordinator-configurable 1–24hrs)
- FR-07c.4: One-tap nudge to all Overdue members; push references specific post
- FR-07c.5: Nudge cap: once per member per post per 24hrs
- FR-07c.6: Delivery data persists for life of post

---

### F-08: Coordinator Role Handoff

- FR-08.1: Initiated from team settings; coordinator only
- FR-08.2: Target must be Active member (not Pending)
- FR-08.3: Two-step: outgoing initiates → incoming accepts via in-app prompt
- FR-08.4: On transfer: incoming gets full Coordinator permissions; outgoing reverts to declared role
- FR-08.5: All team history, trips, events, posts preserved
- FR-08.6: Transfer logged with timestamp
- FR-08.7: If incoming declines: no change; current coordinator notified
- FR-08.8: Cannot complete to Pending member
- FR-08.9: Maximum one pending transfer at a time

---

### F-09: Push Notification System

- FR-09.1: Permission requested at first genuine value moment (first trip card or selection notification) — NOT on first app open
- FR-09.2: All notification types defined in docs/engineering/notifications-and-alerts.md
- FR-09.3: Notifications are specific and actionable; identify team, event, required action
- FR-09.4: Tapping a notification deep-links directly to relevant content
- FR-09.5: Cap: ≤3 system-generated notifications per user per 24hrs (coordinator nudges excluded)
- FR-09.6: Urgent Alert notifications cannot be fully disabled; can be set to silent
- FR-09.7: Notifications delivered when app is in background or closed

---

### F-10: Event Cadence Prompting

- FR-10.1: If no upcoming Active event: contextual prompt shown on Coordinator Home
- FR-10.2: Detected rhythm: soft prompt near expected creation window
- FR-10.3: In-app only; no push for cadence prompting
- FR-10.4: Maximum once per 7-day period
- FR-10.5: Dismissible; does not reappear for 7 days

---

### F-11: Onboarding Flow

Coordinator sequence:
1. Create account → Create team → Create first event (prompted; cannot skip to empty dashboard) → Invite members → Confirm own profile

Player/Staff sequence (from invitation):
1. Accept invite → Create account → Confirm name and role → Complete emergency info (prompted; skippable once) → Land on team home with real content

- FR-11.1: Each onboarding step has one clear action; no step requires more than 60 seconds
- FR-11.2: Coordinator never presented with empty dashboard as first experience
- FR-11.3: Players who skip emergency info receive single follow-up prompt 24 hours later; not prompted again until coordinator triggers reminder
- FR-11.4: Onboarding progress visible to coordinator per member

---

### F-12: Offline-Tolerant Access

Cached data (read-only offline):
- Active trip itinerary (all fields)
- Trip squad list (names, roles, traveling status)
- Emergency info for all traveling players on active trip
- Last 50 feed posts
- Player's own availability + selection status for upcoming events

- FR-12.1: Cache updated on every app foreground with connectivity
- FR-12.2: Offline indicator: "You're offline — showing last saved info"
- FR-12.3: Write actions disabled with "Available when connected" label
- FR-12.4: Last-synced timestamp shown for cached content
- FR-12.5: Emergency info prioritized in cache if space constrained
- FR-12.6: No offline editing in MVP

---

### F-13: Trip and Event States

States: Draft → Active → Cancelled | Postponed | Complete

**Cancelled:**
- Coordinator confirms cancellation (two-step)
- All assigned members receive push notification
- Event removed from active views; accessible in history with Cancelled label
- No further workflow actions available

**Postponed:**
- Coordinator marks Postponed with optional new date/time
- All members receive push notification
- If new date/time entered: treated as Critical Field change; fresh acknowledgment required
- Event remains in active view with Postponed label

**Complete:**
- Coordinator manually marks complete; event moves to history
- Events past their date auto-labeled "Past" after 24 hours

---

## 3. Non-Functional Requirements

### Performance
- Cold launch to home: ≤3s (mid-range device, 4G)
- Trip card load: ≤2s (4G)
- Push delivery: ≤30s from trigger
- Offline cache population: ≤5s on foreground (4G)
- Core workflows functional on 3G (degraded but usable)

### Reliability
- Uptime target: 99.5% MVP
- No data loss on coordinator writes (confirmed before UI feedback)
- Push notification delivery: highest-priority reliability requirement

### Security
- Emergency info encrypted at rest and in transit
- Role-based access enforced server-side (not client-side only)
- Player availability/notes not accessible to other players (server-side enforcement)
- Emergency info access logged (user ID + timestamp)
- Account deletion: PII removed within 30 days
- Team data scoped; no cross-team data bleed

### Accessibility
- Primary text: WCAG AAA (7:1) on light background
- Secondary text: WCAG AA (4.5:1)
- All status states: color + secondary signal (icon/label/shape)
- Minimum touch target: 48×48pt
- Dynamic Type (iOS) + font scaling (Android) supported
- Emergency info card readable at maximum accessibility text size

---

## 4. Acceptance Criteria by Major Workflow

### Onboarding
- AC-1.1: Coordinator creates team + first event in single session
- AC-1.2: Coordinator never sees empty dashboard as first experience
- AC-1.3: Coordinator invites ≥1 member before leaving onboarding
- AC-1.4: Invited members appear Pending immediately

### Trip Management
- AC-2.1: Coordinator creates complete trip itinerary in one session
- AC-2.2: Players notified within 30s of trip publication
- AC-2.3: Players acknowledge departure time in ≤3 taps
- AC-2.4: Coordinator sees real-time acknowledgment count
- AC-2.5: Critical field change → re-acknowledgment notification ≤30s
- AC-2.6: Emergency info accessible ≤3 taps from squad list
- AC-2.7: Emergency info accessible offline during active trip
- AC-2.8: Pre-departure checklist reflects real-time document + acknowledgment status

### Availability and Selection
- AC-3.1: Player submits availability in ≤3 taps from app open
- AC-3.2: Coach sees all player statuses on one screen (25-person squad)
- AC-3.3: Coach sets operational status in ≤2 taps
- AC-3.4: Player receives selection push ≤30s after coordinator confirms
- AC-3.5: Medically Restricted not shown in player notification
- AC-3.6: Availability lock visually clear to players

### Communication
- AC-4.1: Coordinator creates + publishes post in ≤60s
- AC-4.2: Recipients receive push ≤30s of publishing
- AC-4.3: Coordinator sees real-time delivery state per recipient
- AC-4.4: Overdue list populates at configured threshold
- AC-4.5: One-tap nudge sends without individual selection
- AC-4.6: Players see only role-targeted posts

### Emergency Info
- AC-5.1: Accessible ≤3 taps from trip squad list
- AC-5.2: Accessible offline during active trip
- AC-5.3: Last Updated visible on card
- AC-5.4: Phone number tap initiates native call

### Cancellation / Postponement
- AC-6.1: Cancel notifies all within 30s of confirmation
- AC-6.2: Cancelled event removed from active views immediately
- AC-6.3: Postpone with new date triggers re-acknowledgment
- AC-6.4: Cancellation requires two-step confirmation

### Coordinator Handoff
- AC-7.1: Incoming coordinator receives in-app prompt
- AC-7.2: All history accessible to incoming immediately after transfer
- AC-7.3: Outgoing permissions revert immediately
- AC-7.4: Cannot complete to Pending member

---

## 5. States Reference

### Loading States
- Skeleton screens for list items and cards (not blank screens or full-page spinners)
- Inline spinners for action buttons during async operations

### Success States
- Inline state change (acknowledgment button → confirmed state)
- Inline toast for actions where screen does not change (nudge sent, transfer initiated)
- No full-screen success states except coordinator first-session completion

### Error States
- Inline validation errors (field-level, on blur)
- Action failure toast: "Couldn't save — check your connection"
- No modal error dialogs for recoverable errors

### Offline States
- Non-blocking banner: "You're offline — showing last saved info"
- Cached content shown normally with last-synced timestamp
- Write actions disabled with "Available when connected" label (not error)
- "Back online" toast on reconnection

### Overdue States
- Amber accent color + overdue count badge
- Overdue list surfaces non-acknowledgers at top of delivery panel
- No animation; static amber is sufficient

---

## 6. Dependencies

### Critical Infrastructure (must exist before any feature)
- Authentication system (JWT access + refresh)
- Push notification infrastructure (APNs + FCM)
- Role-based access control (server-side enforced)
- Offline cache layer (MMKV persister)
- Event object data model

### External Dependencies
- APNs (Apple Push Notification Service)
- Firebase Cloud Messaging (FCM)
- App Store and Google Play Store

### Critical Adoption Dependencies
- Coordinator creates events and publishes information — all player-facing value is downstream of this
- Squad install rate — product's coordination value is network-dependent within the team
