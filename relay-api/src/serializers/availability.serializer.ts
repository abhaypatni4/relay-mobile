import type { AvailabilityStatus, OperationalStatus, Role } from '@prisma/client';
import type { JsonObject } from './base.serializer';
import { isPlayerViewer } from './base.serializer';

export interface AvailabilitySubmissionRow {
  id: string;
  teamMemberId: string;
  memberName: string;
  /** Included for coach/coordinator/staff roster filtering; never sent to players. */
  memberRole?: Role;
  availabilityStatus: AvailabilityStatus | null;
  note: string | null;
  operationalStatus: OperationalStatus;
  operationalStatusSetBy: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  selectionNotificationSentAt: Date | null;
}

export interface AvailabilityWindowRow {
  id: string;
  eventId: string;
  openedAt: Date;
  lockedAt: Date | null;
  isLocked: boolean;
  selectionNotificationsSentAt: Date | null;
}

export function serializeAvailabilityWindow(row: AvailabilityWindowRow): JsonObject {
  return {
    id: row.id,
    eventId: row.eventId,
    openedAt: row.openedAt.toISOString(),
    lockedAt: row.lockedAt?.toISOString() ?? null,
    isLocked: row.isLocked,
    selectionNotificationsSentAt: row.selectionNotificationsSentAt?.toISOString() ?? null,
  };
}

export type PlayerSelectionOutcome = 'selected' | 'notSelected' | 'pending';

export interface SerializeAvailabilityOptions {
  /** When true, coach/coordinator has sent selection notifications for this window. */
  selectionNotificationsSent?: boolean;
}

function playerSelectionOutcome(
  row: AvailabilitySubmissionRow,
  selectionNotificationsSent: boolean,
): PlayerSelectionOutcome {
  if (!selectionNotificationsSent) {
    return 'pending';
  }
  if (row.operationalStatus === 'selected' || row.operationalStatus === 'traveling') {
    return 'selected';
  }
  if (row.operationalStatus === 'notSelected' || row.operationalStatus === 'medicallyRestricted') {
    return 'notSelected';
  }
  return 'pending';
}

export function serializeAvailabilitySubmission(
  viewerRole: Role,
  row: AvailabilitySubmissionRow,
  options?: SerializeAvailabilityOptions,
): JsonObject {
  const base: JsonObject = {
    id: row.id,
    teamMemberId: row.teamMemberId,
    memberName: row.memberName,
    availabilityStatus: row.availabilityStatus,
    note: row.note,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    selectionNotificationSentAt: row.selectionNotificationSentAt?.toISOString() ?? null,
  };
  if (isPlayerViewer(viewerRole)) {
    const sent = Boolean(options?.selectionNotificationsSent);
    base.selectionOutcome = playerSelectionOutcome(row, sent);
    return base;
  }
  if (row.memberRole !== undefined) {
    base.memberRole = row.memberRole;
  }
  base.operationalStatus = row.operationalStatus;
  base.operationalStatusSetBy = row.operationalStatusSetBy;
  return base;
}
