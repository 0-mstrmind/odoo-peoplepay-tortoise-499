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

const router = Router();

// Read dashboard metrics: Admin, HR Manager, HR Payroll Manager, HR Payroll User
const canViewDashboard = requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user");
const canManageAlerts = requireRole("admin", "hr_manager", "hr_payroll_manager");

router.get("/overview", clerkAuthMiddleware, canViewDashboard, getDashboardOverview);
router.get("/trends", clerkAuthMiddleware, canViewDashboard, getSalaryTrends);
router.get("/departments", clerkAuthMiddleware, canViewDashboard, getDepartmentBreakdown);
router.get("/attendance", clerkAuthMiddleware, canViewDashboard, getAttendanceOverview);
router.get("/alerts", clerkAuthMiddleware, canViewDashboard, getOperationalAlerts);

// Resolve warning endpoint
router.patch("/alerts/:warningId/resolve", clerkAuthMiddleware, canManageAlerts, resolveWarning);

export default router;
