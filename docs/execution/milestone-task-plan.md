# Relay — Milestone and Task Plan

## Overview

42 tasks across 10 milestones. Tasks are in strict dependency order. Do not start a task until all listed dependencies are complete.

| Milestone | Name | Primary Output |
|---|---|---|
| M0 | Project Foundation | Runnable shell, tokens, auth, push infrastructure |
| M1 | Team and Onboarding | Coordinator creates team; players join |
| M2 | Trip Creation and Publication | Coordinator builds and publishes a trip |
| M3 | Player Trip Experience and Acknowledgment | Players view and acknowledge; re-ack on change |
| M4 | Trip Cancellation and First Slice Hardening | Cancel flow; real-team validation |
| M5 | Availability and Selection | Full availability loop with selection notifications |
| M6 | Structured Communication Feed | Post creation, delivery states, nudge |
| M7 | Document Checklist and Emergency Info | Document confirmation; emergency info access |
| M8 | Operational Continuity | Coordinator handoff; postponement; pre-departure checklist |
| M9 | Analytics, Accessibility, and Polish | Instrumentation, a11y audit, QA, submission |

---

## M0: Project Foundation

**Objective:** Infrastructure and shared primitives before any feature.
**Dependencies:** None — this is the root.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M0-T01 | Backend project scaffold | None | Running server, GET /health |
| M0-T02 | Complete Prisma schema | M0-T01 | All domain models migrated |
| M0-T03 | Auth endpoints + JWT | M0-T02 | register, login, refresh, logout |
| M0-T04 | Role-based API middleware | M0-T03 | authenticate + requireTeamMember + requireRole |
| M0-T05 | Role-based response serializers | M0-T04 | Medically Restricted exclusion enforced |
| M0-T06 | Push notification service | M0-T03, M0-T05 | Push delivered to physical device |
| M0-T07 | Background job infrastructure | M0-T01 | BullMQ + Redis with 3 queue definitions |
| M0-T08 | Mobile project scaffold | None (parallel) | Expo app builds on both platforms |
| M0-T09 | Design tokens | M0-T08 | All color/type/spacing/radius/duration tokens |
| M0-T10 | TypeScript model interfaces | M0-T08 | All domain models typed; nav params typed |
| M0-T11 | Zustand stores | M0-T10 | authStore, teamStore, uiStore |
| M0-T12 | Axios API client + JWT interceptors | M0-T11, M0-T03 | Auto-refresh on 401 |
| M0-T13 | React Query + MMKV persister | M0-T08 | Cache persists across app restarts |
| M0-T14 | NetInfo + OfflineBanner | M0-T11, M0-T09 | Offline state detection; banner component |
| M0-T15 | Navigation shell + deep link config | M0-T10, M0-T11 | All routes; all deep links from killed state |
| M0-T16 | Expo push notification client | M0-T15, M0-T06, M0-T12 | Tap from killed app → correct screen |
| M0-T17 | Tier 1 + 2 foundation UI components | M0-T09, M0-T08 | Text, Icon, all layout + feedback components |
| M0-T18 | useCurrentMember + role utilities | M0-T11 | Hook + all role check functions + unit tests |

**Stop point:** Push delivers to physical device. Deep links route from killed state. Offline banner works. All tokens applied.

---

## M1: Team and Onboarding

**Objective:** Full onboarding loop with real API.
**Dependencies:** M0 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M1-T01 | Team + member backend endpoints | M0-T04, M0-T05, M0-T02 | Team CRUD; member list with serialization |
| M1-T02 | Invitation backend endpoints | M1-T01 | Link generate, validate, accept; profile update |
| M1-T03 | Auth + coordinator onboarding screens | M0-T17, M1-T01, M1-T02 | Login, CreateTeam, InviteMembers |
| M1-T04 | Player invitation + emergency info screens | M0-T17, M1-T02 | AcceptInvite, EmergencyInfoPrompt |
| M1-T05 | Team roster screen | M0-T17, M0-T18, M1-T01 | Roster with role views |

**Stop point:** Two physical devices; coordinator creates team, player joins, both see each other in roster.

---

## M2: Trip Creation and Publication

**Objective:** Coordinator half of first usable slice.
**Dependencies:** M1 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M2-T01 | Event + trip workspace backend endpoints | M0-T04, M0-T06, M0-T02, M1-T01 | All trip endpoints with version management |
| M2-T02 | Tier 3 overlay + input components | M0-T17 | BottomSheet, ConfirmationSheet, TextInput, DateTimePicker, SectionHeader, SectionDivider |
| M2-T03 | Trip creation multi-step flow screens | M2-T01, M2-T02, M0-T17, M0-T18 | CreateEvent through TripReview; Publish works |
| M2-T04 | Events list screen + EventCard | M2-T01, M0-T17 | EventsListScreen with role-appropriate Create button |

**Stop point:** Coordinator publishes trip. Push arrives on player device within 30 seconds.

---

## M3: Player Trip Experience and Acknowledgment

**Objective:** Player half of first usable slice. Full acknowledgment loop.
**Dependencies:** M2 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M3-T01 | Acknowledgment backend endpoint | M2-T01 | Version validation; 409 on mismatch |
| M3-T02 | AcknowledgmentButton + useTripAcknowledgment | M3-T01, M0-T17, M0-T18 | Optimistic update; re-ack state; offline |
| M3-T03 | TripDetailScreen (itinerary + squad sections) | M3-T02, M2-T01, M0-T17, M0-T18 | Full workspace; offline-tolerant |
| M3-T04 | TripCard components | M0-T17, M0-T09 | Coordinator + Player variants |
| M3-T05 | Home screens (Coordinator + Player) | M3-T04, M2-T04, M0-T18 | Role-aware homes; useful in non-travel weeks |

**Stop point:** Full acknowledgment loop verified. Player taps notification from killed state → TripDetailScreen. Re-acknowledgment works. Offline trip card works.

---

## M4: Trip Cancellation and First Slice Hardening

**Objective:** Cancellation complete. First slice production-quality.
**Dependencies:** M3 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M4-T01 | Trip cancellation backend endpoint | M2-T01, M0-T06 | Irreversible cancel; notification dispatch |
| M4-T02 | Cancellation flow in TripDetailScreen | M4-T01, M3-T03, M2-T02 | Two-step ConfirmationSheet; cancelled state |
| M4-T03 | Offline cache verification | M0-T13, M3-T03 | All first-slice screens work offline |
| M4-T04 | Deep link routing verification | M0-T15, M0-T16 | All notification types from killed state on both platforms |
| M4-T05 | Real-team end-to-end test session | M4-T01 through M4-T04 | No P0/P1 issues; coordinator confirms WhatsApp not needed |

**Stop point:** Real-team test validates first slice. Tag v0.2.0-first-slice-validated.

---

## M5: Availability and Selection

**Objective:** Full availability loop.
**Dependencies:** M4 complete.

**Pre-condition:** Integration test confirming Medically Restricted is absent from Player-role responses MUST pass before this milestone ships.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M5-T01 | Availability backend endpoints | M2-T01, M0-T06, M0-T05 | All 6 availability endpoints; serializer enforcement |
| M5-T02 | AvailabilityPicker + AvailabilitySubmissionScreen | M5-T01, M0-T17, M2-T02 | Full-screen player flow; all states |
| M5-T03 | OperationalStatePicker + AvailabilityRosterScreen | M5-T01, M2-T02, M0-T17 | Coach view; selection notifications |
| M5-T04 | Selection notification integration | M5-T01, M5-T02, M5-T03, M3-T05 | PlayerHome + CoachHome + EventDetailScreen |

**Stop point:** Full availability loop on physical devices. Medically Restricted confirmed absent from player responses.

---

## M6: Structured Communication Feed

**Objective:** Full post lifecycle.
**Dependencies:** M5 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M6-T01 | Post backend endpoints + overdue job | M0-T07, M0-T06, M1-T01 | Post CRUD; delivery tracking; overdue job; nudge |
| M6-T02 | PostCard + PostCreationScreen + FeedScreen | M6-T01, M0-T17, M2-T02 | Feed with role filtering; draft auto-save |
| M6-T03 | PostDetailScreen + delivery state + nudge | M6-T01, M6-T02, M0-T17 | Acknowledgment; delivery panel; nudge |

**Stop point:** Full communication loop. Coordinator posts → delivery tracking → player acknowledges → overdue detection → nudge.

---

## M7: Document Checklist and Emergency Info Access

**Objective:** Trip workspace complete with documents and emergency info.
**Dependencies:** M4 complete (trip workspace exists); M1 complete (emergency info collected).

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M7-T01 | Document checklist backend endpoints | M2-T01 | CRUD + confirm + remind |
| M7-T02 | Emergency info access backend endpoint | M2-T01, M1-T01 | Access with logging; stale flag |
| M7-T03 | Document checklist UI in TripDetailScreen | M7-T01, M3-T03 | ChecklistItem components; coordinator + player views |
| M7-T04 | EmergencyInfoCard + access in TripDetailScreen | M7-T02, M3-T03, M0-T13 | ≤3 taps; offline-tolerant |

**Stop point:** Emergency info in ≤3 taps confirmed on physical device. Offline emergency info confirmed. Access logging confirmed in DB.

---

## M8: Operational Continuity

**Objective:** All operational continuity requirements complete.
**Dependencies:** M7 complete.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M8-T01 | Trip postponement backend + UI | M3-T01, M4-T01 | Postponement with optional re-ack |
| M8-T02 | Pre-departure coordinator checklist | M7-T03, M7-T04, M5-T01 | Auto-populated + custom items |
| M8-T03 | Coordinator handoff backend endpoints | M0-T07, M0-T06, M1-T01 | Transfer; accept/decline; expiry job |
| M8-T04 | Coordinator handoff mobile screens | M8-T03, M0-T15, M0-T16 | TeamSettings; Handoff; AcceptTransfer; Preferences |

**Stop point:** Feature freeze. Tag v0.9.0-feature-complete.

---

## M9: Analytics, Accessibility, and Polish

**Objective:** Production-ready for submission.
**Dependencies:** M8 complete. Feature freeze active.

| Task ID | Task Name | Dependencies | Key Output |
|---|---|---|---|
| M9-T01 | Analytics instrumentation | M8 complete | All events from analytics spec firing |
| M9-T02 | Accessibility audit + remediation | M9-T01 | All a11y QA items passing |
| M9-T03 | Full QA checklist execution | M9-T02 | All P0/P1/P2 items passing |
| M9-T04 | Performance testing + optimization | M9-T02 | Cold launch ≤3s; push latency ≤30s |
| M9-T05 | App Store + Play Store submission | M9-T04 | Both apps submitted |

**Final tag:** v1.0.0-mvp

---

## Critical Path Summary

First usable slice: **M0 → M1 → M2 → M3 → M4**
MVP complete: **M0 through M9**

The Medically Restricted integration test gate at M5 is the most critical security checkpoint. Do not cross it without an explicit passing test.
