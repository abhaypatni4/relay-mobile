import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env';
import {
  loginUser,
  logoutWithRefreshToken,
  refreshAccessToken,
  registerUser,
} from '../services/auth.service';

const registerBody = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
});

const loginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export function createAuthController(env: Env) {
  return {
    register: async (req: Request, res: Response): Promise<void> => {
      const parsed = registerBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body' });
        return;
      }
      try {
        const { user, tokens } = await registerUser(env, parsed.data);
        res.status(201).json({
          user: { id: user.id, name: user.name, email: user.email },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresInSeconds,
        });
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          res.status(409).json({ error: 'Email already registered' });
          return;
        }
        const msg = e instanceof Error ? e.message : 'Error';
        res.status(400).json({ error: msg });
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
          user: { id: user.id, name: user.name, email: user.email },
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
