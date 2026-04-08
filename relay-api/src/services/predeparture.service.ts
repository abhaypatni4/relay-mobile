import { prisma } from '../db/prisma';

interface FixedItem {
  key: 'squadConfirmed' | 'documentsCollected' | 'itineraryAcknowledged' | 'emergencyInfoOnFile';
  label: string;
  currentCount: number;
  totalCount: number;
  isComplete: boolean;
}

export async function getPreDeparture(eventId: string) {
  const tw = await prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: {
      event: { select: { teamId: true, type: true } },
      squadAssignments: {
        include: { teamMember: { include: { user: true } } },
      },
      documentChecklist: { include: { items: { include: { confirmations: true } } } },
      preDepartureCustomItems: true,
    },
  });
  if (tw?.event.type !== 'trip') {
    return null;
  }

  const teamActiveMembers = await prisma.teamMember.count({
    where: { teamId: tw.event.teamId, removedAt: null, onboardingState: 'active' },
  });
  const traveling = tw.squadAssignments.filter((a) => a.travelingStatus === 'traveling');

  const squadConfirmedCurrent = traveling.length;
  const squadConfirmedTotal = teamActiveMembers;

  let documentsTotal = 0;
  let documentsCurrent = 0;
  const checklistItems = tw.documentChecklist?.items ?? [];
  for (const it of checklistItems) {
    const applicableIds =
      it.applicability === 'allPlayers'
        ? tw.squadAssignments.map((a) => a.teamMemberId)
        : it.applicability === 'travelingSquad'
          ? traveling.map((a) => a.teamMemberId)
          : it.specificMemberIds;
    documentsTotal += applicableIds.length;
    const confirmed = new Set(it.confirmations.map((c) => c.teamMemberId));
    documentsCurrent += applicableIds.filter((id) => confirmed.has(id)).length;
  }

  const itineraryTotal = traveling.length;
  const itineraryCurrent = traveling.filter(
    (a) => a.acknowledgedItineraryVersion === tw.itineraryVersion,
  ).length;

  const emergencyTotal = traveling.length;
  const emergencyCurrent = traveling.filter((a) => {
    const u = a.teamMember.user;
    return Boolean(u.emergencyContactName && u.emergencyContactPhone && u.emergencyAllergyAlert);
  }).length;

  const fixedItems: FixedItem[] = [
    {
      key: 'squadConfirmed',
      label: 'Squad confirmed',
      currentCount: squadConfirmedCurrent,
      totalCount: squadConfirmedTotal,
      isComplete: squadConfirmedCurrent === squadConfirmedTotal,
    },
    {
      key: 'documentsCollected',
      label: 'Documents collected',
      currentCount: documentsCurrent,
      totalCount: documentsTotal,
      isComplete: documentsCurrent === documentsTotal,
    },
    {
      key: 'itineraryAcknowledged',
      label: 'Itinerary acknowledged',
      currentCount: itineraryCurrent,
      totalCount: itineraryTotal,
      isComplete: itineraryCurrent === itineraryTotal,
    },
    {
      key: 'emergencyInfoOnFile',
      label: 'Emergency info on file',
      currentCount: emergencyCurrent,
      totalCount: emergencyTotal,
      isComplete: emergencyCurrent === emergencyTotal,
    },
  ];

  return {
    fixedItems,
    customItems: tw.preDepartureCustomItems.map((i) => ({
      id: i.id,
      label: i.label,
      isComplete: i.isComplete,
    })),
  };
}

export async function patchPreDepartureCustomItems(
  eventId: string,
  items: { id?: string; label: string; isComplete: boolean }[],
) {
  const tw = await prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: { event: { select: { type: true } }, preDepartureCustomItems: true },
  });
  if (tw?.event.type !== 'trip') {
    return { ok: false as const, code: 'NOT_FOUND' as const };
  }
  if (items.length > 5) {
    return { ok: false as const, code: 'TOO_MANY' as const };
  }

  await prisma.$transaction(async (tx) => {
    const existingIds = new Set(tw.preDepartureCustomItems.map((i) => i.id));
    for (const item of items) {
      if (item.id && existingIds.has(item.id)) {
        await tx.preDepartureCustomItem.update({
          where: { id: item.id },
          data: { label: item.label.trim(), isComplete: item.isComplete },
        });
      } else {
        await tx.preDepartureCustomItem.create({
          data: {
            tripWorkspaceId: tw.id,
            label: item.label.trim(),
            isComplete: item.isComplete,
          },
        });
      }
    }
  });

  return { ok: true as const };
}

