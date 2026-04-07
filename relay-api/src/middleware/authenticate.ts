import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

export function authenticateMiddleware(env: Env) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const payload = verifyAccessToken(env, token);
      req.user = {
        userId: payload.sub,
        email: payload.email,
      };
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
