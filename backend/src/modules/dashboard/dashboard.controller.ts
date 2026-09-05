import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import {
  dashboardFilterSchema,
  resolveWarningSchema,
} from "./dashboard.validation.js";
import {
  getDashboardOverviewService,
  getSalaryTrendsService,
  getDepartmentBreakdownService,
  getAttendanceOverviewService,
  getOperationalAlertsService,
  resolveWarningService,
} from "./dashboard.service.js";

export const getDashboardOverview = CatchAsync(async (req: Request, res: Response) => {
  const filter = dashboardFilterSchema.parse(req.query);
  const result = await getDashboardOverviewService(filter, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Dashboard overview retrieved successfully", result);
});

export const getSalaryTrends = CatchAsync(async (req: Request, res: Response) => {
  const filter = dashboardFilterSchema.parse(req.query);
  const result = await getSalaryTrendsService(filter.monthsBack, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Salary trends retrieved successfully", result);
});

export const getDepartmentBreakdown = CatchAsync(async (req: Request, res: Response) => {
  const result = await getDepartmentBreakdownService(req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Department breakdown retrieved successfully", result);
});

export const getAttendanceOverview = CatchAsync(async (req: Request, res: Response) => {
  const filter = dashboardFilterSchema.parse(req.query);
  const result = await getAttendanceOverviewService(filter, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Attendance overview retrieved successfully", { attendance: result });
});

export const getOperationalAlerts = CatchAsync(async (req: Request, res: Response) => {
  const result = await getOperationalAlertsService(req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Operational alerts retrieved successfully", result);
});

export const resolveWarning = CatchAsync(async (req: Request, res: Response) => {
  const warningId = Array.isArray(req.params.warningId) ? req.params.warningId[0] : req.params.warningId;
  const input = resolveWarningSchema.parse(req.body);
  const result = await resolveWarningService(warningId, input, req.user?.id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Payroll warning resolved successfully", { warning: result });
});
