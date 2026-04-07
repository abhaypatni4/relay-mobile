# Relay — Execution Task Board

## How to Use This Board

Work through tasks in strict order within each milestone. After each task: run the manual QA checklist, verify acceptance criteria, commit using the suggested commit message. Stop points must be completed fully before crossing.

**Complexity:** Low = straightforward / Medium = requires decisions or integration / High = multiple moving parts or security-critical
**Risk:** Low = contained failure / Medium = affects adjacent tasks / High = blocks downstream or has security implications

---

## M0-T01 — Backend Project Scaffold

**Title:** Initialize and configure the Node.js backend project
**Purpose:** Establish backend project structure before any feature work
**Complexity:** Low | **Risk:** Low

**What to build:**
- Node.js 20 + TypeScript + Express or Fastify
- Folder structure: routes/, middleware/, controllers/, services/, serializers/, jobs/, db/, utils/
- ESLint + Prettier
- Environment variable handling with validation on startup
- Sentry error tracking initialized
- GET /health endpoint returning 200

**Files:** package.json, tsconfig.json, src/app.ts, src/server.ts, .env.example, .eslintrc

**Dependencies:** None

**Done criteria:**
- Server starts on configured port without errors
- GET /health returns 200
- TypeScript compiles with zero errors
- ESLint passes with zero errors
- Folder structure matches specification

**QA checklist:**
- [ ] `npm run dev` — server starts, no errors
- [ ] GET /health — 200 response
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero errors

**Commit:** `chore: initialize backend project scaffold with TypeScript, Express, and health endpoint`
**Checkpoint:** Yes

---

## M0-T02 — Complete Prisma Schema

**Title:** Define the full database schema for all domain entities
**Purpose:** Complete schema before any endpoint — migrations on live data are expensive
**Complexity:** Medium | **Risk:** High

**What to build:**
- Complete Prisma schema for ALL models (see domain-models.md)
- All models: User, Team, TeamMember, InvitationLink, Event, TripWorkspace, TripSquadAssignment, DocumentChecklist, DocumentChecklistItem, DocumentConfirmation, AvailabilityWindow, AvailabilitySubmission, Post, PostDeliveryState, CoordinatorTransfer, EmergencyInfoAccessLog
- All enum types defined
- Initial migration applied to fresh PostgreSQL database

**Files:** prisma/schema.prisma, prisma/migrations/

**Dependencies:** M0-T01

**Done criteria:**
- All models present in schema
- itineraryVersion on TripWorkspace defaults to 1
- acknowledgedItineraryVersion on TripSquadAssignment is nullable integer
- All foreign key relations correct
- `prisma migrate dev` runs without errors
- Prisma Client generates without TypeScript errors

**QA checklist:**
- [ ] `npx prisma migrate dev` on fresh DB — no errors
- [ ] Open Prisma Studio — all tables visible with correct columns
- [ ] TripWorkspace.itineraryVersion column exists with default 1
- [ ] TripSquadAssignment.acknowledgedItineraryVersion is nullable
- [ ] All enum types present

**Commit:** `feat(db): add complete Prisma schema with all domain models and initial migration`
**Checkpoint:** Yes

---

## M0-T03 — Auth Endpoints and JWT Infrastructure

**Title:** Build register, login, refresh, and logout endpoints
**Purpose:** Auth is the entry point to every protected endpoint
**Complexity:** Medium | **Risk:** High

**What to build:**
- POST /auth/register, /auth/login, /auth/refresh, /auth/logout
- JWT signing/verification utility
- Refresh token storage and invalidation on logout

**Files:** src/routes/auth.ts, src/services/auth.service.ts, src/utils/jwt.ts, src/middleware/authenticate.ts

**Dependencies:** M0-T02

**Done criteria:**
- All four endpoints respond correctly
- Access token (15min) and refresh token (30 days) returned on login/register
- Refresh token exchange produces new access token
- Logout invalidates refresh token; subsequent refresh returns 401

**QA checklist:**
- [ ] Register — User created; tokens returned
- [ ] Login with valid credentials — tokens returned
- [ ] Login with invalid credentials — 401
- [ ] Refresh with valid token — new access token
- [ ] Refresh with expired token — 401
- [ ] Logout — subsequent refresh returns 401
- [ ] Protected test route with valid token — 200; without — 401

**Commit:** `feat(auth): add register, login, refresh, logout endpoints with JWT lifecycle`
**Checkpoint:** Yes

---

## M0-T04 — Role-Based API Middleware

**Title:** Build the three-layer authorization middleware chain
**Purpose:** Security foundation before any data endpoint
**Complexity:** Medium | **Risk:** High

**What to build:**
- authenticate: validates JWT, attaches req.user
- requireTeamMember: validates active member of team, attaches req.member with role
- requireRole: validates role is in allowed set, returns 403 if not
- Test route demonstrating all three layers

**Files:** src/middleware/authenticate.ts, src/middleware/requireTeamMember.ts, src/middleware/requireRole.ts

**Dependencies:** M0-T03

**Done criteria:**
- Unauthenticated → 401 from authenticate
- Authenticated, not team member → 403 from requireTeamMember
- Team member, wrong role → 403 from requireRole
- Team member, correct role → passes all layers
- Pending member on protected route → 403

**QA checklist:**
- [ ] Unauthenticated request — 401
- [ ] Authenticated, not team member — 403
- [ ] Team member, wrong role — 403
- [ ] Team member, correct role — 200
- [ ] Pending member — 403

**Commit:** `feat(middleware): add authenticate, requireTeamMember, requireRole middleware chain`
**Checkpoint:** Yes

---

## M0-T05 — Role-Based Response Serializers

**Title:** Build serializers that strip sensitive fields based on role
**Purpose:** Medically Restricted and emergency info must never reach Player-role responses
**Complexity:** Medium | **Risk:** High (security requirement)

**What to build:**
- Base serializer pattern
- TeamMember serializer: strips emergencyInfo for Player-role requests
- AvailabilitySubmission serializer: strips operationalStatus + operationalStatusSetBy for Player-role
- Integration test confirming Player-role response never contains these fields

**Files:** src/serializers/base.serializer.ts, src/serializers/member.serializer.ts, src/serializers/availability.serializer.ts

**Dependencies:** M0-T04

**Done criteria:**
- Coordinator request for member — emergencyInfo fields present
- Player request for member — emergencyInfo fields completely absent (not null, absent)
- Coach request for availability — operationalStatus present
- Player request for availability — operationalStatus completely absent
- String 'medicallyRestricted' never appears in any Player-role API response

**QA checklist:**
- [ ] GET /members as coordinator — emergencyContactName field present in response
- [ ] GET /members as player — emergencyContactName field ABSENT (inspect raw JSON)
- [ ] GET /availability as coach — operationalStatus field present
- [ ] GET /availability as player — operationalStatus field ABSENT (inspect raw JSON)
- [ ] Search player availability response body for "medicallyRestricted" — NOT FOUND

**Commit:** `feat(serializers): add role-based response serializers with Medically Restricted exclusion`
**Checkpoint:** Yes

---

## M0-T06 — Push Notification Service

**Title:** Configure push infrastructure and verify delivery to physical devices
**Purpose:** Push is the product's core communication mechanism; must work before any workflow
**Complexity:** High | **Risk:** High

**What to build:**
- Configure OneSignal or Firebase Admin SDK
- sendToDevice() and sendToMultiple() functions
- PATCH /users/me/push-token endpoint to store tokens
- Notification payload structure including deepLink field
- Send a test notification to physical iOS and Android devices

**Files:** src/services/notification.service.ts, src/routes/users.ts (push-token endpoint)

**Dependencies:** M0-T03, M0-T05

**Done criteria:**
- PATCH /users/me/push-token stores token in User record
- Test notification arrives on physical iOS device with app killed
- Test notification arrives on physical Android device with app killed
- Notification payload includes deepLink field in data object

**QA checklist:**
- [ ] PATCH /users/me/push-token — token stored in DB
- [ ] Send test from backend — arrives on physical iOS device with app KILLED (not simulator)
- [ ] Send test from backend — arrives on physical Android device with app KILLED
- [ ] Notification payload inspected — deepLink field present
- [ ] Send with invalid token — no server crash; error logged

**Commit:** `feat(notifications): add push notification service with APNs/FCM and push token storage`
**Checkpoint:** Yes

---

## M0-T07 — Background Job Infrastructure

**Title:** Set up BullMQ with Redis for background job processing
**Purpose:** Required for overdue detection, transfer expiry, and reminders
**Complexity:** Medium | **Risk:** Medium

**What to build:**
- BullMQ + Redis connection
- Three queue definitions: overdueDetection, transferExpiry, emergencyInfoReminder
- Empty processor scaffolding for all three
- Test job that logs completion

**Files:** src/jobs/queue.ts, src/jobs/overdueDetection.job.ts, src/jobs/transferExpiry.job.ts, src/jobs/emergencyInfoReminder.job.ts

**Dependencies:** M0-T01

**Done criteria:**
- BullMQ connects to Redis on server start without error
- Test job enqueues and processes
- Failed job retries per configuration (not silently dropped)

**QA checklist:**
- [ ] Server starts — BullMQ connects without error in logs
- [ ] Enqueue test job — appears in logs as completed
- [ ] Simulate job failure — job retries

**Commit:** `feat(jobs): add BullMQ background job infrastructure with queue definitions`
**Checkpoint:** Yes

---

## ⛔ STOP POINT — Backend Infrastructure Review
Before starting M0-T08:
- [ ] Push delivers to physical iOS device (app killed)
- [ ] Push delivers to physical Android device (app killed)
- [ ] Auth endpoints tested end-to-end
- [ ] Middleware blocks unauthorized access correctly
- [ ] Serializers strip sensitive fields (Player-role test passing)

---

## M0-T08 — Mobile Project Scaffold

**Title:** Initialize Expo bare workflow React Native project
**Purpose:** Mobile foundation before any UI work
**Complexity:** Low | **Risk:** Low

**What to build:**
- Expo bare workflow + TypeScript template
- ESLint + Prettier
- Folder structure matching frontend-architecture.md
- app.config.ts with bundle ID, URL scheme relay://, Expo plugins
- Sentry initialized

**Files:** app.config.ts, package.json, tsconfig.json, src/ folder structure

**Dependencies:** None (can parallel with M0-T01 through M0-T07)

**Done criteria:**
- `expo start` runs without errors
- iOS simulator build succeeds
- Android emulator build succeeds
- TypeScript: zero errors
- ESLint: zero errors
- All folders from architecture document present

**QA checklist:**
- [ ] `expo start` — no errors
- [ ] iOS simulator — app launches
- [ ] Android emulator — app launches
- [ ] `tsc --noEmit` — zero errors
- [ ] `eslint src/` — zero errors

**Commit:** `chore: initialize Expo bare workflow mobile project with TypeScript and folder structure`
**Checkpoint:** Yes

---

## M0-T09 — Design Tokens

**Title:** Define all design tokens as named TypeScript constants
**Purpose:** Foundation for all UI work — no hardcoded values anywhere
**Complexity:** Low | **Risk:** Low

**What to build:**
- src/tokens/colors.ts — all primitive + semantic color tokens
- src/tokens/typography.ts — 5-scale system with size/weight/lineHeight
- src/tokens/spacing.ts — base-8 named values
- src/tokens/radius.ts — named radius values
- src/tokens/duration.ts — animation duration values
- src/tokens/index.ts — barrel export

**Dependencies:** M0-T08

**Done criteria:**
- All token files export named constants
- Five typography scales defined
- No raw hex values in any token file
- Index.ts exports all tokens cleanly

**QA checklist:**
- [ ] Import tokens in test component — no TypeScript errors
- [ ] Search src/ for "#" (hex) — none found outside colors.ts primitives
- [ ] Search for hardcoded fontSize numbers outside typography.ts — none found

**Commit:** `feat(tokens): add design token system with color, typography, spacing, radius, duration`
**Checkpoint:** Yes

---

## M0-T10 — TypeScript Model Interfaces

**Title:** Define TypeScript interfaces for all domain models
**Purpose:** Contract between client and server — must match Prisma schema field names exactly
**Complexity:** Low | **Risk:** Medium

**What to build:**
- src/types/models.ts — all interfaces from domain-models.md
- src/types/api.ts — request/response envelope types
- src/types/navigation.ts — typed route params for every screen

**Dependencies:** M0-T08

**Done criteria:**
- All model interfaces defined
- All enum types defined
- AvailabilitySubmission.operationalStatus marked as optional (?)
- TeamMember.emergencyInfo marked as optional (?)
- Navigation params typed for all routes
- Zero any types

**QA checklist:**
- [ ] Import all types in test file — zero TypeScript errors
- [ ] Search types/models.ts for "any" — not found
- [ ] AvailabilitySubmission.operationalStatus — typed as optional
- [ ] TeamMember.emergencyInfo — typed as optional

**Commit:** `feat(types): add TypeScript interfaces for all domain models, API types, and navigation params`
**Checkpoint:** Yes

---

## M0-T11 — Zustand Stores

**Title:** Set up authStore, teamStore, and uiStore
**Purpose:** Cross-screen state management foundation
**Complexity:** Low | **Risk:** Low

**What to build:**
- src/store/authStore.ts — userId, accessToken (memory only), isAuthenticated
- src/store/teamStore.ts — activeTeamId, activeTeamMemberId, role
- src/store/uiStore.ts — isOffline, toastQueue, pendingTransferRequest

**Dependencies:** M0-T10

**Done criteria:**
- All three stores initialize correctly
- Actions mutate state as expected
- accessToken NOT persisted (memory only)
- All stores typed with no any types

**QA checklist:**
- [ ] authStore: setAuth + clearAuth work correctly
- [ ] teamStore: setTeamContext + clearTeamContext work correctly
- [ ] uiStore: addToast + dismissToast work correctly
- [ ] Verify accessToken not in any persistent storage after restart

**Commit:** `feat(store): add Zustand authStore, teamStore, uiStore with typed state and actions`
**Checkpoint:** Yes

---

## M0-T12 — Axios API Client and JWT Interceptors

**Title:** Set up HTTP client with JWT and automatic refresh on 401
**Purpose:** All API calls need auth handling before any screen is built
**Complexity:** Medium | **Risk:** Medium

**What to build:**
- src/services/api.ts — Axios instance with baseURL, 15s timeout
- Request interceptor: attach Authorization Bearer token from authStore
- Response interceptor: on 401 → attempt refresh → retry; on refresh fail → clearAuth → navigate to login

**Dependencies:** M0-T11, M0-T03 (backend auth)

**Done criteria:**
- Requests automatically attach Authorization header
- 401 → refresh attempted → original request retried
- Refresh failure → clearAuth + navigate to login
- 15-second timeout enforced

**QA checklist:**
- [ ] Request with valid token — Authorization header attached
- [ ] Expire access token — 401 → refresh → original request retried → 200
- [ ] Expire both tokens — clearAuth called; navigate to login triggered
- [ ] Request >15s — fails with timeout error

**Commit:** `feat(api): add Axios client with JWT request interceptor and automatic refresh on 401`
**Checkpoint:** Yes

---

## M0-T13 — React Query + MMKV Offline Persister

**Title:** Configure React Query with MMKV-backed cache persistence
**Purpose:** Offline cache is a safety requirement, not an optimization
**Complexity:** Medium | **Risk:** Medium

**What to build:**
- TanStack React Query v5 installation and configuration
- MMKV storage instance
- React Query MMKV persister adapter
- QueryClient with staleTime 5min, cacheTime 24hr, 2 retries
- PersistQueryClientProvider wrapping app root
- Auth queries excluded from persistence

**Files:** src/services/offlineCache.ts, app root provider

**Dependencies:** M0-T08

**Done criteria:**
- Query result persisted to MMKV after first fetch
- App restart: cached data available before new network request
- Auth queries NOT persisted
- Failed query retries 2 times before error state

**QA checklist:**
- [ ] Run test query — data stored in MMKV (inspect storage)
- [ ] Restart app — same data available without network request
- [ ] Auth query results NOT in MMKV after restart
- [ ] Failed query — retries twice (verify in logs)

**Commit:** `feat(cache): configure React Query with MMKV offline persistence and retry logic`
**Checkpoint:** Yes

---

## M0-T14 — NetInfo Offline Detection and OfflineBanner

**Title:** Wire network connectivity to uiStore and build the OfflineBanner
**Purpose:** Offline state must be visible on every screen from day one
**Complexity:** Medium | **Risk:** Low

**What to build:**
- NetInfo subscription at root provider level → uiStore.setOffline()
- src/components/feedback/OfflineBanner.tsx — reads uiStore.isOffline
- src/components/feedback/Toast.tsx — used for "Back online" and other confirmations
- Wire both to app root

**Dependencies:** M0-T11, M0-T09, M0-T17 (requires Text component — build Text first as part of M0-T17)

**Note:** Execute M0-T17 Tier 1 components (Text, Icon, Divider) before this task.

**Done criteria:**
- Enable airplane mode → OfflineBanner appears within 2 seconds
- OfflineBanner copy: "You're offline — showing last saved info"
- OfflineBanner uses warm grey background (not red or orange)
- Disable airplane mode → OfflineBanner disappears; "Back online" Toast appears
- Toast auto-dismisses after 3 seconds

**QA checklist:**
- [ ] Airplane mode ON — OfflineBanner appears within 2 seconds
- [ ] OfflineBanner color is warm grey (not red or orange)
- [ ] OfflineBanner does not block interactive content
- [ ] Airplane mode OFF — banner disappears; "Back online" toast appears and dismisses after 3s

**Commit:** `feat(ui): add offline detection with OfflineBanner and Toast components`
**Checkpoint:** Yes

---

## M0-T15 — React Navigation Shell and Deep Link Configuration

**Title:** Build complete navigation structure with all routes and deep link URL mapping
**Purpose:** Navigation must exist before screens; deep link config must be correct from day one
**Complexity:** High | **Risk:** High

**What to build:**
- RootNavigator, AuthNavigator, AppNavigator, MainTabNavigator
- All placeholder screens for every route
- src/navigation/linking.config.ts — every deep link URL mapped to correct screen name
- Test every deep link pattern from killed-app state on physical devices

**Dependencies:** M0-T10, M0-T11

**Done criteria:**
- RootNavigator: unauthenticated → AuthNavigator; authenticated → AppNavigator
- All 4 tabs navigate to placeholder screens
- relay://trips/:id → TripDetailScreen from killed-app state (physical device)
- relay://events/:id/availability → AvailabilitySubmissionScreen from killed-app state
- relay://posts/:id → PostDetailScreen from killed-app state
- relay://transfers/:id → AcceptTransferScreen from killed-app state
- Tab state preserved on tab switch

**QA checklist:**
- [ ] Unauthenticated — AuthNavigator renders
- [ ] Authenticated — MainTabNavigator with 4 tabs
- [ ] All 4 tabs navigate to correct placeholder screens
- [ ] relay://trips/test-id — navigates to TripDetailScreen placeholder from killed iOS app
- [ ] relay://trips/test-id — navigates to TripDetailScreen placeholder from killed Android app
- [ ] Navigate deep in Events tab; switch tabs; switch back — position preserved

**Commit:** `feat(navigation): add complete navigation shell with all routes and deep link configuration`
**Checkpoint:** Yes

---

## M0-T16 — Expo Push Notification Client

**Title:** Wire Expo Notifications for token registration, foreground handling, and tap deep linking
**Purpose:** Cold-start deep link navigation from killed app is the hardest technical requirement
**Complexity:** High | **Risk:** High

**What to build:**
- src/services/notifications.ts
- Token registration (only when permission already granted; NOT on first open)
- Token sync to server on every app foreground (tokens rotate)
- Foreground handler: show in-app Toast, NOT system banner
- Tap handler (background + killed): extract deepLink from notification data → navigate
- Permission request deferred to first genuine value moment

**Dependencies:** M0-T15, M0-T06, M0-T12

**Done criteria:**
- Push token registered and synced to server (app launch, permission already granted)
- Permission NOT requested on first app open
- Foreground: system banner NOT shown; in-app Toast shown
- Background tap: navigates to correct placeholder screen
- Killed-app tap: cold-starts and navigates to correct screen (physical device both platforms)
- Invalid deep link: graceful fallback; no crash

**QA checklist:**
- [ ] Launch app (permission already granted) — push token synced to User record in DB
- [ ] Launch app (no permission) — no permission dialog shown
- [ ] Foreground notification — system banner NOT shown; in-app Toast appears
- [ ] Background tap — navigates to correct screen
- [ ] Killed-app tap on iOS — app cold-starts → correct placeholder screen
- [ ] Killed-app tap on Android — app cold-starts → correct placeholder screen
- [ ] Notification with invalid entity ID — graceful fallback; no crash

**Commit:** `feat(notifications): add Expo push client with token sync, foreground handling, and deep link navigation`
**Checkpoint:** Yes

---

## M0-T17 — Tier 1 and Tier 2 Foundation UI Components

**Title:** Build all foundation and layout components
**Purpose:** Every domain component and screen depends on these — must exist first
**Complexity:** Medium | **Risk:** Medium

**Build in this exact order:** Text → Icon → Divider → ScreenContainer → CardContainer → ListRow → LoadingButton → Toast → SkeletonLoader → InlineError

**What to build:** See component-inventory.md for full specs of each component.

**Dependencies:** M0-T09 (tokens), M0-T08

**Done criteria:**
- All 10 components render correctly
- All values from design token system — no hardcoded hex or pixel values
- Text: all 5 variants at correct size + weight
- ScreenContainer: scrollable prop switches correctly
- CardContainer: shadow visible on both platforms
- ListRow: minimum 56px height; full-width tap zone
- LoadingButton: spinner replaces label; button stays in position
- Toast: appears at bottom; auto-dismisses at correct durations
- SkeletonLoader: shimmer stops if Reduce Motion enabled
- InlineError: renders below field; correct color

**QA checklist:**
- [ ] Text: render all 5 variants — visually distinct sizes and weights
- [ ] Icon: render 3 different icons by name — correct; unknown name — no crash
- [ ] ScreenContainer: scrollable=true — content scrolls; =false — fixed
- [ ] CardContainer: shadow visible on iOS device; shadow visible on Android
- [ ] ListRow: measure tap target — minimum 56px height
- [ ] LoadingButton: isLoading=true — spinner; button position unchanged
- [ ] Toast: success and error variants visually distinct; auto-dismisses
- [ ] SkeletonLoader: enable Reduce Motion — shimmer stops
- [ ] Search all component files for "#" — none found (all values from tokens)

**Commit:** `feat(components): add Tier 1 and Tier 2 foundation UI components`
**Checkpoint:** Yes

---

## M0-T18 — useCurrentMember Hook and Role Utilities

**Title:** Create role context hook and role check utility functions
**Purpose:** Role-based rendering depends on this; must exist before any domain screen
**Complexity:** Low | **Risk:** Low

**What to build:**
- src/hooks/useCurrentMember.ts — returns userId, teamMemberId, role, teamId, onboardingState from stores
- src/utils/roles.ts — all role check functions (see roles-and-permissions.md)
- Unit tests for every function/role combination

**Dependencies:** M0-T11

**Done criteria:**
- useCurrentMember returns correct values from stores
- Returns null values for all fields when unauthenticated (no crash)
- All role utility functions return correct booleans
- canSetMedicallyRestricted: true for coordinator and staff ONLY (not coach)
- Unit tests: 100% passing for all function/role combinations

**QA checklist:**
- [ ] Set teamStore to coordinator — useCurrentMember returns role: 'coordinator'
- [ ] Set teamStore to player — returns role: 'player'
- [ ] Empty stores — returns all nulls without crash
- [ ] canSetMedicallyRestricted(coach) — false (verify this explicitly)
- [ ] Run unit tests — 100% passing

**Commit:** `feat(hooks): add useCurrentMember hook and role utility functions with unit tests`
**Checkpoint:** Yes

---

## ⛔ STOP POINT — M0 Complete

Before starting M1:
- [ ] Backend: all 7 tasks passing; push delivers to physical device
- [ ] Mobile: app builds on both platforms; navigation skeleton works
- [ ] Deep links route from killed state on both platforms (physical device)
- [ ] Notification tap from killed app → correct screen (physical device)
- [ ] Offline banner appears and clears correctly
- [ ] All token values applied — no hardcoded hex values

Tag: `v0.0.1-foundation`

---

## M1-T01 — Team and Member Backend Endpoints

**Title:** Build team CRUD and member list endpoints with role enforcement and serialization
**Complexity:** Medium | **Risk:** Low

**Dependencies:** M0-T04, M0-T05, M0-T02

**Done criteria:**
- POST /teams: creates Team + coordinator TeamMember; returns team with id
- GET /teams/:teamId: returns team details for any active member
- GET /teams/:teamId/members: Player-role request omits emergencyInfo entirely
- PATCH /teams/:teamId: coordinator only; coach/staff/player → 403

**QA checklist:**
- [ ] POST /teams — Team and coordinator TeamMember created in DB
- [ ] GET /teams/:teamId as player — emergencyContactName field ABSENT from response JSON
- [ ] GET /teams/:teamId as coordinator — emergencyInfo fields present
- [ ] PATCH /teams as coach — 403 returned

**Commit:** `feat(api): add team CRUD and member list endpoints with role enforcement`
**Checkpoint:** Yes

---

## M1-T02 — Invitation Backend Endpoints

**Title:** Build invitation link generation, validation, acceptance, and profile update endpoints
**Complexity:** Medium | **Risk:** Low

**Dependencies:** M1-T01

**Done criteria:**
- POST /invitations: creates InvitationLink; revokes previous active link
- GET /invitations/:token: valid → team name; expired → 410; invalid → 404
- POST /invitations/:token/accept: creates TeamMember with invited state
- PATCH /users/me: updates name; transitions onboardingState
- PATCH /users/me/emergency-info: all required fields → onboardingState = active

**QA checklist:**
- [ ] POST /invitations: second call revokes first (first link returns 410)
- [ ] GET /invitations/expiredToken — 410 returned
- [ ] POST /invitations/:token/accept — TeamMember with invited state in DB
- [ ] PATCH /users/me/emergency-info with all required fields — onboardingState = active in DB

**Commit:** `feat(api): add invitation link generation, validation, acceptance, and profile update endpoints`
**Checkpoint:** Yes

---

## M1-T03 — Auth and Coordinator Onboarding Screens

**Title:** Build LoginScreen, AccountCreationScreen, CreateTeamScreen, InviteMembersScreen
**Complexity:** Medium | **Risk:** Low

**Dependencies:** M0-T17, M1-T01, M1-T02

**Done criteria:**
- LoginScreen: valid credentials → authenticated + navigate; invalid → inline error (not alert dialog)
- AccountCreationScreen: duplicate email/phone → specific inline error
- CreateTeamScreen: name required; on success → InviteMembersScreen (NOT empty dashboard)
- InviteMembersScreen: link generated; native share sheet opens; Skip → Home without error

**QA checklist:**
- [ ] LoginScreen: wrong password — inline error (not alert dialog)
- [ ] LoginScreen: valid credentials — authStore populated; navigate to AppNavigator
- [ ] CreateTeamScreen: empty name, tap create — validation error; no submit
- [ ] CreateTeamScreen: fill name — team created; navigate to InviteMembersScreen
- [ ] InviteMembersScreen: Share — native share sheet opens with link
- [ ] InviteMembersScreen: Skip — navigates to Home without error

**Commit:** `feat(screens): add LoginScreen, AccountCreationScreen, CreateTeamScreen, InviteMembersScreen`
**Checkpoint:** Yes

---

## M1-T04 — Player Invitation and Emergency Info Screens

**Title:** Build AcceptInviteScreen, player onboarding context, EmergencyInfoPromptScreen
**Complexity:** Medium | **Risk:** Medium

**Dependencies:** M0-T17, M1-T02

**Done criteria:**
- AcceptInviteScreen: valid token shows team name; expired → expiry message; invalid → invalid message
- EmergencyInfoPromptScreen: 4 fields; Complete → onboardingState active; Skip → Home
- After full onboarding: player lands on Home with real content (not empty state)
- 24hr reminder notification scheduled on skip

**QA checklist:**
- [ ] Open expired invitation link — expiry message shown; no crash
- [ ] Open valid invitation link — AcceptInviteScreen shows team name
- [ ] Complete emergency info — onboardingState = active in DB
- [ ] Skip emergency info — lands on Home; 24hr reminder scheduled in DB

**Commit:** `feat(screens): add player invitation acceptance and emergency info onboarding screens`
**Checkpoint:** Yes

---

## M1-T05 — Team Roster Screen

**Title:** Build TeamRosterScreen with coordinator and player role views
**Complexity:** Low | **Risk:** Low

**Dependencies:** M0-T17, M0-T18, M1-T01

**Done criteria:**
- Coordinator view: pending members at top with indicator; stale emergency info flagged
- Player view: names and roles only; no onboarding states; no flags
- FlatList (not ScrollView.map) for performance
- 30 members renders without jank
- Empty team: empty state message (not crash)

**QA checklist:**
- [ ] Coordinator — pending members at top with indicator; active below
- [ ] Player — no onboarding states, no flags, names and roles only
- [ ] 30 mock members — smooth scroll
- [ ] Empty team — empty state message visible

**Commit:** `feat(screens): add TeamRosterScreen with coordinator and player role views`
**Checkpoint:** Yes

---

## ⛔ STOP POINT — M1 Complete

- [ ] Full onboarding loop on two physical devices (coordinator + player)
- [ ] Both users see each other in roster with correct roles
- [ ] Push tokens registered on both devices (verify in DB)
- [ ] Emergency info skip and complete both work correctly

Tag: `v0.1.0-onboarding-complete`

---

## M2-T01 — Event and Trip Workspace Backend Endpoints

**Title:** Build all trip backend endpoints with atomic version management
**Complexity:** High | **Risk:** High (itineraryVersion increment must be atomic)

**Dependencies:** M0-T04, M0-T06, M0-T02, M1-T01

**Done criteria:**
- POST /events: creates Event; coordinator only
- PATCH /trip/itinerary: non-critical field change does NOT increment version; critical field change on published trip increments version ATOMICALLY and dispatches ITINERARY_CRITICAL_FIELD_CHANGED to previously-acknowledging members
- POST /trip/publish: rejected if departureTime or departureMeetingPoint is null; dispatches TRIP_PUBLISHED to Active traveling squad members; pending members excluded
- Integration test: itineraryVersion race condition — acknowledgment with wrong expectedVersion returns 409

**QA checklist:**
- [ ] PATCH /trip/itinerary: change departure time (not published) — version stays at 1
- [ ] PATCH /trip/itinerary: change departure time (published) — version increments from 1 to 2 atomically
- [ ] POST /trip/publish with null departureTime — 400 with clear error
- [ ] POST /trip/publish — push notification arrives on player device within 30 seconds
- [ ] Pending member in squad — NOT notified on publish (verify)

**Commit:** `feat(api): add event and trip workspace endpoints with atomic version management`
**Checkpoint:** Yes

---

## M2-T02 — Tier 3 Overlay and Input Components

**Title:** Build overlay and input components for trip creation flow
**Complexity:** Medium | **Risk:** Medium

**Dependencies:** M0-T17

**Done criteria:**
- BottomSheet: iOS swipe-to-dismiss + background-tap-to-dismiss; Android Material conventions; Reduced Motion: opacity only
- ConfirmationSheet: consequence-statement title; one-sentence body; verb confirm button
- TextInput: label above (not inside); InlineError on blur; optional fields labeled
- DateTimePicker: platform native; defaults to tomorrow 09:00
- SectionHeader and SectionDivider (32px gap)

**QA checklist:**
- [ ] BottomSheet on iOS: swipe down — dismisses; tap background — dismisses
- [ ] BottomSheet on Android: swipe down — dismisses; tap scrim — dismisses
- [ ] BottomSheet with Reduce Motion: no slide; opacity only
- [ ] TextInput: blur required field without entering — InlineError appears
- [ ] DateTimePicker: tap — native picker opens; select date — label updates

**Commit:** `feat(components): add Tier 3 overlay and input components (BottomSheet, ConfirmationSheet, TextInput, DateTimePicker, SectionHeader, SectionDivider)`
**Checkpoint:** Yes

---

## M2-T03 — Trip Creation Multi-Step Flow Screens

**Title:** Build CreateEvent, EditItinerary, SquadSelection, TripReview screens
**Complexity:** High | **Risk:** Medium

**Dependencies:** M2-T01, M2-T02, M0-T17, M0-T18

**Done criteria:**
- CreateEventScreen: Trip type → EditItineraryScreen
- EditItineraryScreen: Continue disabled until both Critical Fields filled; auto-saves draft; draft restores on return
- SquadSelectionScreen: pending members show indicator; 30 members smooth FlatList
- TripReviewScreen: shows squad count and notification count (excludes pending); Publish gated on Critical Fields; push arrives within 30s

**QA checklist:**
- [ ] EditItineraryScreen: empty departure time — Continue is DISABLED (not just error shown)
- [ ] EditItineraryScreen: exit mid-form; return — prompted to resume draft
- [ ] SquadSelectionScreen: 30 members — smooth scroll; pending member shows indicator
- [ ] TripReviewScreen: pending members excluded from notification count
- [ ] Publish — push notification arrives on player device within 30 seconds (physical device)

**Commit:** `feat(screens): add trip creation multi-step flow (CreateEvent, EditItinerary, SquadSelection, TripReview)`
**Checkpoint:** Yes

---

## M2-T04 — Events List Screen and EventCard

**Title:** Build EventsListScreen and EventCard component
**Complexity:** Low | **Risk:** Low

**Dependencies:** M2-T01, M0-T17

**Done criteria:**
- FlatList (not ScrollView.map) for performance
- Create Event button: visible to coordinator only
- Past events: collapsed by default; expand on tap
- Cancelled events show Cancelled badge; Postponed show Postponed badge

**QA checklist:**
- [ ] Coordinator — Create Event button visible
- [ ] Player — Create Event button NOT visible
- [ ] Past events: collapsed by default; tap to expand
- [ ] Cancelled event — Cancelled badge visible

**Commit:** `feat(screens): add EventsListScreen with EventCard and role-aware Create button`
**Checkpoint:** Yes

---

## ⛔ STOP POINT — M2 Complete

- [ ] Coordinator creates trip end-to-end on physical device
- [ ] Push notification arrives on player device within 30 seconds of publish
- [ ] Player taps notification from killed state → TripDetailScreen (NOT HomeScreen)
- [ ] Draft save and restore works

---

## M3-T01 — Acknowledgment Backend Endpoint

**Title:** Build acknowledgment endpoint with version validation and race condition handling
**Complexity:** Medium | **Risk:** High

**Dependencies:** M2-T01

**Done criteria:**
- POST /acknowledge with correct expectedVersion: acknowledgedItineraryVersion updated; 200 returned
- POST /acknowledge with stale expectedVersion: 409 returned with currentVersion
- Non-traveling member cannot acknowledge: 400 or 403
- GET /trip/squad: acknowledgedItineraryVersion visible per assignment

**QA checklist:**
- [ ] Acknowledge with correct version — acknowledgedItineraryVersion updated in DB; 200 returned
- [ ] Coordinator updates critical field (1→2); player acknowledges with expectedVersion=1 — 409 returned
- [ ] GET /trip/squad as coordinator — acknowledgedItineraryVersion visible per member

**Commit:** `feat(api): add itinerary acknowledgment endpoint with version validation`
**Checkpoint:** Yes

---

## M3-T02 — AcknowledgmentButton and useTripAcknowledgment Hook

**Title:** Build the most important player interaction component
**Complexity:** High | **Risk:** High

**Dependencies:** M3-T01, M0-T17, M0-T18

**Done criteria:**
- useTripAcknowledgment: computes needsAcknowledgment, isAcknowledged, needsReacknowledgment
- Unacknowledged: primary button "I've got it"; sticky at bottom of itinerary section
- Tap: optimistic UI → confirmed state in ≤150ms; mutation fires with expectedVersion
- Confirmed: checkmark + "Confirmed"; persists (does not disappear)
- Re-acknowledgment: amber prompt above button; button resets to primary
- Network failure: state reverts; error Toast appears
- 409 response: re-acknowledgment state triggered
- Offline: "Available when connected" label; no mutation; no error
- Haptic: medium impact on iOS on successful acknowledgment

**QA checklist:**
- [ ] Tap — confirmed state appears in <150ms (optimistic)
- [ ] Simulate network failure — state reverts; error toast appears
- [ ] Coordinator updates critical field while player has it acknowledged — re-ack prompt appears
- [ ] Re-acknowledgment tap — acknowledges new version; prompt clears
- [ ] Offline — "Available when connected" label; no mutation fires
- [ ] iOS physical device — haptic fires on successful acknowledgment

**Commit:** `feat(components): add AcknowledgmentButton and useTripAcknowledgment hook with optimistic updates`
**Checkpoint:** Yes

---

## M3-T03 — TripDetailScreen (Itinerary and Squad Sections)

**Title:** Build the TripDetailScreen as a single scrollable workspace
**Complexity:** High | **Risk:** Medium

**Dependencies:** M3-T02, M2-T01, M0-T17, M0-T18

**Done criteria:**
- Single ScrollView; section anchors work (tap SectionHeader → scroll to section)
- Coordinator: edit controls; acknowledgment count summary; no AcknowledgmentButton
- Player: departure time at Title scale (largest text element); AcknowledgmentButton visible
- Squad list: coordinator sees acknowledgment state; player sees names/roles only
- Offline: all fields readable from MMKV cache; AcknowledgmentButton → "Available when connected"
- Re-acknowledgment: coordinator updates time → player sees prompt above the fold

**QA checklist:**
- [ ] Player view — departure time is the largest text element on screen
- [ ] Player taps AcknowledgmentButton — confirmed state; coordinator count updates within 60s
- [ ] Coordinator — acknowledgment count visible; Edit controls present; no AcknowledgmentButton
- [ ] Offline (airplane mode) — all itinerary fields readable; no crash; "Available when connected" on button
- [ ] Coordinator updates departure time — player sees re-acknowledgment prompt above the fold
- [ ] Tap SquadList SectionHeader — scrolls to squad section

**Commit:** `feat(screens): add TripDetailScreen with itinerary and squad sections, role-based rendering, offline support`
**Checkpoint:** Yes

---

## M3-T04 — TripCard Components

**Title:** Build coordinator and player TripCard components
**Complexity:** Low | **Risk:** Low

**Dependencies:** M0-T17, M0-T09

**Done criteria:**
- PlayerTripCard: departure time is the visually dominant text element (Title scale)
- CoordinatorTripCard: acknowledgment count as X of Y
- Both: Cancelled and Postponed states handled; tap navigates to TripDetailScreen

**QA checklist:**
- [ ] PlayerTripCard: departure time is largest text element (visually verify)
- [ ] Both variants: cancelled trip shows Cancelled badge; no acknowledgment CTA
- [ ] Tap either card — navigates to TripDetailScreen

**Commit:** `feat(components): add PlayerTripCard and CoordinatorTripCard components`
**Checkpoint:** Yes

---

## M3-T05 — Home Screens (Coordinator and Player)

**Title:** Build role-aware HomeScreen with CoordinatorHome and PlayerHome
**Complexity:** Medium | **Risk:** Low

**Dependencies:** M3-T04, M2-T04, M0-T18

**Done criteria:**
- HomeScreen: thin router; routes to correct role-specific view
- CoordinatorHome: trip card when trip within 48hrs; cadence prompt when no upcoming events
- PlayerHome: trip card when in traveling squad; useful in non-travel weeks

**QA checklist:**
- [ ] Coordinator with active trip — CoordinatorTripCard prominent
- [ ] Coordinator with no upcoming events — cadence prompt with CTA shown
- [ ] Player in traveling squad — PlayerTripCard with departure time visible
- [ ] Coach — CoachHome placeholder (no crash)
- [ ] Both homes offline — render from cache; OfflineBanner visible

**Commit:** `feat(screens): add HomeScreen role router with CoordinatorHome and PlayerHome`
**Checkpoint:** Yes

---

## ⛔ STOP POINT — First Slice Functional

Run the full acknowledgment loop manually:
- [ ] Coordinator creates trip → publishes → push arrives on player device <30s
- [ ] Player taps notification from killed state → TripDetailScreen (not Home)
- [ ] Player taps AcknowledgmentButton → confirmed state <150ms
- [ ] Coordinator sees count update within 60 seconds
- [ ] Coordinator updates departure time → player receives re-acknowledgment push
- [ ] Player re-acknowledges successfully
- [ ] Airplane mode: player opens trip → all readable → "Available when connected" on button

Do not proceed to M4 until all items pass.

---

## M4-T01 — Trip Cancellation Backend Endpoint

**Complexity:** Low | **Risk:** Low

**Dependencies:** M2-T01, M0-T06

**Done criteria:**
- POST /cancel: coordinator only; sets status=cancelled; cancelledAt set
- Notifications dispatched to ALL assigned members within 30s (all travelingStatus values)
- Pending members with push token notified; without token — graceful skip
- Second cancel → 409

**QA checklist:**
- [ ] POST /cancel as coordinator — Event.status = 'cancelled' in DB
- [ ] Push notification arrives on player device within 30s
- [ ] Second POST /cancel on same event — 409 returned
- [ ] POST /cancel as coach — 403 returned

**Commit:** `feat(api): add trip cancellation endpoint with irreversible status change and notification dispatch`
**Checkpoint:** Yes

---

## M4-T02 — Cancellation Flow in TripDetailScreen

**Complexity:** Medium | **Risk:** Low

**Dependencies:** M4-T01, M3-T03, M2-T02

**Done criteria:**
- Cancel option visible to coordinator only
- Single tap does NOT cancel — ConfirmationSheet opens
- "Go back" → sheet closes; trip not cancelled
- Confirm → navigate to EventsListScreen; cancelled event in Past section with badge
- Players receive notification within 30s
- Player opens cancelled trip via old deep link → Cancelled state (no crash)

**QA checklist:**
- [ ] Cancel option NOT visible to player or coach
- [ ] Tap Cancel → ConfirmationSheet opens; tap "Go back" → closes; trip not cancelled
- [ ] Tap Cancel → Confirm → navigate to EventsListScreen; cancelled event in Past with badge
- [ ] Players receive push within 30s
- [ ] Player opens cancelled trip via deep link — Cancelled state; no crash

**Commit:** `feat(screens): add trip cancellation two-step flow in TripDetailScreen`
**Checkpoint:** Yes

---

## M4-T03 — Offline Cache Verification

**Complexity:** Medium | **Risk:** Medium

**Dependencies:** M0-T13, M3-T03

**Done criteria:**
- TripDetailScreen: all fields readable offline from MMKV cache
- All write actions: "Available when connected" label (not hidden, not error)
- App restart while offline: TripDetailScreen loads from cache; no network request
- Reconnect: OfflineBanner dismisses; "Back online" toast; data refreshes

**QA checklist:**
- [ ] Open TripDetailScreen; airplane mode; scroll — all data readable
- [ ] AcknowledgmentButton offline — "Available when connected" (not hidden)
- [ ] Cancel Trip option offline — disabled with label
- [ ] Kill app; airplane mode; restart; open TripDetailScreen — loads from cache
- [ ] Reconnect — OfflineBanner dismisses; "Back online" toast; data refreshes

**Commit:** `fix(cache): verify and harden offline cache for all first-slice screens`
**Checkpoint:** Yes

---

## M4-T04 — Deep Link Routing Verification

**Complexity:** Medium | **Risk:** High

**Dependencies:** M0-T15, M0-T16

**Done criteria:**
- TRIP_PUBLISHED tap from killed iOS → TripDetailScreen (not HomeScreen)
- TRIP_PUBLISHED tap from killed Android → same
- ITINERARY_CHANGED tap from killed → TripDetailScreen with re-ack prompt above fold
- TRIP_CANCELLED tap → EventsListScreen with cancelled event in Past section
- Nonexistent trip deep link → Toast + navigate to EventsListScreen; no crash

**QA checklist:**
- [ ] Kill iOS; send TRIP_PUBLISHED; tap — TripDetailScreen opens
- [ ] Kill Android; send TRIP_PUBLISHED; tap — TripDetailScreen opens
- [ ] Kill; send ITINERARY_CHANGED; tap — TripDetailScreen with re-ack prompt above fold
- [ ] Kill; send TRIP_CANCELLED; tap — EventsListScreen; cancelled event visible
- [ ] relay://trips/nonexistent-id — Toast + EventsListScreen; no crash

**Commit:** `fix(navigation): verify first-slice deep links and add graceful handling for missing entities`
**Checkpoint:** Yes

---

## M4-T05 — Real-Team End-to-End Test Session

**Complexity:** N/A | **Risk:** High (product hypothesis validation)

**Dependencies:** M4-T01 through M4-T04

**Done criteria:**
- Full flow completed on physical devices: create team → invite → join → create trip → publish → acknowledge → update time → re-acknowledge → cancel
- Zero P0 crashes; zero P1 broken workflows
- Coordinator: "I did not need WhatsApp for any of these steps"
- Player: "The trip card was immediately understandable"

**QA checklist:**
- [ ] Coordinator trip creation time: under 5 minutes on first attempt
- [ ] Push notification arrival: under 30 seconds for all notification types
- [ ] Player acknowledgment: 3 taps or fewer from notification tap to confirmed state
- [ ] Coordinator count updates without manual refresh within 60 seconds
- [ ] Re-acknowledgment: complete cycle works without confusion
- [ ] Cancellation: both players notified within 30 seconds
- [ ] No P0 crashes

**Commit:** `fix: address P0 and P1 issues from real-team first-slice test`
**Checkpoint:** Yes — Tag: `v0.2.0-first-slice-validated`

---

*Tasks M5 through M9 follow the same pattern. See milestone-task-plan.md for M5-M9 task listings. Each task in M5-M9 should be prompted using the ongoing-task-runner-prompt template with the relevant doc files and acceptance criteria from the approved PRD and QA specifications.*

---

## Stop Points Summary

| Stop Point | After | Gate Condition |
|---|---|---|
| Backend Security Foundation | M0-T05 | Serializers strip fields; push delivers to physical device |
| M0 Complete | M0-T18 | All infrastructure working; deep links from killed state verified |
| M1 Complete | M1-T05 | Full onboarding on two physical devices |
| M2 Complete | M2-T04 | Trip publish push arrives within 30s |
| First Slice Functional | M3-T05 | Full acknowledgment loop works |
| First Slice Validated | M4-T05 | Real-team test passed; P0/P1 resolved |
| M5 Security Gate | Before M5-T01 ships | Medically Restricted integration test passing |
| Feature Freeze | M8-T04 | All MVP features implemented |
