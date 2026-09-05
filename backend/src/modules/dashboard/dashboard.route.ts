import { Router } from "express";

import {
  getDashboardOverview,
  getSalaryTrends,
  getDepartmentBreakdown,
  getAttendanceOverview,
  getOperationalAlerts,
  resolveWarning,
} from "./dashboard.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { cacheMiddleware } from "../../redis/middlewares/cache.middleware.js";

const router = Router();

// Read dashboard metrics: Admin, HR Manager, HR Payroll Manager, HR Payroll User
const canViewDashboard = requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user");
const canManageAlerts = requireRole("admin", "hr_manager", "hr_payroll_manager");

// Overview cached for 120s (2 minutes)
router.get(
  "/overview",
  clerkAuthMiddleware,
  canViewDashboard,
  cacheMiddleware({ ttlSeconds: 120, prefix: "dashboard:http" }),
  getDashboardOverview,
);

// Monthly salary trends cached for 300s (5 minutes)
router.get(
  "/trends",
  clerkAuthMiddleware,
  canViewDashboard,
  cacheMiddleware({ ttlSeconds: 300, prefix: "dashboard:http" }),
  getSalaryTrends,
);

// Department salary breakdown cached for 300s (5 minutes)
router.get(
  "/departments",
  clerkAuthMiddleware,
  canViewDashboard,
  cacheMiddleware({ ttlSeconds: 300, prefix: "dashboard:http" }),
  getDepartmentBreakdown,
);

// Attendance overview cached for 120s (2 minutes)
router.get(
  "/attendance",
  clerkAuthMiddleware,
  canViewDashboard,
  cacheMiddleware({ ttlSeconds: 120, prefix: "dashboard:http" }),
  getAttendanceOverview,
);

// Operational alerts cached for 60s (1 minute)
router.get(
  "/alerts",
  clerkAuthMiddleware,
  canViewDashboard,
  cacheMiddleware({ ttlSeconds: 60, prefix: "dashboard:http" }),
  getOperationalAlerts,
);

// Resolve warning endpoint
router.patch("/alerts/:warningId/resolve", clerkAuthMiddleware, canManageAlerts, resolveWarning);

export default router;
