# Relay — First Usable Slice

## The Slice

**The Trip Coordination Loop — from coordinator creation to player acknowledgment.**

The exact end-to-end sequence:

A coordinator creates a trip, fills in the departure time and meeting point, assigns a traveling squad, and publishes. Each assigned player receives a push notification, opens their trip card, sees the departure time and meeting point, and taps to acknowledge. The coordinator sees in real time who has acknowledged and who has not. When the departure time changes, the coordinator updates it, players are notified automatically, and must re-acknowledge the new time.

**One operational continuity requirement is included in this slice:** Trip cancellation. If the coordinator cancels the trip, all assigned players are notified immediately and the trip is removed from active views.

---

## Why This Slice

This slice is the single workflow where Relay most visibly and completely replaces WhatsApp for something that matters.

**The typical pre-trip WhatsApp experience:** Coordinator posts departure time in a group chat; it gets buried; nobody knows who actually read it; someone asks what time the bus leaves at 7am Saturday; coordinator sends it again; three players still miss it; bus leaves late. This is a real, recurring, painful failure.

**After this slice:** A coordinator can create a trip, set departure time and meeting point, and know — with real confirmation — who has seen it and who has not. Players receive a push notification that deep links directly to their trip card. They tap once to confirm. When plans change, re-acknowledgment is automatic.

**This is also the best slice because:**
- It tests the hardest technical requirements first (push from killed state, deep linking, optimistic UI, offline-tolerant reading, itinerary version management)
- It produces something a real team can use immediately — no other workflow is needed
- It validates the adoption model (coordinator uses → players follow because product is useful to them)
- It stands alone — availability, feed, and coordinator handoff are not needed for this slice to have value

---

## What Is Explicitly Excluded from This Slice

These are real MVP requirements. They are deferred within MVP to keep the first slice tight.

- Document checklist
- Pre-departure coordinator checklist
- Emergency info access during trip (emergency info is COLLECTED in onboarding; access during trip is deferred)
- Availability and selection workflow
- Communication feed
- Coordinator handoff
- Postponement flow (cancellation only in this slice)
- Pending member handling (simplified — shown but not a focus)

---

## Screens Required for This Slice

### Auth (required to access anything)
- SplashScreen (S-01)
- LoginScreen (S-03)
- AccountCreationScreen (S-02)

### Onboarding
- CreateTeamScreen (S-04)
- InviteMembersScreen
- AcceptInviteScreen
- EmergencyInfoPromptScreen (S-34) — collected here; access deferred

### Core Trip Screens
- EventsListScreen (S-13)
- CreateEventScreen (S-05)
- EditItineraryScreen (S-06)
- SquadSelectionScreen (S-07)
- TripReviewScreen (S-09)
- TripDetailScreen (S-15) — itinerary and squad sections only; documents and pre-departure deferred

### Home
- HomeScreen (role-aware container)
- CoordinatorHome (S-10) — with active trip card variant
- PlayerHome (S-11) — with trip card variant
- CoachHome (S-12) — placeholder only

### Team (minimum for onboarding)
- TeamRosterScreen (S-27)

### Not required in this slice
- PostDetailScreen, FeedScreen, PostCreationScreen
- AvailabilitySubmissionScreen, AvailabilityRosterScreen
- MemberDetailScreen (full emergency info section)
- TeamSettingsScreen, CoordinatorHandoffScreen, AcceptTransferScreen
- NotificationPreferencesScreen, DocumentChecklistBuilderScreen
- PreDepartureChecklistSection within TripDetailScreen

---

## Components Required for This Slice

### Must be built first (in tier order)
- All Tier 1 and Tier 2 foundation components (M0-T17)
- Tier 3: BottomSheet, ConfirmationSheet, TextInput, DateTimePicker, SectionHeader, SectionDivider (M2-T02)

### Domain-specific for this slice
- StatusDot (for traveling status and acknowledgment state)
- TripCard — PlayerTripCard and CoordinatorTripCard (separate components)
- AcknowledgmentButton — the most important interaction component
- SquadMemberRow — for squad list in TripDetailScreen
- EventCard

### Not needed for this slice
- AvailabilityPicker, OperationalStatePicker
- PostCard, DeliveryStateDot, DeliveryStateSummary
- PreDepartureChecklistItem, EmergencyInfoCard, ChecklistItem

---

## Backend Required for This Slice

### Endpoints
- All auth endpoints (M0-T03)
- Team CRUD + member list (M1-T01)
- Invitation endpoints (M1-T02)
- Event CRUD (M2-T01)
- Trip workspace: GET, PATCH /itinerary (with atomic version increment), GET /squad, PATCH /squad, POST /publish (M2-T01)
- POST /itinerary/acknowledge (with expectedVersion validation, 409 on mismatch) (M3-T01)
- POST /events/:eventId/cancel (M4-T01)

### Critical backend logic (must be correct)
- Itinerary version management: increment atomically on Critical Field change on published trip
- Acknowledgment validation: reject with 409 if expectedVersion !== current itineraryVersion
- Publication gating: reject if departureTime or departureMeetingPoint is null
- Cancellation: irreversible; notifies ALL assigned members

### Push notifications for this slice
- TRIP_PUBLISHED
- ITINERARY_CRITICAL_FIELD_CHANGED
- TRIP_CANCELLED

---

## What Can Be Mocked

- Availability section in TripDetailScreen (renders empty; availability built in M5)
- Feed posts in TripDetailScreen (renders empty section; feed built in M6)
- Coach home availability summary (placeholder; built in M5)
- Player selection status on home (placeholder; built in M5)

**Cannot be mocked:**
- Push notification delivery (must test on physical device)
- Deep link routing from killed-app state (device behavior; cannot simulate)
- Acknowledgment race condition (409 on version mismatch requires real DB)
- Medically Restricted exclusion (security enforcement; must be real from M0-T05)

---

## What Can Be Deferred Within This Slice

- Document checklist UI
- Pre-departure checklist
- Emergency info card and access path (info collected at onboarding; access deferred to M7)
- Postponement flow (cancellation only; postponement in M8)
- Optional itinerary field "Details coming soon" placeholder polish
- Full pending member handling (shown with indicator; full workflow in later milestones)
- Event cadence prompting

---

## Success Criteria for This Slice

### Coordinator success
- Creates trip and publishes in under 5 minutes on a phone
- Receives no "what time is the bus?" questions from players who have the trip card
- Sees acknowledgment count update without sending a follow-up message
- Updates departure time; players re-acknowledge; coordinator sees updated count
- Does not send a single WhatsApp message for any of these coordination steps

### Player success
- Receives push notification when added to trip
- Taps notification from killed app; lands on TripDetailScreen (not HomeScreen)
- Sees departure time as the largest text element immediately
- Taps once to acknowledge; confirmed state in ≤150ms
- When departure time changes; receives notification; re-acknowledges the new time
- Never needs to scroll a group chat to find logistics information

### Technical success criteria (all must verify before slice is considered complete)

- [ ] Coordinator creates and publishes trip on physical iOS device; push arrives on physical Android device within 30 seconds while app is killed
- [ ] Player taps push from killed-app state; app navigates to TripDetailScreen (not HomeScreen) on both iOS and Android
- [ ] Player taps AcknowledgmentButton; optimistic confirmed state appears in ≤150ms
- [ ] Coordinator's acknowledgment count updates within 60 seconds via polling (no manual refresh)
- [ ] Coordinator edits Departure Time on published trip; itineraryVersion increments atomically; players who acknowledged receive re-ack push within 30 seconds; their acknowledgment state resets in coordinator view
- [ ] Player taps re-acknowledgment; re-confirms new version; coordinator sees updated count
- [ ] Coordinator cancels trip; all squad members receive push within 30 seconds; trip removed from active views; accessible in Past section with Cancelled label
- [ ] Player opens TripDetailScreen offline (airplane mode); all itinerary fields readable; AcknowledgmentButton shows "Available when connected"; OfflineBanner visible
- [ ] Emergency info is collected during player onboarding (even though access-during-trip is deferred); data stored in DB ready for M7

### Product success (assessed after real-team session)

- [ ] Coordinator completes full trip lifecycle without sending any WhatsApp message for critical coordination
- [ ] ≥80% of players on that trip acknowledge the itinerary within 24 hours of publication
- [ ] Coordinator describes acknowledgment visibility as meaningfully better than their previous process
- [ ] Zero players report missing the departure time because information was unavailable

---

## Milestones This Slice Spans

| Milestone | Contribution to Slice |
|---|---|
| M0 | Infrastructure, push notification plumbing, deep link config, offline cache, auth |
| M1 | Team creation, onboarding, roster |
| M2 | Trip creation and publication (coordinator half) |
| M3 | Player trip card and acknowledgment loop (player half) |
| M4 | Trip cancellation + hardening + real-team validation |

The slice is complete at the end of M4-T05 (real-team test session).

---

## The Adoption Hypothesis Being Tested

The product's central hypothesis: if the coordinator uses Relay for a single trip, players will follow because the product makes their experience meaningfully better than WhatsApp.

This slice tests that hypothesis directly. If players don't acknowledge their trip cards in the first real-team test, the product has an adoption problem. Better to know after the first slice than after building five more milestones on top of a flawed foundation.
