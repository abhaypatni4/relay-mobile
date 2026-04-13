import { Prisma, Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env';
import {
  loginUser,
  logoutWithRefreshToken,
  refreshAccessToken,
  registerUser,
} from '../services/auth.service';
import { acceptInvitation, validateInvitationToken } from '../services/invitation.service';

/** Accept `identifier` (email or phone) as a single field; map to `email` / `phone` before validation. */
function normalizeRegisterBody(input: unknown): unknown {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }
  const o = { ...(input as Record<string, unknown>) };
  const ident = o.identifier;
  if (typeof ident === 'string' && ident.trim()) {
    const t = ident.trim();
    if (o.email === undefined && o.phone === undefined) {
      if (t.includes('@')) {
        o.email = t.toLowerCase();
      } else {
        o.phone = t;
      }
    }
    delete o.identifier;
  }
  return o;
}

const registerBody = z.preprocess(
  normalizeRegisterBody,
  z
    .object({
      name: z.string().trim().min(1),
      email: z.email().optional(),
      phone: z.string().trim().min(8).optional(),
      password: z.string().min(8),
      invitationToken: z.string().trim().optional(),
      role: z.enum(Role).optional(),
    })
    .refine((d) => Boolean(d.email ?? d.phone), { message: 'email or phone required' }),
);

const loginBody = z
  .object({
    email: z.email().optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(1),
  })
  .refine((d) => Boolean(d.email ?? d.phone), { message: 'email or phone required' });

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export function createAuthController(env: Env) {
  return {
    register: async (req: Request, res: Response): Promise<void> => {
      console.log('[register] hit', req.body);
      try {
        const parsed = registerBody.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: 'Invalid body' });
          return;
        }
        const { invitationToken, role, ...registerInput } = parsed.data;
        if (invitationToken) {
          const invite = await validateInvitationToken(invitationToken);
          if (!invite.ok) {
            if (invite.reason === 'expired') {
              res.status(410).json({ error: 'This invitation code has expired. Ask your coordinator to send a new one.' });
              return;
            }
            res.status(404).json({ error: 'This invitation code is invalid' });
            return;
          }
        }
        const { user, tokens } = await registerUser(env, registerInput);
        if (invitationToken) {
          try {
            await acceptInvitation(user.id, invitationToken, role ?? 'player');
          } catch (inviteErr: unknown) {
            const code = inviteErr instanceof Error ? inviteErr.message : '';
            if (code === 'ALREADY_MEMBER') {
              res.status(409).json({ error: 'You are already a member of this team' });
              return;
            }
            if (code === 'INVITE_EXPIRED') {
              res.status(410).json({ error: 'This invitation code has expired. Ask your coordinator to send a new one.' });
              return;
            }
            if (code === 'INVITE_NOT_FOUND') {
              res.status(404).json({ error: 'This invitation code is invalid' });
              return;
            }
            throw inviteErr;
          }
        }
        res.status(201).json({
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresInSeconds,
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : undefined;
        console.log('[register] error', message, stack);

        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const target = (e.meta?.target as string[] | undefined)?.join(',') ?? '';
          if (target.includes('email')) {
            res.status(409).json({ error: 'Email already registered' });
            return;
          }
          if (target.includes('phone')) {
            res.status(409).json({ error: 'Phone number already registered' });
            return;
          }
          res.status(409).json({ error: 'Email or phone already registered' });
          return;
        }

        if (env.NODE_ENV === 'development') {
          res.status(400).json({ error: message });
          return;
        }
        res.status(400).json({ error: 'Registration failed' });
      }
    },

    login: async (req: Request, res: Response): Promise<void> => {
      const parsed = loginBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body' });
        return;
      }
      try {
        const { user, tokens } = await loginUser(env, parsed.data);
        res.status(200).json({
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresInSeconds,
        });
      } catch {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    },

    refresh: async (req: Request, res: Response): Promise<void> => {
      const parsed = refreshBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body' });
        return;
      }
      try {
        const out = await refreshAccessToken(env, parsed.data.refreshToken);
        res.status(200).json({
          accessToken: out.accessToken,
          expiresIn: out.expiresInSeconds,
        });
      } catch {
        res.status(401).json({ error: 'Invalid refresh token' });
      }
    },

    logout: async (req: Request, res: Response): Promise<void> => {
      const parsed = refreshBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body' });
        return;
      }
      await logoutWithRefreshToken(parsed.data.refreshToken);
      res.status(204).send();
    },
  };
}
