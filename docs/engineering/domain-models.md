# Relay — Domain Models

## Entity Overview

```
User
 └─ TeamMember (role, onboarding state, per team)
      └─ Team
           ├─ Event (Match | Training | Trip)
           │    ├─ TripWorkspace (if Trip)
           │    │    ├─ Itinerary (fields on TripWorkspace)
           │    │    ├─ TripSquadAssignment (per member)
           │    │    ├─ DocumentChecklist
           │    │    │    └─ DocumentChecklistItem
           │    │    │         └─ DocumentConfirmation (per member)
           │    │    └─ PreDepartureChecklist
           │    ├─ AvailabilityWindow
           │    │    └─ AvailabilitySubmission (per player)
           │    └─ EventPost (linked post)
           ├─ Post
           │    └─ PostDeliveryState (per member)
           └─ InvitationLink
```

---

## TypeScript Interfaces (Mobile Client)

These interfaces are the contract between client and server. Field names must match the backend Prisma schema exactly.

```typescript
type Role = 'coordinator' | 'coach' | 'staff' | 'player'

type OnboardingState = 'invited' | 'profileIncomplete' | 'active'

type EventType = 'match' | 'training' | 'trip'

type EventStatus = 'draft' | 'active' | 'cancelled' | 'postponed' | 'complete'

type TravelingStatus = 'traveling' | 'notTraveling' | 'unassigned'

type AvailabilityStatus = 'available' | 'limited' | 'unavailable'

type OperationalStatus =
  | 'selected'
  | 'notSelected'
  | 'traveling'
  | 'medicallyRestricted'
  | 'unassigned'
// medicallyRestricted is stripped from all Player-role API responses

type PostType =
  | 'scheduleUpdate'
  | 'travelInfo'
  | 'generalAnnouncement'
  | 'urgentAlert'

type RecipientGroup =
  | 'fullTeam'
  | 'travelingSquad'
  | 'coachingStaff'
  | 'allStaff'

type DeliveryState = 'notSeen' | 'seen' | 'acknowledged'

type TransferStatus = 'pending' | 'accepted' | 'declined' | 'expired'

interface User {
  id: string
  name: string
  email: string | null
  phone: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyAllergyAlert: string | null
  emergencyStaffNote: string | null
  emergencyInfoUpdatedAt: string | null   // ISO8601; null if never set
  createdAt: string
}

interface Team {
  id: string
  name: string
  sport: string | null
  homeLocation: string | null
  createdAt: string
}

interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: Role
  onboardingState: OnboardingState
  jerseyNumber: string | null
  customRoleLabel: string | null
  invitedAt: string
  joinedAt: string | null
  // User fields joined for display
  name: string
  email: string | null
  phone: string | null
  // Emergency info: only returned for Coordinator, Coach, Staff requests
  emergencyInfo?: EmergencyInfo
}

interface EmergencyInfo {
  contactName: string | null
  contactPhone: string | null
  allergyAlert: string | null
  staffNote: string | null
  updatedAt: string | null
  isStale: boolean    // computed server-side: updatedAt < 180 days ago
}

interface Event {
  id: string
  teamId: string
  type: EventType
  name: string
  date: string         // ISO date (YYYY-MM-DD)
  startTime: string    // HH:MM
  location: string | null
  status: EventStatus
  cancelledAt: string | null
  postponedAt: string | null
  newDateAfterPostponement: string | null
  newTimeAfterPostponement: string | null
  createdBy: string    // TeamMember.id
  createdAt: string
  // Joined data
  tripWorkspace?: TripWorkspace   // only if type === 'trip'
  availabilityWindow?: AvailabilityWindow
}

interface TripWorkspace {
  id: string
  eventId: string
  // Critical Fields — changes trigger re-acknowledgment
  departureTime: string | null     // ISO8601 datetime
  departureMeetingPoint: string | null
  // Standard fields
  transportationNotes: string | null
  accommodationName: string | null
  accommodationAddress: string | null
  accommodationCheckInTime: string | null
  matchEventTime: string | null
  matchEventLocation: string | null
  returnDepartureTime: string | null
  returnDeparturePoint: string | null
  additionalNotes: string | null
  // Acknowledgment versioning — CRITICAL
  itineraryVersion: number  // increments atomically on critical field change
  isPublished: boolean
  publishedAt: string | null
}

interface TripSquadAssignment {
  id: string
  tripWorkspaceId: string
  teamMemberId: string
  travelingStatus: TravelingStatus
  acknowledgedItineraryVersion: number | null
  // Computed client-side: needsReacknowledgment = acknowledgedVersion < currentVersion
  memberName: string           // joined for display
  memberRole: Role
  onboardingState: OnboardingState
}

interface DocumentChecklistItem {
  id: string
  documentChecklistId: string
  name: string
  applicability: 'allPlayers' | 'travelingSquad' | 'specific'
  specificMemberIds: string[]
  // Player view: own confirmation only
  isConfirmedByCurrentUser: boolean
  confirmedAt: string | null
  // Coordinator view: aggregate
  confirmedCount?: number
  totalApplicable?: number
}

interface AvailabilityWindow {
  id: string
  eventId: string
  openedAt: string
  lockedAt: string | null
  isLocked: boolean
  selectionNotificationsSentAt: string | null
}

interface AvailabilitySubmission {
  id: string
  teamMemberId: string
  memberName: string
  availabilityStatus: AvailabilityStatus
  note: string | null
  // operationalStatus STRIPPED for Player-role responses
  operationalStatus?: OperationalStatus
  operationalStatusSetBy?: string | null
  submittedAt: string
  updatedAt: string
  selectionNotificationSentAt: string | null
}

interface Post {
  id: string
  teamId: string
  eventId: string | null
  type: PostType
  content: string
  recipientGroup: RecipientGroup
  isUrgent: boolean
  requiresAcknowledgment: boolean
  overdueThresholdHours: number
  createdBy: string
  createdByName: string
  createdAt: string
  deletedAt: string | null
  // Current user's delivery state
  currentUserDeliveryState: DeliveryState
  currentUserAcknowledgedAt: string | null
  // Coordinator/Coach view only
  deliverySummary?: DeliveryStateSummary
}

interface DeliveryStateSummary {
  sentCount: number
  seenCount: number
  acknowledgedCount: number
  overdueCount: number
  overdueMembers?: OverdueMember[]
}

interface OverdueMember {
  teamMemberId: string
  memberName: string
  lastNudgeSentAt: string | null
  canNudge: boolean    // false if nudged within 24hrs
}

interface CoordinatorTransfer {
  id: string
  teamId: string
  fromMemberId: string
  fromMemberName: string
  toMemberId: string
  toMemberName: string
  status: TransferStatus
  initiatedAt: string
  expiresAt: string
}
```

---

## Prisma Schema (Backend)

```prisma
// All models must be present in the initial migration.
// Do not build a partial schema and extend it later.

model User {
  id                      String    @id @default(cuid())
  name                    String
  email                   String?   @unique
  phone                   String?   @unique
  passwordHash            String?
  emergencyContactName    String?
  emergencyContactPhone   String?
  emergencyAllergyAlert   String?
  emergencyStaffNote      String?
  emergencyInfoUpdatedAt  DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  teamMemberships         TeamMember[]
  emergencyInfoAccessLogs EmergencyInfoAccessLog[] @relation("AccessedFor")
}

model Team {
  id            String       @id @default(cuid())
  name          String
  sport         String?
  homeLocation  String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  members       TeamMember[]
  events        Event[]
  invitationLinks InvitationLink[]
  transfers     CoordinatorTransfer[]
  posts         Post[]
}

model TeamMember {
  id               String          @id @default(cuid())
  userId           String
  teamId           String
  role             Role
  onboardingState  OnboardingState @default(invited)
  jerseyNumber     String?
  customRoleLabel  String?
  invitedAt        DateTime        @default(now())
  joinedAt         DateTime?
  removedAt        DateTime?
  user             User            @relation(fields: [userId], references: [id])
  team             Team            @relation(fields: [teamId], references: [id])
  tripAssignments  TripSquadAssignment[]
  availabilitySubmissions AvailabilitySubmission[]
  postDeliveryStates PostDeliveryState[]
  documentConfirmations DocumentConfirmation[]
  emergencyInfoAccessLogs EmergencyInfoAccessLog[] @relation("AccessedBy")

  @@unique([userId, teamId])
}

model InvitationLink {
  id            String   @id @default(cuid())
  teamId        String
  token         String   @unique
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  isRevoked     Boolean  @default(false)
  team          Team     @relation(fields: [teamId], references: [id])
}

model Event {
  id                          String      @id @default(cuid())
  teamId                      String
  type                        EventType
  name                        String
  date                        DateTime
  startTime                   String
  location                    String?
  status                      EventStatus @default(draft)
  cancelledAt                 DateTime?
  postponedAt                 DateTime?
  newDateAfterPostponement    DateTime?
  newTimeAfterPostponement    String?
  createdBy                   String
  createdAt                   DateTime    @default(now())
  updatedAt                   DateTime    @updatedAt
  team                        Team        @relation(fields: [teamId], references: [id])
  tripWorkspace               TripWorkspace?
  availabilityWindow          AvailabilityWindow?
  linkedPosts                 Post[]
}

model TripWorkspace {
  id                      String    @id @default(cuid())
  eventId                 String    @unique
  departureTime           DateTime?
  departureMeetingPoint   String?
  transportationNotes     String?
  accommodationName       String?
  accommodationAddress    String?
  accommodationCheckInTime DateTime?
  matchEventTime          DateTime?
  matchEventLocation      String?
  returnDepartureTime     DateTime?
  returnDeparturePoint    String?
  additionalNotes         String?
  itineraryVersion        Int       @default(1)
  isPublished             Boolean   @default(false)
  publishedAt             DateTime?
  event                   Event     @relation(fields: [eventId], references: [id])
  squadAssignments        TripSquadAssignment[]
  documentChecklist       DocumentChecklist?
  emergencyInfoAccessLogs EmergencyInfoAccessLog[]
}

model TripSquadAssignment {
  id                           String         @id @default(cuid())
  tripWorkspaceId              String
  teamMemberId                 String
  travelingStatus              TravelingStatus @default(unassigned)
  acknowledgedItineraryVersion Int?
  assignedAt                   DateTime       @default(now())
  updatedAt                    DateTime       @updatedAt
  tripWorkspace                TripWorkspace  @relation(fields: [tripWorkspaceId], references: [id])
  teamMember                   TeamMember     @relation(fields: [teamMemberId], references: [id])

  @@unique([tripWorkspaceId, teamMemberId])
}

model DocumentChecklist {
  id              String                  @id @default(cuid())
  tripWorkspaceId String                  @unique
  tripWorkspace   TripWorkspace           @relation(fields: [tripWorkspaceId], references: [id])
  items           DocumentChecklistItem[]
}

model DocumentChecklistItem {
  id                  String               @id @default(cuid())
  documentChecklistId String
  name                String
  applicability       DocumentApplicability @default(allPlayers)
  specificMemberIds   String[]
  createdAt           DateTime             @default(now())
  documentChecklist   DocumentChecklist    @relation(fields: [documentChecklistId], references: [id])
  confirmations       DocumentConfirmation[]
}

model DocumentConfirmation {
  id              String                @id @default(cuid())
  checklistItemId String
  teamMemberId    String
  confirmedAt     DateTime              @default(now())
  checklistItem   DocumentChecklistItem @relation(fields: [checklistItemId], references: [id])
  teamMember      TeamMember            @relation(fields: [teamMemberId], references: [id])

  @@unique([checklistItemId, teamMemberId])
}

model AvailabilityWindow {
  id                              String    @id @default(cuid())
  eventId                         String    @unique
  openedBy                        String
  openedAt                        DateTime  @default(now())
  lockedAt                        DateTime?
  isLocked                        Boolean   @default(false)
  selectionNotificationsSentAt    DateTime?
  event                           Event     @relation(fields: [eventId], references: [id])
  submissions                     AvailabilitySubmission[]
}

model AvailabilitySubmission {
  id                            String             @id @default(cuid())
  availabilityWindowId          String
  teamMemberId                  String
  availabilityStatus            AvailabilityStatus?
  note                          String?
  operationalStatus             OperationalStatus  @default(unassigned)
  operationalStatusSetBy        String?
  submittedAt                   DateTime?
  updatedAt                     DateTime           @updatedAt
  selectionNotificationSentAt   DateTime?
  availabilityWindow            AvailabilityWindow @relation(fields: [availabilityWindowId], references: [id])
  teamMember                    TeamMember         @relation(fields: [teamMemberId], references: [id])

  @@unique([availabilityWindowId, teamMemberId])
}

model Post {
  id                    String          @id @default(cuid())
  teamId                String
  eventId               String?
  type                  PostType
  content               String
  recipientGroup        RecipientGroup
  isUrgent              Boolean         @default(false)
  requiresAcknowledgment Boolean        @default(false)
  overdueThresholdHours Int             @default(4)
  createdBy             String
  createdAt             DateTime        @default(now())
  deletedAt             DateTime?
  isDraft               Boolean         @default(false)
  team                  Team            @relation(fields: [teamId], references: [id])
  linkedEvent           Event?          @relation(fields: [eventId], references: [id])
  deliveryStates        PostDeliveryState[]
}

model PostDeliveryState {
  id              String        @id @default(cuid())
  postId          String
  teamMemberId    String
  deliveryState   DeliveryState @default(notSeen)
  seenAt          DateTime?
  acknowledgedAt  DateTime?
  lastNudgeSentAt DateTime?
  nudgeCount      Int           @default(0)
  post            Post          @relation(fields: [postId], references: [id])
  teamMember      TeamMember    @relation(fields: [teamMemberId], references: [id])

  @@unique([postId, teamMemberId])
}

model CoordinatorTransfer {
  id            String         @id @default(cuid())
  teamId        String
  fromMemberId  String
  toMemberId    String
  status        TransferStatus @default(pending)
  initiatedAt   DateTime       @default(now())
  respondedAt   DateTime?
  expiresAt     DateTime
  team          Team           @relation(fields: [teamId], references: [id])
}

model EmergencyInfoAccessLog {
  id              String        @id @default(cuid())
  accessedById    String
  accessedForId   String
  tripWorkspaceId String
  accessedAt      DateTime      @default(now())
  accessedBy      TeamMember    @relation("AccessedBy", fields: [accessedById], references: [id])
  accessedFor     User          @relation("AccessedFor", fields: [accessedForId], references: [id])
  tripWorkspace   TripWorkspace @relation(fields: [tripWorkspaceId], references: [id])
}

// Enums

enum Role {
  coordinator
  coach
  staff
  player
}

enum OnboardingState {
  invited
  profileIncomplete
  active
}

enum EventType {
  match
  training
  trip
}

enum EventStatus {
  draft
  active
  cancelled
  postponed
  complete
}

enum TravelingStatus {
  traveling
  notTraveling
  unassigned
}

enum AvailabilityStatus {
  available
  limited
  unavailable
}

enum OperationalStatus {
  selected
  notSelected
  traveling
  medicallyRestricted
  unassigned
}

enum PostType {
  scheduleUpdate
  travelInfo
  generalAnnouncement
  urgentAlert
}

enum RecipientGroup {
  fullTeam
  travelingSquad
  coachingStaff
  allStaff
}

enum DeliveryState {
  notSeen
  seen
  acknowledged
}

enum TransferStatus {
  pending
  accepted
  declined
  expired
}

enum DocumentApplicability {
  allPlayers
  travelingSquad
  specific
}
```

---

## Key Business Rules and Constraints

1. One Coordinator per team at any time (enforced at application layer)
2. TeamMember.role determines all permission checks (server-side)
3. AvailabilitySubmission.operationalStatus = medicallyRestricted must NEVER appear in Player-role API responses
4. TripWorkspace.itineraryVersion increments atomically on Critical Field change using a database transaction
5. Acknowledgment endpoint must validate expectedVersion matches current itineraryVersion; return 409 if mismatch
6. PostDeliveryState nudge: once per member per post per 24-hour window
7. InvitationLink expires after 7 days; only one active link per team (revoke old on regenerate)
8. DocumentConfirmation: file upload not supported in MVP; confirmation is boolean only
9. Emergency info access is always logged regardless of read-only nature
10. User account deletion: PII removed within 30 days; anonymized IDs retained for audit logs
11. CoordinatorTransfer expires after 48 hours if not accepted
12. Maximum one pending CoordinatorTransfer per team at a time

---

## Offline Cache Priority

Cached entities per active trip (read-only):
1. TripWorkspace (full itinerary + itineraryVersion)
2. TripSquadAssignment (name, role, traveling status, acknowledgedItineraryVersion for each member)
3. User emergency info for all traveling members
4. Last 50 Posts (team feed)
5. Player's own AvailabilitySubmission for upcoming events

Emergency info cache: never dropped for space if trip is active within 7 days.
