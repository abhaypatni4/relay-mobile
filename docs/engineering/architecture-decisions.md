# Relay — Architecture Decisions

## Decision Log Format

Each decision includes: what was decided, context, rationale, trade-offs, and status.

---

## AD-01: Cross-Platform React Native vs Native iOS/Android

**Decision:** React Native with Expo (bare workflow) for MVP

**Context:** Two native apps vs one shared codebase is the primary platform decision for a small team.

**Rationale:**
- Single codebase reduces MVP development time significantly
- Expo managed workflow handles push notifications, OTA updates, and native module access
- Performance is acceptable for this use case (list views, forms, notifications — not complex graphics)
- React Native's component model supports role-based rendering cleanly

**Trade-offs:**
- Some platform-specific behavior (bottom sheets, native date pickers, haptics) requires platform-specific files
- Slightly larger app bundle than fully native

**Status:** Locked for MVP

---

## AD-02: React Query for Server State

**Decision:** TanStack React Query v5 as the primary server state management approach

**Context:** Server state (events, trips, availability, posts) is the primary source of complexity; local UI state is minimal.

**Rationale:**
- Eliminates boilerplate compared to Redux + thunks
- Built-in caching, revalidation, and optimistic update patterns
- Persisted cache adapter handles offline scenarios cleanly
- Polling (for delivery state updates) is a first-class feature

**Trade-offs:**
- Team must understand React Query's caching model to avoid bugs

**Status:** Locked for MVP

---

## AD-03: Polling vs WebSockets for Delivery State

**Decision:** Polling for MVP; WebSocket post-MVP

**Context:** Coordinator needs "real-time" delivery state updates (Not Seen → Seen → Acknowledged) for posts and itinerary.

**Rationale:**
- WebSocket infrastructure adds server complexity not justified for MVP scale
- Polling every 30–60s is acceptable; coordinator is unlikely to need sub-second updates
- React Query's refetchInterval handles this without custom code
- WebSocket can be added post-MVP without client-side refactoring

**Trade-offs:**
- Delivery states not truly real-time; 30–60s latency
- Increased server load from polling vs persistent connections (acceptable at MVP scale)

**Status:** Locked for MVP; WebSocket planned post-MVP

---

## AD-04: Role-Based Rendering at Component Level (Not Route Level)

**Decision:** Same routes for all roles; role-appropriate content rendered at component level based on role context

**Context:** Could use separate route stacks per role or shared routes with role-aware components.

**Rationale:**
- Deep links to the same entity (a trip) work for all roles; no role-specific URL scheme needed
- Simpler navigation configuration
- Matches the product design intent: "one product, different views"

**Trade-offs:**
- Components must carefully gate role-specific UI
- Risk of accidentally showing coordinator UI to players if role checks are missed (mitigated by server-side enforcement)

**Status:** Locked for MVP

---

## AD-05: Optimistic UI for Core Acknowledgment Actions

**Decision:** Optimistic updates with revert on failure for acknowledgment, availability submission, document confirmation, and operational status changes

**Context:** Mobile connections are unreliable; users need immediate confirmation that their tap was received.

**Rationale:**
- Acknowledgment is the most frequent player action; must feel instant or players lose trust
- React Query's onMutate + rollback pattern handles this cleanly
- Failures are rare; revert + error toast is an acceptable recovery

**Trade-offs:**
- If mutation fails and reverts, user may be confused by state regression; error toast must be clear

**Status:** Locked for MVP

---

## AD-06: Itinerary Version-Based Re-Acknowledgment

**Decision:** Track acknowledgment as a version number comparison rather than a boolean flag

**Context:** When coordinator updates departure time, all players who previously acknowledged must re-acknowledge the new version.

**Rationale:**
- Boolean flag (isAcknowledged) cannot represent "acknowledged version 1; now version 2 exists"
- Version comparison (acknowledgedVersion < currentVersion) cleanly handles multiple critical field changes

**Trade-offs:**
- Slightly more complex query logic for "needs re-acknowledgment"
- Version number must be incremented atomically on critical field update

**Implementation note:** The acknowledgment endpoint must validate expectedVersion from the client. If mismatch, return 409. This prevents stale acknowledgments from being incorrectly accepted.

**Status:** Locked for MVP

---

## AD-07: No General Chat in MVP

**Decision:** No general chat or open messaging threads — ever

**Context:** Coordinator-to-player communication is the core coordination problem; chat is how existing tools fail.

**Rationale:**
- Building a good chat product is a separate product problem
- Chat would compete with WhatsApp and lose
- Structured feed solves the official communication problem without noise
- WhatsApp remains for informal communication; Relay handles official coordination

**Trade-offs:**
- Some users want to reply to posts; they cannot
- Some users want quick questions in-app; they cannot
- This is a deliberate product boundary, not an oversight

**Status:** Locked permanently — not in post-MVP roadmap

---

## AD-08: Emergency Info as Simple Data Store (Not Clinical System)

**Decision:** Emergency info is a lightweight profile layer (5 fields) with role-based visibility; not a clinical record system

**Context:** Player safety during travel requires accessible emergency contact and allergy information; clinical detail is out of scope.

**Rationale:**
- Clinical systems require HIPAA compliance, clinical validation, and medical professional involvement
- The 5-field model covers the most common field emergency scenarios
- Last-updated timestamp and stale flag provide appropriate data quality signaling

**Trade-offs:**
- Emergency info may be incomplete or stale; product cannot guarantee clinical accuracy
- Product makes no claim of medical system compliance

**Status:** Locked for MVP

---

## AD-09: Offline Read-Only (No Offline Write Queue for MVP)

**Decision:** Offline mode supports read-only access to cached data; write actions disabled in MVP

**Context:** Full offline write + sync is complex; read access to emergency info and trip itinerary is the critical safety need.

**Rationale:**
- Emergency info and itinerary must be accessible without signal
- Offline write queue adds conflict resolution complexity
- Most critical actions (acknowledgment) will have connectivity available
- Offline is a short-term state during travel

**Trade-offs:**
- Players cannot submit availability or acknowledge while offline
- Shown as "Available when connected" (a state, not an error)

**Status:** Locked for MVP; write queue planned post-MVP

---

## AD-10: Single Coordinator Per Team

**Decision:** Enforce exactly one Coordinator per team at all times; explicit handoff required

**Context:** Multiple coordinators creates ambiguity about who owns a workflow.

**Rationale:**
- One primary operational owner per workflow mirrors real team operations
- Coordinator handoff is explicit and deliberate; reduces accidental duplicate actions
- Coach role provides elevated permissions for selection without coordinator overhead

**Trade-offs:**
- Teams with genuine co-coordinator models must designate one primary
- Coordinator unavailability requires explicit handoff; cannot simply add a second coordinator

**Status:** Locked for MVP

---

## AD-11: Shared Token Architecture (Design + Engineering)

**Decision:** Design tokens and engineering tokens share identical naming and values; no translation layer

**Context:** Design produces tokens; engineering implements in React Native StyleSheet.

**Rationale:**
- Translation layers create drift over time
- Aligned naming means design changes propagate to code predictably
- Reduces PR review friction for visual changes

**Trade-offs:**
- Requires upfront alignment on naming convention
- Figma variables must be exported in a consumable format (JSON via Style Dictionary or similar)

**Status:** Locked for MVP

---

## AD-12: SF Pro as iOS Typeface

**Decision:** Use SF Pro (system font) for iOS MVP

**Context:** Custom typeface vs system font for brand vs performance trade-off.

**Rationale:**
- SF Pro provides Dynamic Type support automatically
- Zero bundle size cost
- Perfect platform integration (optical sizing, rendering)
- Custom typeface adds bundle size, Dynamic Type complexity, and implementation overhead not justified for MVP

**Trade-offs:**
- Relay looks less typographically distinctive on iOS
- Post-MVP: custom typeface can be evaluated if brand differentiation becomes a priority

**Status:** Locked for MVP
