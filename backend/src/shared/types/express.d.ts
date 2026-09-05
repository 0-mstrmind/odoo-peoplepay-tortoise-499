import "express";
<<<<<<< HEAD
import "express-serve-static-core";
=======
>>>>>>> 011fd478bcb0ee1734b862ac0e30633c1be7625f

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
<<<<<<< HEAD
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
=======
>>>>>>> 011fd478bcb0ee1734b862ac0e30633c1be7625f
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

