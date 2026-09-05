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
