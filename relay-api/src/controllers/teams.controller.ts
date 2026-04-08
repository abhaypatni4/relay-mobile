import type { Request, Response } from 'express';
import { z } from 'zod';
import { serializeRosterMember } from '../serializers/member.serializer';
import {
  createTeamForUser,
  getTeamMemberById,
  getTeamById,
  listTeamMembersWithUsers,
  softRemoveTeamMember,
  sortMembersForRoster,
  toTeamMemberWithUser,
  updateTeam,
} from '../services/team.service';

const createBody = z.object({
  name: z.string().trim().min(1),
  sport: z.string().trim().optional().nullable(),
  homeLocation: z.string().trim().optional().nullable(),
});

const patchBody = z.object({
  name: z.string().trim().min(1).optional(),
  sport: z.string().trim().optional().nullable(),
  homeLocation: z.string().trim().optional().nullable(),
});

export const teamsController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const { teamId, memberId } = await createTeamForUser(req.user.userId, parsed.data);
    const team = await getTeamById(teamId);
    res.status(201).json({
      team: team
        ? {
            id: team.id,
            name: team.name,
            sport: team.sport,
            homeLocation: team.homeLocation,
            createdAt: team.createdAt.toISOString(),
          }
        : null,
      teamMemberId: memberId,
    });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const team = await getTeamById(id);
    if (!team) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      id: team.id,
      name: team.name,
      sport: team.sport,
      homeLocation: team.homeLocation,
      createdAt: team.createdAt.toISOString(),
    });
  },

  listMembers: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing member' });
      return;
    }
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const rows = sortMembersForRoster(await listTeamMembersWithUsers(id));
    const viewerRole = req.member.role;
    const members = rows.map((r) => serializeRosterMember(viewerRole, toTeamMemberWithUser(r)));
    res.json({ members });
  },

  patch: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    await updateTeam(id, parsed.data);
    const team = await getTeamById(id);
    if (!team) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      id: team.id,
      name: team.name,
      sport: team.sport,
      homeLocation: team.homeLocation,
      createdAt: team.createdAt.toISOString(),
    });
  },

  removeMember: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const memberId = req.params.memberId;
    const safeTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
    const safeMemberId = Array.isArray(memberId) ? memberId[0] : memberId;
    if (!safeTeamId || !safeMemberId) {
      res.status(400).json({ error: 'teamId and memberId required' });
      return;
    }

    const member = await getTeamMemberById(safeTeamId, safeMemberId);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    if (member.role === 'coordinator') {
      res.status(400).json({ error: 'Cannot remove the coordinator. Transfer the role first.' });
      return;
    }

    await softRemoveTeamMember(safeTeamId, safeMemberId);
    res.status(204).send();
  },
};
