import { Router } from "express";

import {
  listWorkingSchedules,
  getWorkingScheduleById,
  createWorkingSchedule,
  updateWorkingSchedule,
  deleteWorkingSchedule,
  assignSchedule,
} from "./working-schedule.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";

const router = Router();
const HR_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user", "employee"];

router.get("/", clerkAuthMiddleware, listWorkingSchedules);
router.post("/", clerkAuthMiddleware, requireRole(...HR_ROLES), createWorkingSchedule);

router.get("/:id", clerkAuthMiddleware, getWorkingScheduleById);
router.put("/:id", clerkAuthMiddleware, requireRole(...HR_ROLES), updateWorkingSchedule);
router.delete("/:id", clerkAuthMiddleware, requireRole(...HR_ROLES), deleteWorkingSchedule);

router.post("/:id/assign", clerkAuthMiddleware, requireRole(...HR_ROLES), assignSchedule);

export default router;
