import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import sendResponse from "../../shared/utils/ApiResponse.js";
import { prisma } from "../../core/config/prisma.js";
import {
  createPayrunSchema,
  selectEmployeesSchema,
  queryPayrunSchema,
  queryPayslipSchema,
} from "./payroll.validation.js";
import {
  createPayrunService,
  selectEmployeesService,
  computePayrunService,
  validatePayrunService,
  markPaidPayrunService,
  cancelPayrunService,
  listPayrunsService,
  getPayrunByIdService,
  listPayslipsService,
  getPayslipByIdService,
} from "./payroll.service.js";
import {
  emitPayrunStatusChanged,
  emitPayrunComputed,
  emitPayrunValidated,
  emitPayrunPaid,
} from "../../socket/modules/payroll/payroll.socket.js";

/**
 * 1. Create Payrun (Wizard Step 1 & Scope)
 */
export const createPayrun = CatchAsync(async (req: Request, res: Response) => {
  const input = createPayrunSchema.parse(req.body);
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await createPayrunService(input, userId, req.user?.companyId);

  emitPayrunStatusChanged(result.companyId, {
    payrunId: result.id,
    name: result.name,
    periodLabel: result.periodLabel,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    status: result.status,
    totalEmployees: result.totalEmployees,
    actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    timestamp: new Date().toISOString(),
  });

  sendResponse(res, StatusCodes.CREATED, "Payrun created successfully", { item: result });
});

/**
 * 2. Select Employees (Wizard Step 2)
 */
export const selectEmployees = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const input = selectEmployeesSchema.parse(req.body);
  const result = await selectEmployeesService(payrunId, input, req.user?.companyId);

  sendResponse(res, StatusCodes.OK, "Employees selected for payrun", { item: result });
});

/**
 * 3. Compute Payrun Batch
 */
export const computePayrun = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const result = await computePayrunService(payrunId, req.user?.companyId);

  emitPayrunComputed(result.companyId, {
    payrunId: result.id,
    name: result.name,
    periodLabel: result.periodLabel,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    status: result.status,
    totalGross: Number(result.totalGross),
    totalDeductions: Number(result.totalDeductions),
    totalNet: Number(result.totalNet),
    totalEmployees: result.totalEmployees,
    warningsCount: result.payrollWarnings ? result.payrollWarnings.length : 0,
    actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    timestamp: new Date().toISOString(),
  });

  sendResponse(res, StatusCodes.OK, "Payrun batch computed successfully", { item: result });
});

/**
 * 4. Validate Payrun Batch
 */
export const validatePayrun = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await validatePayrunService(payrunId, userId, req.user?.companyId);

  emitPayrunValidated(result.companyId, {
    payrunId: result.id,
    name: result.name,
    periodLabel: result.periodLabel,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    status: result.status,
    totalGross: Number(result.totalGross),
    totalDeductions: Number(result.totalDeductions),
    totalNet: Number(result.totalNet),
    totalEmployees: result.totalEmployees,
    actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    timestamp: new Date().toISOString(),
  });

  sendResponse(res, StatusCodes.OK, "Payrun validated successfully", { item: result });
});

/**
 * 5. Mark Payrun as Paid
 */
export const markPaidPayrun = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const result = await markPaidPayrunService(payrunId, req.user?.companyId);

  // Extract affected employee information for targeted private payslip availability alerts
  const employeePayslips = result.payslips.map((p) => ({
    employeeId: p.employeeId,
    employeeUserId: p.employee?.userId,
    payslipId: p.id,
    netSalary: Number(p.net),
    periodLabel: result.periodLabel,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
  }));

  emitPayrunPaid(
    result.companyId,
    {
      payrunId: result.id,
      name: result.name,
      periodLabel: result.periodLabel,
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
      status: result.status,
      totalGross: Number(result.totalGross),
      totalDeductions: Number(result.totalDeductions),
      totalNet: Number(result.totalNet),
      totalEmployees: result.totalEmployees,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
    employeePayslips,
  );

  sendResponse(res, StatusCodes.OK, "Payrun marked as paid and payslips finalized", { item: result });
});

/**
 * 6. Cancel Payrun
 */
export const cancelPayrun = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const result = await cancelPayrunService(payrunId, req.user?.companyId);

  emitPayrunStatusChanged(result.companyId, {
    payrunId: result.id,
    name: result.name,
    periodLabel: result.periodLabel,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    status: result.status,
    actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    timestamp: new Date().toISOString(),
  });

  sendResponse(res, StatusCodes.OK, "Payrun cancelled successfully", { item: result });
});

/**
 * 7. List Payruns
 */
export const getPayruns = CatchAsync(async (req: Request, res: Response) => {
  const query = queryPayrunSchema.parse(req.query);
  const result = await listPayrunsService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Payruns retrieved successfully", result);
});

/**
 * 8. Get Payrun by ID
 */
export const getPayrunById = CatchAsync(async (req: Request, res: Response) => {
  const payrunId = req.params.id as string;
  const result = await getPayrunByIdService(payrunId, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Payrun details retrieved successfully", { item: result });
});

/**
 * 9. List Payslips
 */
export const getPayslips = CatchAsync(async (req: Request, res: Response) => {
  const query = queryPayslipSchema.parse(req.query);

  // If regular employee, restrict query to own employee profile
  if (req.user?.role?.toLowerCase() === "employee") {
    let empId = req.user.employeeId;
    if (!empId && req.user.email) {
      const emp = await prisma.employee.findFirst({
        where: { OR: [{ email: req.user.email }, { userId: req.user.userId }], companyId: req.user.companyId || undefined, deletedAt: null },
      });
      if (emp) empId = emp.id;
    }
    if (empId) {
      query.employeeId = empId;
    }
  }

  const result = await listPayslipsService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Payslips retrieved successfully", result);
});

/**
 * 10. Get Payslip by ID with Breakdown
 */
export const getPayslipById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getPayslipByIdService(id, req.user?.companyId);

  // If regular employee, ensure they can only view their own payslip
  if (req.user?.role?.toLowerCase() === "employee") {
    let empId = req.user.employeeId;
    if (!empId && req.user.email) {
      const emp = await prisma.employee.findFirst({
        where: { OR: [{ email: req.user.email }, { userId: req.user.userId }], companyId: req.user.companyId || undefined, deletedAt: null },
      });
      if (emp) empId = emp.id;
    }
    if (empId && result.employeeId !== empId) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Forbidden: You cannot view another employee's payslip",
      });
      return;
    }
  }

  sendResponse(res, StatusCodes.OK, "Payslip details retrieved successfully", result);
});
