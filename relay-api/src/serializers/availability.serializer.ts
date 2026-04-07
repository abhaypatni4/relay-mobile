import type { AvailabilityStatus, OperationalStatus, Role } from '@prisma/client';
import type { JsonObject } from './base.serializer';
import { isPlayerViewer } from './base.serializer';

export interface AvailabilitySubmissionRow {
  id: string;
  teamMemberId: string;
  memberName: string;
  availabilityStatus: AvailabilityStatus | null;
  note: string | null;
  operationalStatus: OperationalStatus;
  operationalStatusSetBy: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  selectionNotificationSentAt: Date | null;
}

export function serializeAvailabilitySubmission(
  viewerRole: Role,
  row: AvailabilitySubmissionRow,
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
    return base;
  }
  base.operationalStatus = row.operationalStatus;
  base.operationalStatusSetBy = row.operationalStatusSetBy;
  return base;
}
