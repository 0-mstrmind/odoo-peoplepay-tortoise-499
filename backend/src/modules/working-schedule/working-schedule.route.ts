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

router.get("/", clerkAuthMiddleware, listWorkingSchedules);
router.post("/", clerkAuthMiddleware, requireRole("admin", "hr_manager"), createWorkingSchedule);

router.get("/:id", clerkAuthMiddleware, getWorkingScheduleById);
router.put("/:id", clerkAuthMiddleware, requireRole("admin", "hr_manager"), updateWorkingSchedule);
router.delete("/:id", clerkAuthMiddleware, requireRole("admin", "hr_manager"), deleteWorkingSchedule);

router.post("/:id/assign", clerkAuthMiddleware, requireRole("admin", "hr_manager"), assignSchedule);

export default router;
