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
} from "./employee.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";

const router = Router();

// 1. Meta and Master Data routes (must precede /:id)
router.get("/meta/masters", clerkAuthMiddleware, getMasterData);
router.get("/meta/stats", clerkAuthMiddleware, getEmployeeStats);
router.post("/meta/departments", clerkAuthMiddleware, requireRole("admin", "hr_manager"), createDepartment);
router.post("/meta/job-positions", clerkAuthMiddleware, requireRole("admin", "hr_manager"), createJobPosition);
router.post("/meta/working-schedules", clerkAuthMiddleware, requireRole("admin", "hr_manager"), createWorkingSchedule);

// 2. Employee collection routes
router.get("/", clerkAuthMiddleware, getEmployees);
router.post("/", clerkAuthMiddleware, requireRole("admin", "hr_manager"), createEmployee);

// 3. Single employee routes
router.get("/:id", clerkAuthMiddleware, getEmployeeById);
router.put("/:id", clerkAuthMiddleware, requireRole("admin", "hr_manager"), updateEmployee);
router.delete("/:id", clerkAuthMiddleware, requireRole("admin", "hr_manager"), deleteEmployee);

// 4. Role Assignment & Permission Update (Admin ONLY)
router.patch("/:id/role", clerkAuthMiddleware, requireRole("admin"), updateEmployeeRole);

// 5. Smart Button Sub-Resources (PDF Section B2 & Excalidraw flow)
router.get("/:id/contracts", clerkAuthMiddleware, getEmployeeContracts);
router.get("/:id/attendances", clerkAuthMiddleware, getEmployeeAttendances);
router.get("/:id/time-off", clerkAuthMiddleware, getEmployeeTimeOff);
router.get("/:id/payslips", clerkAuthMiddleware, getEmployeePayslips);

// 6. Bank Account management
router.get("/:id/bank-accounts", clerkAuthMiddleware, getEmployeeBankAccounts);
router.post("/:id/bank-accounts", clerkAuthMiddleware, requireRole("admin", "hr_manager"), addBankAccount);
router.patch("/:id/bank-accounts/:bankAccountId", clerkAuthMiddleware, requireRole("admin", "hr_manager"), updateBankAccount);
router.delete("/:id/bank-accounts/:bankAccountId", clerkAuthMiddleware, requireRole("admin", "hr_manager"), deleteBankAccount);

export default router;
