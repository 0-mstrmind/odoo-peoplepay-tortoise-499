import "express";
import "express-serve-static-core";

export interface AuthenticatedUser {
  id: string;
  userId?: string;
  clerkUserId?: string | null;
  email: string;
  role: string;
  companyId?: string | null;
  employeeId?: string | null;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      auth?: {
        userId: string | null;
        sessionId: string | null;
      };
      refreshToken?: string;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    auth?: {
      userId: string | null;
      sessionId: string | null;
    };
    refreshToken?: string;
  }
}

declare module "express" {
  interface Request {
    user?: AuthenticatedUser;
    auth?: {
      userId: string | null;
      sessionId: string | null;
    };
    refreshToken?: string;
  }
}
