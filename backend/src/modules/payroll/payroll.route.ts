import { Router } from "express";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import {
  createPayrun,
  selectEmployees,
  computePayrun,
  validatePayrun,
  markPaidPayrun,
  cancelPayrun,
  getPayruns,
  getPayrunById,
  getPayslips,
  getPayslipById,
} from "./payroll.controller.js";

// Router for /payruns
export const payrunRouter = Router();

payrunRouter.use(clerkAuthMiddleware);

payrunRouter.get(
  "/",
  requireRole("admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"),
  getPayruns,
);
payrunRouter.get(
  "/:id",
  requireRole("admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"),
  getPayrunById,
);
payrunRouter.post(
  "/",
  requireRole("admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"),
  createPayrun,
);
payrunRouter.post(
  "/:id/select-employees",
  requireRole("admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"),
  selectEmployees,
);
payrunRouter.post(
  "/:id/compute",
  requireRole("admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"),
  computePayrun,
);
payrunRouter.patch(
  "/:id/validate",
  requireRole("admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"),
  validatePayrun,
);
payrunRouter.post(
  "/:id/validate",
  requireRole("admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"),
  validatePayrun,
);
payrunRouter.patch(
  "/:id/mark-paid",
  requireRole("admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"),
  markPaidPayrun,
);
payrunRouter.post(
  "/:id/mark-paid",
  requireRole("admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"),
  markPaidPayrun,
);
payrunRouter.post(
  "/:id/cancel",
  requireRole("admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"),
  cancelPayrun,
);

// Router for /payslips
export const payslipRouter = Router();

payslipRouter.use(clerkAuthMiddleware);

payslipRouter.get("/", getPayslips);
payslipRouter.get("/:id", getPayslipById);
