import type { EventStatus, EventType, OnboardingState, Role } from '@prisma/client';

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

    interface EventRowPayload {
      id: string;
      teamId: string;
      type: EventType;
      status: EventStatus;
      name: string;
    }

    interface Request {
      user?: UserPayload;
      member?: MemberPayload;
      eventRow?: EventRowPayload;
    }
  }
}

export {};
