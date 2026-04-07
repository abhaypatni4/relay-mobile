import type { OnboardingState, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      email: string | null;
    }

    interface MemberPayload {
      id: string;
      userId: string;
      teamId: string;
      role: Role;
      onboardingState: OnboardingState;
    }

    interface Request {
      user?: UserPayload;
      member?: MemberPayload;
    }
  }
}

export {};
