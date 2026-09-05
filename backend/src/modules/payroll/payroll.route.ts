import { Router } from "express";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { validateBody } from "../../core/middlewares/validateRequest.middleware.js";
import { adjustPayslipSchema } from "./payroll.validation.js";
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
  adjustPayslip,
} from "./payroll.controller.js";

/**
 * PAYRUN access roles:
 * - PAYROLL_CRU_ROLES: Create / Read / Update payruns (hr_payroll_user + above)
 * - PAYROLL_MANAGER_ROLES: Destructive/final state transitions only (mark-paid, cancel)
 *   Restricted to hr_payroll_manager+ per business rules — hr_payroll_user is CRU only.
 */
const PAYROLL_CRU_ROLES = ["admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager"] as const;
const PAYROLL_MANAGER_ROLES = ["admin", "hr_payroll_manager"] as const;

/**
 * PAYSLIP read roles:
 * - HR roles can read all payslips.
 * - "employee" is included here; the controller applies an ownership filter
 *   (req.user.employeeId) so employees only ever see their own payslip records.
 */
const PAYSLIP_READ_ROLES = ["admin", "hr_manager", "hr_payroll_user", "hr_payroll_manager", "employee"] as const;

// ── Router for /payruns ────────────────────────────────────────────────────
export const payrunRouter = Router();

payrunRouter.use(clerkAuthMiddleware);

payrunRouter.get(
  "/",
  requireRole(...PAYROLL_CRU_ROLES),
  getPayruns,
);
payrunRouter.get(
  "/:id",
  requireRole(...PAYROLL_CRU_ROLES),
  getPayrunById,
);
payrunRouter.post(
  "/",
  requireRole(...PAYROLL_CRU_ROLES),
  createPayrun,
);
payrunRouter.post(
  "/:id/select-employees",
  requireRole(...PAYROLL_CRU_ROLES),
  selectEmployees,
);
payrunRouter.post(
  "/:id/compute",
  requireRole(...PAYROLL_CRU_ROLES),
  computePayrun,
);

// Validate is a CRU-level action — hr_payroll_user is included.
payrunRouter.patch(
  "/:id/validate",
  requireRole(...PAYROLL_CRU_ROLES),
  validatePayrun,
);
payrunRouter.post(
  "/:id/validate",
  requireRole(...PAYROLL_CRU_ROLES),
  validatePayrun,
);

// Mark-paid and Cancel are DESTRUCTIVE financial state transitions.
// Restricted to hr_payroll_manager and admin only (BUG-PAYROLL-1 fix).
payrunRouter.patch(
  "/:id/mark-paid",
  requireRole(...PAYROLL_MANAGER_ROLES),
  markPaidPayrun,
);
payrunRouter.post(
  "/:id/mark-paid",
  requireRole(...PAYROLL_MANAGER_ROLES),
  markPaidPayrun,
);
payrunRouter.post(
  "/:id/cancel",
  requireRole(...PAYROLL_MANAGER_ROLES),
  cancelPayrun,
);

// ── Router for /payslips ───────────────────────────────────────────────────
export const payslipRouter = Router();

payslipRouter.use(clerkAuthMiddleware);

// BUG-PAYSLIP-1 fix: hard route-level guard instead of auth-only.
// "employee" is included — the controller scopes results to their own employeeId.
payslipRouter.get("/", requireRole(...PAYSLIP_READ_ROLES), getPayslips);
payslipRouter.get("/:id", requireRole(...PAYSLIP_READ_ROLES), getPayslipById);
payslipRouter.post(
  "/:id/adjust",
  requireRole("admin", "hr_payroll_manager"),
  validateBody(adjustPayslipSchema),
  adjustPayslip,
);

