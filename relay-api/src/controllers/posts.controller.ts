import type { Request, Response } from 'express';
import { z } from 'zod';
import { serializePost, type PostForResponse } from '../serializers/post.serializer';
import { trackServerEvent } from '../services/analytics.service';
import {
  acknowledgePost,
  createPost,
  deletePost,
  getPostForMember,
  listPostsForMember,
  sendNudge,
} from '../services/posts.service';

const createBody = z.object({
  type: z.enum(['scheduleUpdate', 'travelInfo', 'generalAnnouncement', 'urgentAlert']),
  content: z.string().max(500),
  recipientGroup: z.enum(['fullTeam', 'travelingSquad', 'coachingStaff', 'allStaff']),
  eventId: z.string().optional().nullable(),
  isUrgent: z.boolean().optional(),
  isDraft: z.boolean().optional().default(false),
});

export const postsController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const role = req.member.role;
    if (!(role === 'coordinator' || role === 'coach')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    try {
      const out = await createPost(req.member.teamId, req.member.id, {
        type: parsed.data.type,
        content: parsed.data.content,
        recipientGroup: parsed.data.recipientGroup,
        eventId: parsed.data.eventId ?? null,
        isUrgent: parsed.data.isUrgent,
        isDraft: parsed.data.isDraft,
      });
      res.status(201).json({ postId: out.postId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'UNKNOWN';
      if (msg === 'NO_ACTIVE_TRIP') {
        res.status(400).json({ error: 'No active trip exists for Traveling Squad posts' });
        return;
      }
      if (msg === 'INVALID_CONTENT') {
        res.status(400).json({ error: 'Content is required and must be 500 characters or fewer' });
        return;
      }
      res.status(500).json({ error: 'Failed to create post' });
    }
  },

  list: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const rows = (await listPostsForMember(req.member.teamId, req.member)) as PostForResponse[];
    res.json({ posts: rows.map((p) => serializePost(p)) });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.postId;
    const postId = Array.isArray(raw) ? raw[0] : raw;
    if (!postId) {
      res.status(400).json({ error: 'postId required' });
      return;
    }
    const out = await getPostForMember(req.member.teamId, postId, req.member);
    if (out.kind === 'not_found') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (out.kind === 'forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json({ post: serializePost(out.post as PostForResponse) });
  },

  acknowledge: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.postId;
    const postId = Array.isArray(raw) ? raw[0] : raw;
    if (!postId) {
      res.status(400).json({ error: 'postId required' });
      return;
    }
    const out = await acknowledgePost(req.member.teamId, postId, req.member.id);
    if (out.kind === 'not_found') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (out.kind === 'forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (out.kind === 'not_required') {
      res.status(400).json({ error: 'Acknowledgment is not required for this post' });
      return;
    }
    res.status(200).json({ ok: true });
  },

  nudge: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.postId;
    const postId = Array.isArray(raw) ? raw[0] : raw;
    if (!postId) {
      res.status(400).json({ error: 'postId required' });
      return;
    }
    const out = await sendNudge(req.member.teamId, postId, req.member.role);
    if (out.kind === 'not_found') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (out.kind === 'forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (out.kind === 'not_required') {
      res.status(400).json({ error: 'Nudges are only valid for acknowledgment-required posts' });
      return;
    }
    trackServerEvent('nudge_sent', {
      overdueCount: out.nudgedCount,
      teamId: req.member.teamId,
      postId,
    });
    res.status(200).json({ nudgedCount: out.nudgedCount });
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.postId;
    const postId = Array.isArray(raw) ? raw[0] : raw;
    if (!postId) {
      res.status(400).json({ error: 'postId required' });
      return;
    }
    const out = await deletePost(req.member.teamId, postId, req.member);
    if (out.kind === 'not_found') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (out.kind === 'forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json({ ok: true, notified: out.notified });
  },
};

