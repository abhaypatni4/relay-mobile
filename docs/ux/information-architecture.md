# Relay — Information Architecture

## Navigation Structure

Primary navigation: 4-tab bottom bar
Tabs: Home | Events | Feed | Team

- No hamburger menu. No sidebar. No hidden navigation.
- Tab state is preserved on tab switch.
- Deep links from push notifications bypass navigation to target content.
- Back is always available from nested screens; no dead ends.

---

## Full IA Tree

```
Relay App
│
├── [TAB] Home (role-aware)
│   ├── Coordinator view:
│   │   ├── Active trip card (if trip within 48hrs or active)
│   │   │   └── [tap] → Trip Detail (S-15)
│   │   ├── Outstanding action items
│   │   │   ├── Overdue acknowledgments → Post Detail
│   │   │   ├── Pending documents → Document Checklist
│   │   │   └── Incomplete emergency info → Member Detail
│   │   ├── Next upcoming event card
│   │   │   └── [tap] → Event Detail
│   │   ├── Unread feed count badge → Feed Tab
│   │   └── Event cadence prompt (if no upcoming events) → Create Event
│   │
│   ├── Coach view:
│   │   ├── Availability summary for next event → Availability Roster
│   │   ├── Outstanding selection decisions
│   │   ├── Next upcoming event
│   │   └── Unread feed count
│   │
│   ├── Player view:
│   │   ├── Selection status card (next event)
│   │   ├── Active trip card (if traveling) → Trip Detail
│   │   ├── Availability prompt (if window open) → Availability Submission
│   │   └── Unread feed count
│   │
│   └── Staff view:
│       ├── Active trip card (if assigned) → Trip Detail
│       ├── Next event details
│       └── Unread feed count
│
├── [TAB] Events
│   ├── Upcoming events list (S-13)
│   │   ├── [tap Match/Training] → Event Detail (S-14)
│   │   │   ├── Event info (name, date, time, location)
│   │   │   ├── Availability section
│   │   │   │   ├── Player: Submit/update status (S-21)
│   │   │   │   └── Coach/Coordinator: Availability roster (S-22)
│   │   │   └── Linked posts
│   │   │
│   │   └── [tap Trip] → Trip Detail (S-15)
│   │       ├── Trip header (name, dates, status, actions)
│   │       ├── Itinerary section (S-16 inline)
│   │       │   └── [coordinator] Edit itinerary → (S-06)
│   │       ├── Squad List section (S-17 inline)
│   │       │   └── [tap member] → Member + Emergency Info (S-18)
│   │       ├── Document Checklist section (S-19 inline)
│   │       ├── Pre-Departure Checklist (coordinator only) (S-20 inline)
│   │       └── [coordinator] Trip actions menu
│   │           ├── Edit trip details
│   │           ├── Cancel trip → confirmation → state change
│   │           └── Postpone trip → optional new date → state change
│   │
│   ├── [+] Create Event button (coordinator only)
│   │   └── Create Event flow (S-05 → S-06 → S-07 → S-08 → S-09)
│   │
│   └── Past events section (collapsed by default)
│       └── [tap] → Event Detail (read-only history view)
│
├── [TAB] Feed
│   ├── Pinned posts (if any)
│   ├── Chronological post list (S-24)
│   │   └── [tap post] → Post Detail (S-25)
│   │       ├── Post content
│   │       ├── Acknowledgment button (if required + not yet done)
│   │       └── Delivery state panel (coordinator/coach only)
│   │           ├── Counts: Sent / Seen / Acknowledged
│   │           ├── Overdue list (after threshold)
│   │           └── Nudge button → confirm → send
│   │
│   └── [+] Create Post button (coordinator/coach only)
│       └── Post creation flow (S-26)
│
└── [TAB] Team
    ├── Team Roster (S-27)
    │   ├── All members with role and onboarding state
    │   ├── [tap member] → Member Detail (S-28)
    │   │   ├── Profile info
    │   │   ├── Emergency info (role-gated)
    │   │   └── [coordinator] Remove from team
    │   └── [coordinator] Invite members button
    │
    └── Team Settings (coordinator only) (S-30)
        ├── Edit team details
        ├── Transfer coordinator role (S-31)
        │   └── [incoming] Accept coordinator transfer (S-32)
        ├── Invitation link management
        └── Notification preferences (S-33)

My Profile (accessible from Team tab or settings):
    ├── Personal info
    ├── Emergency info (S-29)
    └── Notification preferences (S-33)
```

---

## Deep Link Map

| Notification trigger | Deep link | Target screen |
|---|---|---|
| Trip published | relay://trips/:tripId | TripDetailScreen |
| Critical field changed | relay://trips/:tripId?section=itinerary | TripDetailScreen (itinerary section) |
| Trip cancelled | relay://events/:eventId | EventDetailScreen (cancelled state) |
| Trip postponed | relay://trips/:tripId | TripDetailScreen |
| Availability window opened | relay://events/:eventId/availability | AvailabilitySubmissionScreen |
| Selection notification | relay://events/:eventId | EventDetailScreen (player status) |
| Post (acknowledgment required) | relay://posts/:postId | PostDetailScreen |
| Post (general) | relay://posts/:postId | PostDetailScreen |
| Nudge | relay://posts/:postId | PostDetailScreen |
| Document reminder | relay://trips/:tripId?section=documents | TripDetailScreen (documents section) |
| Coordinator transfer | relay://transfers/:transferId | AcceptTransferScreen |
| Emergency info reminder | relay://profile/emergency | EditProfileScreen (emergency tab) |

---

## Role-Based Differences at Same Route

**Trip Detail (/trips/:id):**
- Coordinator: full workspace (itinerary, squad management, document status for all, pre-departure checklist, edit controls)
- Coach: itinerary, squad list with operational states, emergency info access, no edit controls
- Staff: itinerary, squad list, emergency info access, own docs
- Player: personal itinerary card, own document checklist, acknowledgment controls, no squad operational states

**Availability (/events/:id/availability):**
- Player: full-screen submission form or locked read-only state
- Coach/Coordinator: availability roster with all submissions and operational state controls
- Staff: not accessible

**Feed Post (/posts/:id):**
- Player/Staff: post content + acknowledgment button (if required)
- Coach/Coordinator: post content + delivery state summary + overdue list + nudge

---

## Navigation Principles

- **No hamburger menus** — every primary destination is in the tab bar
- **Deep links go deep** — push notification tap navigates directly to target content, not home
- **Back is always available** — no dead ends; no modal-only flows for critical content
- **Tab state preserved** — navigating away from Events tab and returning restores position
- **Bottom sheets for quick actions** — state changes that complete in 1-2 taps use bottom sheet
- **Single scrollable workspace** — TripDetailScreen is one page with sections, not tabs
