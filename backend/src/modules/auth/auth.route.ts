import { Router } from "express";

import {
  getMe,
  listUsers,
  login,
  updateUserRole,
  updateUserStatus,
  updateMyProfile,
  updateMyPassword,
} from "./auth.controller.js";
import { handleClerkWebhook } from "./webhook.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";

const router = Router();

// Public Login & Webhook endpoints
router.post("/login", login);
router.post("/webhook", handleClerkWebhook);

// Protected Auth & User endpoints
router.get("/me", clerkAuthMiddleware, getMe);
router.patch("/me/profile", clerkAuthMiddleware, updateMyProfile);
router.patch("/me/password", clerkAuthMiddleware, updateMyPassword);
router.get("/users", clerkAuthMiddleware, requireRole("admin", "hr_manager"), listUsers);
router.patch("/users/:id/role", clerkAuthMiddleware, requireRole("admin"), updateUserRole);
router.patch("/users/:id/status", clerkAuthMiddleware, requireRole("admin", "hr_manager"), updateUserStatus);

export default router;