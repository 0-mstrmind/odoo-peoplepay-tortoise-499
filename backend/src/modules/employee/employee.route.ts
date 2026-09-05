import { Router } from "express";

import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeRole,
  getEmployeeContracts,
  getEmployeeAttendances,
  getEmployeeTimeOff,
  getEmployeePayslips,
  getEmployeeBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getMasterData,
  getEmployeeStats,
  createDepartment,
  createJobPosition,
  createWorkingSchedule,
  getMyEmployeeProfile,
} from "./employee.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { getEmployeeLeaveBalances } from "../timeoff/timeoff.controller.js";

const router = Router();

const HR_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"];

// 1. Meta and Master Data routes (must precede /:id)
router.get("/me", clerkAuthMiddleware, getMyEmployeeProfile);
router.get("/meta/masters", clerkAuthMiddleware, getMasterData);
router.get("/meta/stats", clerkAuthMiddleware, getEmployeeStats);
router.post("/meta/departments", clerkAuthMiddleware, requireRole(...HR_ROLES), createDepartment);
router.post("/meta/job-positions", clerkAuthMiddleware, requireRole(...HR_ROLES), createJobPosition);
router.post("/meta/working-schedules", clerkAuthMiddleware, requireRole(...HR_ROLES), createWorkingSchedule);

// 2. Employee collection routes
router.get("/", clerkAuthMiddleware, getEmployees);
router.post("/", clerkAuthMiddleware, requireRole(...HR_ROLES), createEmployee);

// 3. Single employee routes
router.get("/:id", clerkAuthMiddleware, getEmployeeById);
router.put("/:id", clerkAuthMiddleware, requireRole(...HR_ROLES), updateEmployee);
router.delete("/:id", clerkAuthMiddleware, requireRole(...HR_ROLES), deleteEmployee);

// 4. Role Assignment & Permission Update (Admin ONLY)
router.patch("/:id/role", clerkAuthMiddleware, requireRole("admin"), updateEmployeeRole);

// 5. Smart Button Sub-Resources (PDF Section B2 & Excalidraw flow)
router.get("/:id/contracts", clerkAuthMiddleware, getEmployeeContracts);
router.get("/:id/attendances", clerkAuthMiddleware, getEmployeeAttendances);
router.get("/:id/time-off", clerkAuthMiddleware, getEmployeeTimeOff);
router.get("/:id/leave-balances", clerkAuthMiddleware, getEmployeeLeaveBalances);
router.get("/:id/payslips", clerkAuthMiddleware, getEmployeePayslips);

// 6. Bank Account management
router.get("/:id/bank-accounts", clerkAuthMiddleware, getEmployeeBankAccounts);
router.post("/:id/bank-accounts", clerkAuthMiddleware, requireRole(...HR_ROLES), addBankAccount);
router.patch("/:id/bank-accounts/:bankAccountId", clerkAuthMiddleware, requireRole(...HR_ROLES), updateBankAccount);
router.delete("/:id/bank-accounts/:bankAccountId", clerkAuthMiddleware, requireRole(...HR_ROLES), deleteBankAccount);

export default router;
