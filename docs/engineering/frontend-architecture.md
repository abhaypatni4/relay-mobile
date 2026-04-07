# Relay — Frontend Architecture

## Platform

- Primary: React Native with Expo (bare workflow) — iOS and Android from a single codebase
- MVP: Mobile only; web not in MVP
- Post-MVP: Web support for coordinator workflows may be added; architecture must not block this

## Recommended Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React Native 0.74+ with Expo SDK 51+ (bare workflow) | Expo managed handles push and OTA; bare workflow gives native module access |
| Navigation | React Navigation v7 | Most mature; supports deep linking natively; Tab + Stack composable |
| Server state | TanStack React Query v5 | Caching, polling, optimistic updates, offline persistence built-in |
| Local/UI state | Zustand | Lightweight; no boilerplate; role context, auth state, offline flag |
| Offline cache | React Query + MMKV persister | MMKV significantly faster than AsyncStorage for cache reads |
| Forms | React Hook Form + Zod | Validation at schema level; minimal re-renders |
| Push notifications | Expo Notifications | Handles APNs + FCM token registration; foreground/background/killed states |
| Deep linking | React Navigation + Expo Linking | Linking config maps URL scheme to routes |
| Connectivity | @react-native-community/netinfo | isConnected state; drives offline banner and write action disabling |
| Haptics | expo-haptics | iOS only; graceful no-op on Android |
| Secure storage | expo-secure-store | JWT refresh token storage |
| Icons | react-native-svg + custom icon set | Outlined icon style; consistent across platforms |
| Testing | Jest + React Native Testing Library + Detox | Unit + integration + E2E |

---

## Navigation Structure

```
RootNavigator (Stack)
├── AuthNavigator (Stack) — unauthenticated users
│   ├── SplashScreen
│   ├── LoginScreen
│   ├── AccountCreationScreen
│   └── InvitationOnboardingFlow (Stack)
│       ├── AcceptInviteScreen
│       ├── CreateAccountScreen (invitation context)
│       └── EmergencyInfoPromptScreen
│
└── AppNavigator — authenticated users
    ├── CoordinatorOnboardingFlow (Stack; shown once if no team)
    │   ├── CreateTeamScreen
    │   ├── CreateFirstEventScreen
    │   └── InviteMembersScreen
    │
    └── MainTabNavigator (Bottom Tabs)
        ├── HomeTab (Stack)
        │   └── HomeScreen (role-aware: coordinator | coach | player | staff)
        │
        ├── EventsTab (Stack)
        │   ├── EventsListScreen
        │   ├── EventDetailScreen (Match | Training)
        │   ├── TripDetailScreen (Trip)
        │   ├── CreateEventScreen (modal)
        │   ├── EditItineraryScreen (modal)
        │   ├── SquadSelectionScreen (modal)
        │   ├── DocumentChecklistBuilderScreen (modal)
        │   ├── TripReviewScreen (modal)
        │   └── AvailabilitySubmissionScreen (modal; full screen)
        │
        ├── FeedTab (Stack)
        │   ├── FeedScreen
        │   ├── PostDetailScreen
        │   └── PostCreationScreen (modal)
        │
        └── TeamTab (Stack)
            ├── TeamRosterScreen
            ├── MemberDetailScreen
            ├── EditProfileScreen (modal)
            ├── TeamSettingsScreen
            ├── CoordinatorHandoffScreen (modal)
            ├── AcceptTransferScreen (modal)
            └── NotificationPreferencesScreen
```

---

## Deep Link URL Scheme

URL scheme: `relay://`

All deep links handled by React Navigation's linking config.

| Notification trigger | Deep link |
|---|---|
| Trip published | relay://trips/:tripId |
| Critical field changed | relay://trips/:tripId?section=itinerary |
| Trip cancelled | relay://events/:eventId |
| Trip postponed | relay://trips/:tripId |
| Availability window opened | relay://events/:eventId/availability |
| Selection notification | relay://events/:eventId |
| Post (acknowledgment required) | relay://posts/:postId |
| Post (general) | relay://posts/:postId |
| Nudge | relay://posts/:postId |
| Document reminder | relay://trips/:tripId?section=documents |
| Coordinator transfer | relay://transfers/:transferId |
| Emergency info reminder | relay://profile/emergency |

**Critical:** Deep links must navigate to correct screen even when app is killed (cold start). Test all from killed state on physical devices. If target entity no longer exists, navigate to parent screen with a toast — never crash.

---

## Folder Structure

```
/relay-mobile
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── AppNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── linking.config.ts     ← All deep link URL → route mappings
│   │   └── types.ts              ← Typed navigation params
│   │
│   ├── screens/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── events/
│   │   ├── feed/
│   │   └── team/
│   │
│   ├── components/
│   │   ├── foundation/           ← Text, Icon, Divider
│   │   ├── layout/               ← ScreenContainer, CardContainer, SectionHeader, SectionDivider
│   │   ├── feedback/             ← Toast, OfflineBanner, SkeletonLoader, InlineError, LoadingButton
│   │   ├── overlay/              ← BottomSheet, ConfirmationSheet, OperationalStatePicker
│   │   ├── input/                ← TextInput, TextAreaInput, AvailabilityPicker, DateTimePicker, RecipientSelector
│   │   ├── data-display/         ← StatusDot, DeliveryStateDot, TripCard, EventCard, ListRow, SquadRosterRow, PostCard, EmergencyInfoCard, ChecklistItem
│   │   └── role-specific/        ← CoordinatorHomeCard, PlayerTripCard, PreDepartureChecklistItem, AcknowledgmentButton, SelectionNotificationConfirmation
│   │
│   ├── hooks/
│   │   ├── useCurrentMember.ts   ← Current user + role + teamId from stores
│   │   ├── useOfflineStatus.ts   ← isOnline, lastSyncedAt
│   │   ├── useDeepLink.ts        ← Handle incoming deep link URLs
│   │   ├── useNotificationPermission.ts
│   │   └── useTripAcknowledgment.ts  ← Acknowledgment version comparison logic
│   │
│   ├── queries/                  ← React Query hooks (one file per domain)
│   │   ├── useTeam.ts
│   │   ├── useMembers.ts
│   │   ├── useEvents.ts
│   │   ├── useTrip.ts
│   │   ├── useSquad.ts
│   │   ├── useAvailability.ts
│   │   ├── usePosts.ts
│   │   └── useEmergencyInfo.ts
│   │
│   ├── mutations/                ← React Query mutations
│   │   ├── useCreateTrip.ts
│   │   ├── usePublishTrip.ts
│   │   ├── useAcknowledgeItinerary.ts
│   │   ├── useSubmitAvailability.ts
│   │   ├── useSetOperationalStatus.ts
│   │   ├── useSendSelectionNotifications.ts
│   │   ├── usePublishPost.ts
│   │   ├── useAcknowledgePost.ts
│   │   ├── useSendNudge.ts
│   │   └── useCoordinatorTransfer.ts
│   │
│   ├── store/                    ← Zustand stores
│   │   ├── authStore.ts          ← userId, accessToken (memory only), isAuthenticated
│   │   ├── teamStore.ts          ← activeTeamId, activeTeamMemberId, role
│   │   └── uiStore.ts            ← isOffline, toastQueue, pendingTransferRequest
│   │
│   ├── services/
│   │   ├── api.ts                ← Axios instance + interceptors
│   │   ├── notifications.ts      ← Expo push token + listener setup
│   │   ├── offlineCache.ts       ← MMKV persister config
│   │   └── analytics.ts          ← Thin wrapper around analytics vendor
│   │
│   ├── tokens/
│   │   ├── colors.ts             ← All primitive and semantic color tokens
│   │   ├── typography.ts         ← Font family, size scale, weight scale
│   │   ├── spacing.ts            ← Base-8 spacing values
│   │   ├── radius.ts             ← Corner radius values
│   │   ├── duration.ts           ← Animation duration values
│   │   └── index.ts              ← Barrel export
│   │
│   ├── utils/
│   │   ├── dates.ts              ← Format helpers (12hr time, relative dates)
│   │   ├── roles.ts              ← Permission check helpers (UI only)
│   │   └── notificationCopy.ts   ← Notification copy generators
│   │
│   └── types/
│       ├── models.ts             ← TypeScript interfaces matching domain models
│       ├── api.ts                ← API request/response types
│       └── navigation.ts         ← Route params
│
├── assets/
│   └── icons/                    ← SVG icon set (outlined style)
│
├── app.config.ts                 ← Expo config (bundle ID, deep link scheme relay://)
├── package.json
└── tsconfig.json
```

---

## State Management

### Server State — React Query
All remote data is fetched and cached via React Query. Queries in `queries/`. Mutations in `mutations/`.

**Key cache keys (must be consistent):**
```
['team', teamId]
['members', teamId]
['events', teamId]
['event', eventId]
['trip', tripWorkspaceId]
['squad', tripWorkspaceId]
['checklist', tripWorkspaceId]
['availability', eventId]
['posts', teamId]
['post', postId]
['member', memberId]
['emergencyInfo', userId]
['transfers', teamId]
```

**Cache invalidation:** After mutation success, invalidate affected query keys. Exception: use optimistic updates for acknowledgment, availability submission, document confirmation, operational status change — these update cache immediately and revert on error.

### Local/UI State — Zustand

**authStore:** userId, accessToken (in-memory only — never persisted), isAuthenticated
**teamStore:** activeTeamId, activeTeamMemberId, role
**uiStore:** isOffline (from NetInfo), toastQueue, pendingTransferRequest

### Offline State
- Derived from NetInfo in useOfflineStatus hook, stored in uiStore.isOffline
- Write mutations check isOffline before firing — show "Available when connected" if offline
- Read queries serve from React Query MMKV cache when offline

### Polling Configuration
- PostDetailScreen (coordinator view): refetchInterval 60s when focused
- AvailabilityRosterScreen: refetchInterval 30s when focused
- refetchIntervalInBackground: false (prevents background polling battery drain)

---

## Role-Based Rendering Pattern

Role is fetched once on app load, stored in teamStore. Components receive role via useCurrentMember hook.

```typescript
// Pattern — role-aware container
const HomeScreen = () => {
  const { role } = useCurrentMember()
  if (role === 'coordinator') return <CoordinatorHome />
  if (role === 'coach') return <CoachHome />
  if (role === 'staff') return <StaffHome />
  return <PlayerHome />
}

// Pattern — conditional within component
const TripDetailScreen = () => {
  const { role } = useCurrentMember()
  return (
    <ScreenContainer>
      <ItinerarySection />
      <SquadListSection />
      {role !== 'player' && <DocumentStatusSection />}
      {role === 'coordinator' && <PreDepartureChecklist />}
    </ScreenContainer>
  )
}
```

Role checks are UI-only. All data access is enforced server-side. Never use role to decide what data to fetch — only what to render.

---

## Optimistic Updates

Apply to: itinerary acknowledgment, post acknowledgment, availability submission, document confirmation, operational status change.

Pattern:
1. onMutate: cancel in-flight queries; snapshot previous data; update cache optimistically; return snapshot
2. onError: revert cache to snapshot; show error toast
3. onSettled: invalidate affected query for eventual consistency

---

## Push Notification Client

Set up in `services/notifications.ts`:
- Register for push tokens when permission already granted (not on first app open)
- Sync push token to server on every app foreground (tokens rotate)
- Set up foreground notification handler: show in-app Toast, not system banner
- Set up notification response handler (tap): extract deep link URL from notification data; navigate
- Permission request timing: at first genuinely useful moment (first trip assignment or selection notification)

---

## Offline Detection

Use @react-native-community/netinfo. Subscribe at root provider level. On connectivity change, call uiStore.setOffline(). Components read uiStore.isOffline — never call NetInfo directly in components.

---

## Backend Folder Structure

```
/relay-api
├── src/
│   ├── routes/           ← One file per domain (auth, teams, events, trips, etc.)
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── requireTeamMember.ts
│   │   ├── requireRole.ts
│   │   └── roleFilter.ts
│   ├── controllers/      ← Route handler logic
│   ├── services/         ← Business logic
│   │   ├── itinerary.service.ts   ← Version management, re-ack triggering
│   │   ├── notification.service.ts
│   │   ├── availability.service.ts
│   │   └── transfer.service.ts
│   ├── jobs/             ← BullMQ job definitions
│   │   ├── overdueDetection.job.ts
│   │   ├── transferExpiry.job.ts
│   │   └── emergencyInfoReminder.job.ts
│   ├── serializers/      ← Response shaping + role-based field stripping
│   │   ├── availability.serializer.ts
│   │   ├── member.serializer.ts
│   │   └── trip.serializer.ts
│   ├── db/
│   │   └── prisma/
│   └── utils/
│       ├── jwt.ts
│       ├── roles.ts
│       └── errors.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## Architecture Decisions

See `docs/engineering/architecture-decisions.md` for full rationale on:
- React Native over native iOS/Android
- React Query over Redux
- Optimistic UI for acknowledgment actions
- Polling over WebSockets for delivery state
- Offline read-only (no write queue) in MVP
- Single coordinator per team
- Role-based rendering at component level (not route level)
- Shared token architecture (design + engineering)
- SF Pro as iOS typeface
