import { Router } from "express";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import {
  checkIn,
  checkOut,
  createAttendanceRequest,
  approveAttendanceRequest,
  refuseAttendanceRequest,
  getAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "./attendance.controller.js";

const router = Router();

// Apply base authentication to all attendance endpoints
router.use(clerkAuthMiddleware);

// 1. Employee operational attendance endpoints
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.post("/requests", createAttendanceRequest);

// 2. Attendance Request Review (Accept / Decline) - Manager / Admin
router.patch(
  "/requests/:id/approve",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  approveAttendanceRequest,
);
router.patch(
  "/requests/:id/refuse",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  refuseAttendanceRequest,
);
router.post(
  "/:id/approve",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  approveAttendanceRequest,
);
router.post(
  "/:id/refuse",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  refuseAttendanceRequest,
);

// 3. Attendance Query Endpoints
router.get("/", getAttendances);
router.get("/:id", getAttendanceById);

// 4. Admin / HR CRUD operations
router.post("/", requireRole("admin", "hr_manager"), createAttendance);
router.put("/:id", requireRole("admin", "hr_manager"), updateAttendance);
router.delete("/:id", requireRole("admin", "hr_manager"), deleteAttendance);

export default router;
