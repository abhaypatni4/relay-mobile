-- CreateEnum
CREATE TYPE "Role" AS ENUM ('coordinator', 'coach', 'staff', 'player');

-- CreateEnum
CREATE TYPE "OnboardingState" AS ENUM ('invited', 'profileIncomplete', 'active');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('match', 'training', 'trip');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'active', 'cancelled', 'postponed', 'complete');

-- CreateEnum
CREATE TYPE "TravelingStatus" AS ENUM ('traveling', 'notTraveling', 'unassigned');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'limited', 'unavailable');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('selected', 'notSelected', 'traveling', 'medicallyRestricted', 'unassigned');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('scheduleUpdate', 'travelInfo', 'generalAnnouncement', 'urgentAlert');

-- CreateEnum
CREATE TYPE "RecipientGroup" AS ENUM ('fullTeam', 'travelingSquad', 'coachingStaff', 'allStaff');

-- CreateEnum
CREATE TYPE "DeliveryState" AS ENUM ('notSeen', 'seen', 'acknowledged');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "DocumentApplicability" AS ENUM ('allPlayers', 'travelingSquad', 'specific');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "pushToken" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyAllergyAlert" TEXT,
    "emergencyStaffNote" TEXT,
    "emergencyInfoUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT,
    "homeLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "onboardingState" "OnboardingState" NOT NULL DEFAULT 'invited',
    "jerseyNumber" TEXT,
    "customRoleLabel" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationLink" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InvitationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "location" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "cancelledAt" TIMESTAMP(3),
    "postponedAt" TIMESTAMP(3),
    "newDateAfterPostponement" TIMESTAMP(3),
    "newTimeAfterPostponement" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripWorkspace" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3),
    "departureMeetingPoint" TEXT,
    "transportationNotes" TEXT,
    "accommodationName" TEXT,
    "accommodationAddress" TEXT,
    "accommodationCheckInTime" TIMESTAMP(3),
    "matchEventTime" TIMESTAMP(3),
    "matchEventLocation" TEXT,
    "returnDepartureTime" TIMESTAMP(3),
    "returnDeparturePoint" TEXT,
    "additionalNotes" TEXT,
    "itineraryVersion" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "TripWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSquadAssignment" (
    "id" TEXT NOT NULL,
    "tripWorkspaceId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "travelingStatus" "TravelingStatus" NOT NULL DEFAULT 'unassigned',
    "acknowledgedItineraryVersion" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripSquadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChecklist" (
    "id" TEXT NOT NULL,
    "tripWorkspaceId" TEXT NOT NULL,

    CONSTRAINT "DocumentChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChecklistItem" (
    "id" TEXT NOT NULL,
    "documentChecklistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicability" "DocumentApplicability" NOT NULL DEFAULT 'allPlayers',
    "specificMemberIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentConfirmation" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "selectionNotificationsSentAt" TIMESTAMP(3),

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySubmission" (
    "id" TEXT NOT NULL,
    "availabilityWindowId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "availabilityStatus" "AvailabilityStatus",
    "note" TEXT,
    "operationalStatus" "OperationalStatus" NOT NULL DEFAULT 'unassigned',
    "operationalStatusSetBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selectionNotificationSentAt" TIMESTAMP(3),

    CONSTRAINT "AvailabilitySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "PostType" NOT NULL,
    "content" TEXT NOT NULL,
    "recipientGroup" "RecipientGroup" NOT NULL,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "requiresAcknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "overdueThresholdHours" INTEGER NOT NULL DEFAULT 4,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostDeliveryState" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "deliveryState" "DeliveryState" NOT NULL DEFAULT 'notSeen',
    "seenAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "lastNudgeSentAt" TIMESTAMP(3),
    "nudgeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostDeliveryState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinatorTransfer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinatorTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyInfoAccessLog" (
    "id" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "accessedForId" TEXT NOT NULL,
    "tripWorkspaceId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyInfoAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationLink_token_key" ON "InvitationLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TripWorkspace_eventId_key" ON "TripWorkspace"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSquadAssignment_tripWorkspaceId_teamMemberId_key" ON "TripSquadAssignment"("tripWorkspaceId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChecklist_tripWorkspaceId_key" ON "DocumentChecklist"("tripWorkspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentConfirmation_checklistItemId_teamMemberId_key" ON "DocumentConfirmation"("checklistItemId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityWindow_eventId_key" ON "AvailabilityWindow"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySubmission_availabilityWindowId_teamMemberId_key" ON "AvailabilitySubmission"("availabilityWindowId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "PostDeliveryState_postId_teamMemberId_key" ON "PostDeliveryState"("postId", "teamMemberId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripWorkspace" ADD CONSTRAINT "TripWorkspace_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSquadAssignment" ADD CONSTRAINT "TripSquadAssignment_tripWorkspaceId_fkey" FOREIGN KEY ("tripWorkspaceId") REFERENCES "TripWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSquadAssignment" ADD CONSTRAINT "TripSquadAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChecklist" ADD CONSTRAINT "DocumentChecklist_tripWorkspaceId_fkey" FOREIGN KEY ("tripWorkspaceId") REFERENCES "TripWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChecklistItem" ADD CONSTRAINT "DocumentChecklistItem_documentChecklistId_fkey" FOREIGN KEY ("documentChecklistId") REFERENCES "DocumentChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentConfirmation" ADD CONSTRAINT "DocumentConfirmation_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "DocumentChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentConfirmation" ADD CONSTRAINT "DocumentConfirmation_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_availabilityWindowId_fkey" FOREIGN KEY ("availabilityWindowId") REFERENCES "AvailabilityWindow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySubmission" ADD CONSTRAINT "AvailabilitySubmission_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDeliveryState" ADD CONSTRAINT "PostDeliveryState_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDeliveryState" ADD CONSTRAINT "PostDeliveryState_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorTransfer" ADD CONSTRAINT "CoordinatorTransfer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyInfoAccessLog" ADD CONSTRAINT "EmergencyInfoAccessLog_accessedById_fkey" FOREIGN KEY ("accessedById") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyInfoAccessLog" ADD CONSTRAINT "EmergencyInfoAccessLog_accessedForId_fkey" FOREIGN KEY ("accessedForId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyInfoAccessLog" ADD CONSTRAINT "EmergencyInfoAccessLog_tripWorkspaceId_fkey" FOREIGN KEY ("tripWorkspaceId") REFERENCES "TripWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
