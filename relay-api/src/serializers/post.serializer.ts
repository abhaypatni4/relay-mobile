import type { DeliveryState, PostType, RecipientGroup, Role } from '@prisma/client';
import type { JsonObject } from './base.serializer';

export interface PostForResponse {
  id: string;
  teamId: string;
  eventId: string | null;
  type: PostType;
  content: string;
  recipientGroup: RecipientGroup;
  isUrgent: boolean;
  requiresAcknowledgment: boolean;
  overdueThresholdHours: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  deletedAt: Date | null;
  currentUserDeliveryState: DeliveryState;
  currentUserAcknowledgedAt: Date | null;
  deliverySummary?: {
    sentCount: number;
    seenCount: number;
    acknowledgedCount: number;
    overdueCount: number;
    overdueMembers?: {
      teamMemberId: string;
      memberName: string;
      lastNudgeSentAt: Date | null;
      canNudge: boolean;
    }[];
  };
}

export function serializePost(row: PostForResponse): JsonObject {
  const o: JsonObject = {
    id: row.id,
    teamId: row.teamId,
    eventId: row.eventId,
    type: row.type,
    content: row.content,
    recipientGroup: row.recipientGroup,
    isUrgent: row.isUrgent,
    requiresAcknowledgment: row.requiresAcknowledgment,
    overdueThresholdHours: row.overdueThresholdHours,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    currentUserDeliveryState: row.currentUserDeliveryState,
    currentUserAcknowledgedAt: row.currentUserAcknowledgedAt?.toISOString() ?? null,
  };
  if (row.deliverySummary) {
    o.deliverySummary = {
      sentCount: row.deliverySummary.sentCount,
      seenCount: row.deliverySummary.seenCount,
      acknowledgedCount: row.deliverySummary.acknowledgedCount,
      overdueCount: row.deliverySummary.overdueCount,
      overdueMembers: row.deliverySummary.overdueMembers?.map((m) => ({
        teamMemberId: m.teamMemberId,
        memberName: m.memberName,
        lastNudgeSentAt: m.lastNudgeSentAt?.toISOString() ?? null,
        canNudge: m.canNudge,
      })),
    };
  }
  return o;
}

export function canViewDeliverySummary(role: Role): boolean {
  return role === 'coordinator' || role === 'coach';
}

