import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

export function requireRole(allowed: readonly Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.member) {
      res.status(500).json({ error: 'Member context missing' });
      return;
    }
    if (!allowed.includes(req.member.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
