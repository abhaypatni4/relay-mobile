# Relay — Backend Assumptions and API Needs

## Architecture Assumptions

- REST API (JSON) for MVP
- Stateless API; JWT authentication (access token 15min; refresh token 30 days)
- PostgreSQL 15 for primary data storage (Prisma ORM)
- Push notifications via APNs (iOS) and FCM (Android) via OneSignal or Firebase Admin SDK
- Background jobs via BullMQ + Redis
- File storage: NOT required in MVP (no document upload)
- Real-time: polling acceptable for MVP delivery state updates (WebSocket post-MVP)
- Deployment: cloud-hosted PaaS (Railway, Render, or similar)
- Uptime target: 99.5% MVP

## Authentication

- Phone number or email + password
- JWT access token (15min) + refresh token (30 days; stored in expo-secure-store on mobile)
- Account creation from invitation link: token pre-validates team membership

---

## API Endpoint Groups

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

### Teams
```
POST   /teams                              create team (coordinator)
GET    /teams/:teamId                      get team details (any member)
PATCH  /teams/:teamId                      update team (coordinator only)
GET    /teams/:teamId/members              list members with states (role-filtered response)
DELETE /teams/:teamId/members/:memberId    remove member (coordinator only)
```

### Invitations
```
POST   /teams/:teamId/invitations          generate/regenerate link (coordinator)
GET    /invitations/:token                 validate token (unauthenticated)
POST   /invitations/:token/accept          join team (authenticated)
```

### Coordinator Transfer
```
POST   /teams/:teamId/transfers            initiate transfer (coordinator)
PATCH  /teams/:teamId/transfers/:id        accept or decline (incoming member)
```

### Events
```
POST   /teams/:teamId/events               create event (coordinator)
GET    /teams/:teamId/events               list events (all members; filter by status)
GET    /teams/:teamId/events/:eventId      get event detail (all members; role-filtered)
PATCH  /teams/:teamId/events/:eventId      update event (coordinator)
POST   /teams/:teamId/events/:eventId/cancel
POST   /teams/:teamId/events/:eventId/postpone
```

### Trip Workspace
```
GET    /events/:eventId/trip               get trip workspace (all roles; role-filtered)
PATCH  /events/:eventId/trip/itinerary     update itinerary (coordinator)
                                           ← CRITICAL: if Critical Field changes AND trip isPublished,
                                              increment itineraryVersion atomically in DB transaction;
                                              dispatch ITINERARY_CRITICAL_FIELD_CHANGED to
                                              members whose acknowledgedItineraryVersion = previous version
POST   /events/:eventId/trip/publish       publish trip (coordinator)
                                           ← Validate departureTime and departureMeetingPoint not null;
                                              dispatch TRIP_PUBLISHED to Active traveling squad members
GET    /events/:eventId/trip/squad         get squad assignments with member data (role-filtered)
PATCH  /events/:eventId/trip/squad         update traveling status (coordinator)
GET    /events/:eventId/trip/documents     get checklist + confirmation status (role-filtered)
POST   /events/:eventId/trip/documents     add checklist item (coordinator)
DELETE /events/:eventId/trip/documents/:itemId (coordinator)
POST   /events/:eventId/trip/documents/:itemId/confirm (player/staff/coach/coordinator — own)
POST   /events/:eventId/trip/documents/remind (coordinator — dispatches DOCUMENT_REMINDER)
GET    /events/:eventId/trip/predeparture  coordinator checklist (coordinator only)
PATCH  /events/:eventId/trip/predeparture  update custom items (coordinator only)
```

### Emergency Info
```
GET    /users/:userId/emergency-info       get own emergency info
PATCH  /users/:userId/emergency-info       update own emergency info
GET    /events/:eventId/trip/squad/:memberId/emergency
       ← Coordinator/Coach/Staff only; creates EmergencyInfoAccessLog entry; returns isStale flag
```

### Itinerary Acknowledgment
```
POST   /events/:eventId/trip/itinerary/acknowledge
       ← Player only; request body must include expectedVersion;
          if expectedVersion !== current itineraryVersion → return 409 with current version;
          if matches → set acknowledgedItineraryVersion = itineraryVersion
```

### Availability
```
POST   /events/:eventId/availability/open       (coordinator or coach)
GET    /events/:eventId/availability            (role-filtered; player sees own only)
POST   /events/:eventId/availability/submit     (player only; rejects if locked)
PATCH  /events/:eventId/availability/:submissionId/operational (coach or coordinator)
                                                ← Medically Restricted: coordinator or staff only
POST   /events/:eventId/availability/lock       (coordinator or coach)
POST   /events/:eventId/availability/notify     (coordinator or coach)
                                                ← Individual SELECTION_SELECTED or SELECTION_NOT_SELECTED per player
```

### Posts (Feed)
```
POST   /teams/:teamId/posts                create post (coordinator or coach; isDraft support)
GET    /teams/:teamId/posts                list posts (role-filtered by recipientGroup)
GET    /teams/:teamId/posts/:postId        get post detail + delivery state (coordinator/coach get summary)
DELETE /teams/:teamId/posts/:postId        delete (grace period ≤5min: any creator; after: coordinator)
POST   /teams/:teamId/posts/:postId/acknowledge
POST   /teams/:teamId/posts/:postId/nudge  (coordinator/coach; rate limited: 1 per member per post per 24hrs)
```

### Users / Profile
```
GET    /users/me                           current user + team memberships
PATCH  /users/me                           update profile (name, role, jerseyNumber)
PATCH  /users/me/emergency-info            update emergency info
DELETE /users/me                           account deletion (PII removed within 30 days)
PATCH  /users/me/push-token                register/update push token
GET    /users/me/notification-preferences
PATCH  /users/me/notification-preferences
```

---

## Authorization Rules (Server-Side — Non-Negotiable)

- All endpoints validate: authenticated + active team member + role permitted
- GET /events/:eventId/trip/squad/:memberId/emergency → ONLY coordinator, coach, staff; NEVER player
- AvailabilitySubmission.operationalStatus → NEVER returned in any Player-role response
- POST /availability/notify → ONLY coordinator or coach
- PATCH /events/:eventId/trip/itinerary → ONLY coordinator
- POST /teams/:teamId/transfers → ONLY coordinator
- DELETE /teams/:teamId/members/:memberId → ONLY coordinator

---

## Background Jobs (BullMQ + Redis)

### Overdue Detection
- Runs every 30 minutes
- Finds Posts where: requiresAcknowledgment=true AND createdAt + overdueThresholdHours < now AND deliveryState !== acknowledged
- Marks those PostDeliveryStates as eligible for overdue display in delivery state panel
- Does NOT auto-send nudge; coordinator must trigger manually

### Transfer Expiry
- Runs hourly
- Finds CoordinatorTransfers where: status=pending AND expiresAt < now
- Updates status to expired
- Notifies outgoing coordinator

### Emergency Info Reminder
- Triggered 24hrs after player skips emergency info in onboarding
- Sends EMERGENCY_INFO_REMINDER push to that specific player
- Fires once; not repeated until coordinator manually triggers

---

## Critical Backend Logic

### Itinerary Version Management (HIGHEST RISK — must be atomic)

When PATCH /trip/itinerary changes Departure Time or Departure Meeting Point AND trip isPublished:
1. Begin database transaction
2. Increment TripWorkspace.itineraryVersion
3. Commit transaction
4. Dispatch ITINERARY_CRITICAL_FIELD_CHANGED to all members whose acknowledgedItineraryVersion equals the previous version

**Acknowledgment version validation:**
- POST /acknowledge: request body must include expectedVersion
- If expectedVersion !== current itineraryVersion → return 409 with body containing currentVersion
- If matches → set acknowledgedItineraryVersion = itineraryVersion atomically

This prevents stale acknowledgments from being accepted as valid.

### Medically Restricted Exclusion (SECURITY REQUIREMENT)

The serializer layer must strip operationalStatus from all AvailabilitySubmission responses where req.member.role === 'player'. This is tested with an explicit integration test before the availability feature ships.

### Post Deletion Grace Period
- Within 5 minutes of creation: creator can delete without confirmation; no recipient notification
- After 5 minutes: coordinator only; recipients receive in-app notification that a post was removed

---

## Real-Time Considerations (MVP)

MVP uses polling for delivery state updates:
- PostDeliveryState: client polls every 60s when coordinator has Post Detail screen focused
- AvailabilitySubmission: client polls every 30s when coach has Availability Roster screen focused
- React Query refetchInterval handles this without custom code

Post-MVP: replace polling with WebSocket or Server-Sent Events for coordinator delivery state panel.

---

## Data Privacy and Security

- Emergency info encrypted at rest (field-level or database-level)
- Emergency info access logged via EmergencyInfoAccessLog on every successful request
- No cross-team data leakage: all queries scoped to teamId
- Account deletion: soft delete TeamMember; anonymize User PII within 30 days; retain anonymized IDs in audit logs
- Push tokens: stored securely; deleted on account deletion
- HTTPS only; TLS 1.2+ required
- Rate limiting on all auth endpoints
