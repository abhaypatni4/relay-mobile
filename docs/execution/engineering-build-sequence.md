# Relay — Engineering Build Sequence

## Sequencing Principles

1. Build foundational layers before features
2. Build features in dependency order (what others depend on first)
3. Build the most adoption-critical flows first (trip coordination slice)
4. Use mocked data for flows that depend on unbuilt features
5. Each phase should produce something testable by the team

---

## Phase 0: Foundation (Target: ~10 days)

**Goal:** Infrastructure and data model in place. No UI needed yet.

### Backend
- [ ] Project setup: Node + Express/Fastify + Prisma + PostgreSQL
- [ ] **Complete** database schema migration (ALL models — do not build partial schema)
- [ ] Authentication: register, login, refresh, logout endpoints
- [ ] JWT middleware: authenticate + requireTeamMember + requireRole
- [ ] Role serializer: strips fields by role on response
- [ ] Push notification service: APNs + FCM integration via OneSignal or Firebase Admin
- [ ] BullMQ setup with Redis: job infrastructure ready (3 queue definitions)

### Mobile
- [ ] Project scaffold: Expo bare workflow + TypeScript + ESLint + Prettier
- [ ] React Navigation: complete navigation skeleton with all routes as placeholders
- [ ] Deep link configuration: URL scheme relay:// + linking config (ALL routes mapped, even placeholder screens)
- [ ] Design tokens: colors, typography, spacing, radius, duration from design system
- [ ] Zustand stores: authStore, teamStore, uiStore
- [ ] React Query setup: client configuration + MMKV persister
- [ ] Axios instance: base URL, JWT interceptors, refresh logic
- [ ] NetInfo: offline detection wired to uiStore.isOffline
- [ ] Expo Notifications: push token registration flow (infrastructure only; permission not yet triggered)
- [ ] Tier 1 + Tier 2 UI components: Text, Icon, Divider, ScreenContainer, CardContainer, ListRow, LoadingButton, Toast, SkeletonLoader, InlineError, OfflineBanner
- [ ] useCurrentMember hook and role utilities

**Milestone output:** App launches on both platforms. Navigation skeleton works. Deep links route to placeholder screens from killed state (physical device test). Push notification arrives on physical device. Offline detection works. Tokens applied.

**STOP — verify push notification on physical device before proceeding.**

---

## Phase 1: Team and Onboarding (Target: ~8 days)

**Goal:** Coordinator can create team and invite players. Players can join.

### Backend
- [ ] Team CRUD endpoints
- [ ] TeamMember endpoints (list, detail, remove)
- [ ] Invitation link generation, validation, acceptance
- [ ] PATCH /users/me (profile update)
- [ ] PATCH /users/me/emergency-info

### Mobile
- [ ] Splash, Login, AccountCreation screens
- [ ] Create Team, InviteMembers onboarding screens
- [ ] AcceptInvite, EmergencyInfoPrompt screens
- [ ] Team Roster screen (coordinator + player views)

**Milestone output:** Full onboarding loop on two physical devices. Push tokens registered. Both users see each other in roster.

---

## Phase 2: Trip Creation and Publication (Target: ~12 days)

**Goal:** Coordinator creates and publishes a complete trip. Push notifications arrive on player devices.

### Backend
- [ ] Event CRUD endpoints
- [ ] Trip workspace endpoints (with itineraryVersion management — MUST be atomic)
- [ ] Squad assignment endpoints
- [ ] Trip publication with push notification dispatch
- [ ] TRIP_PUBLISHED, ITINERARY_CRITICAL_FIELD_CHANGED, TRIP_CANCELLED notifications

### Mobile
- [ ] EventsListScreen + EventCard
- [ ] CreateEventScreen, EditItineraryScreen, SquadSelectionScreen, TripReviewScreen
- [ ] TripDetailScreen (itinerary + squad sections — NO documents or pre-departure yet)
- [ ] AcknowledgmentButton + useTripAcknowledgment hook
- [ ] TripCard components (coordinator + player variants)
- [ ] CoordinatorHome + PlayerHome

**Milestone output:** Full trip flow. Coordinator creates → publishes → player receives push → player acknowledges → coordinator sees count → coordinator updates time → player re-acknowledges. Offline trip card works.

**STOP — real-team test before Phase 3.**

---

## Phase 3: Trip Cancellation and First Slice Hardening (Target: ~5 days)

**Goal:** Cancellation complete. First slice production-quality.

### Backend
- [ ] Trip cancellation endpoint (TRIP_CANCELLED notification)

### Mobile
- [ ] Cancellation flow in TripDetailScreen (two-step ConfirmationSheet)
- [ ] Cancelled state in TripDetailScreen and EventsListScreen
- [ ] Offline cache verification (all first-slice screens)
- [ ] Deep link routing verification from killed state (all first-slice notification types)

**Milestone output:** First slice is production-quality. Real-team test validates the product replaced WhatsApp for trip coordination.

---

## Phase 4: Availability and Selection (Target: ~8 days)

**Goal:** Full availability loop — players submit, coaches decide, players notified.

**Pre-condition:** Integration test confirming Medically Restricted is absent from Player-role responses MUST pass before this phase ships.

### Backend
- [ ] Availability window endpoints (open, get, submit, lock, notify)
- [ ] Operational status endpoint
- [ ] Selection notification dispatch (individual per player)
- [ ] AVAILABILITY_WINDOW_OPENED, AVAILABILITY_LOCKED, SELECTION_SELECTED, SELECTION_NOT_SELECTED notifications

### Mobile
- [ ] AvailabilitySubmissionScreen (full screen, all states)
- [ ] AvailabilityRosterScreen (coach/coordinator)
- [ ] OperationalStatePicker (bottom sheet)
- [ ] EventDetailScreen (Match/Training with availability section)
- [ ] CoachHome (availability summary)
- [ ] PlayerHome (selection status + availability prompt)

**Milestone output:** Full availability loop. Player submits → coach sets selection → notifications sent → player sees status.

---

## Phase 5: Structured Communication Feed (Target: ~8 days)

**Goal:** Full post lifecycle — creation, delivery, acknowledgment, nudge.

### Backend
- [ ] Post CRUD endpoints + delivery state tracking
- [ ] Overdue detection BullMQ job (runs every 30 minutes)
- [ ] Nudge endpoint with rate limiting (once per member per post per 24hrs)
- [ ] POST_ACKNOWLEDGMENT_REQUIRED, POST_GENERAL, ACKNOWLEDGMENT_NUDGE notifications

### Mobile
- [ ] FeedScreen (role-filtered, offline last 50 posts)
- [ ] PostCreationScreen (auto-save draft, resume prompt)
- [ ] PostDetailScreen (acknowledgment + delivery state + nudge)
- [ ] PostCard component

**Milestone output:** Full communication loop. Coordinator posts → delivery tracking → player acknowledges → overdue detection → nudge sends.

---

## Phase 6: Document Checklist and Emergency Info Access (Target: ~8 days)

**Goal:** Document workflow complete. Emergency info accessible in trip.

### Backend
- [ ] Document checklist endpoints (CRUD + confirm + remind)
- [ ] Emergency info access endpoint (with access logging)

### Mobile
- [ ] DocumentChecklistSection in TripDetailScreen
- [ ] ChecklistItem components (player + coordinator variants)
- [ ] EmergencyInfoCard component
- [ ] Emergency info access path in TripDetailScreen (≤3 taps)

**Milestone output:** Trip workspace complete. Emergency info accessible offline in ≤3 taps.

---

## Phase 7: Operational Continuity (Target: ~8 days)

**Goal:** Coordinator handoff, postponement, pre-departure checklist complete.

### Backend
- [ ] Trip postponement endpoint
- [ ] Coordinator transfer endpoints (initiate, accept, decline)
- [ ] Transfer expiry BullMQ job (runs hourly)

### Mobile
- [ ] Trip postponement flow in TripDetailScreen
- [ ] PreDepartureChecklistSection in TripDetailScreen
- [ ] TeamSettingsScreen, CoordinatorHandoffScreen, AcceptTransferScreen
- [ ] NotificationPreferencesScreen

**Milestone output:** Feature freeze. All MVP features implemented. Tag v0.9.0-feature-complete.

---

## Phase 8: Analytics, Accessibility, QA, and Submission (Target: ~8 days)

**Goal:** Production-ready for App Store and Play Store submission.

- [ ] All analytics events instrumented (see analytics-events-and-metrics.md)
- [ ] Full accessibility audit + remediation
- [ ] Full QA checklist execution (see qa-edge-cases-and-failure-states.md)
- [ ] Performance testing (cold launch ≤3s, list scroll, push latency)
- [ ] App Store Connect + Google Play Console submission

**Milestone output:** Both apps submitted. Tag v1.0.0-mvp.

---

## What Can Use Mocked Data

| Feature | Mocked until |
|---|---|
| Availability section in TripDetailScreen | Phase 4 (availability API built) |
| Feed posts in TripDetailScreen | Phase 5 (feed built) |
| Coach home availability summary | Phase 4 |
| Player selection status on home | Phase 4 |
| Delivery state counts in feed | Phase 5 |
| Overdue detection | Phase 5 |
| Analytics events | Phase 8 |
| Event cadence prompting | Phase 7 |

## What Cannot Be Mocked

- Authentication + JWT
- Role enforcement (server-side)
- Push notification token registration and delivery to physical device
- Offline cache layer
- Itinerary version management (must be atomic)
- Medically Restricted exclusion from player API responses

---

## Mock Data Requirements

Create `src/mocks/` directory with typed mock objects matching TypeScript interfaces exactly:
- One coordinator, one coach, two staff, eight players
- A trip in every status (draft, active, cancelled, postponed)
- A player in every onboarding state (invited, profileIncomplete, active)
- Posts in every type and delivery state
- Availability window with mixed submission states
- Member with stale emergency info (updatedAt > 180 days ago)
- Pending coordinator transfer

Use environment flag `USE_MOCK_DATA=true` to swap between mock and real API. All mock data returns with 300ms delay to simulate network latency.
