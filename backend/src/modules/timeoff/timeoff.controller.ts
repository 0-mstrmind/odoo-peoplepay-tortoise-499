import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import sendResponse from "../../shared/utils/ApiResponse.js";
import ApiError from "../../shared/utils/ApiError.js";
import { prisma } from "../../core/config/prisma.js";
import { queryRequestSchema } from "./timeoff.validation.js";
import {
  listTimeOffTypesService,
  getTimeOffTypeByIdService,
  createTimeOffTypeService,
  updateTimeOffTypeService,
  deleteTimeOffTypeService,
  listAllocationsService,
  getAllocationByIdService,
  createAllocationService,
  approveAllocationService,
  refuseAllocationService,
  getEmployeeLeaveBalancesService,
  listRequestsService,
  getRequestByIdService,
  createRequestService,
  approveRequestService,
  refuseRequestService,
  updateRequestService,
  cancelRequestService,
} from "./timeoff.service.js";
import {
  emitTimeOffRequestCreated,
  emitTimeOffRequestApproved,
  emitTimeOffRequestRefused,
  emitTimeOffRequestCancelled,
  emitTimeOffRequestUpdated,
} from "../../socket/modules/timeoff/timeoff.socket.js";

// ==========================================
// 1. TIME OFF TYPES CONTROLLERS
// ==========================================

export const getTimeOffTypes = CatchAsync(async (req: Request, res: Response) => {
  const result = await listTimeOffTypesService(req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Leave types fetched successfully", { items: result });
});

export const getTimeOffTypeById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getTimeOffTypeByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Leave type fetched successfully", { item: result });
});

export const createTimeOffType = CatchAsync(async (req: Request, res: Response) => {
  const result = await createTimeOffTypeService(req.body, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Leave type created successfully", { item: result });
});

export const updateTimeOffType = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await updateTimeOffTypeService(id, req.body, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Leave type updated successfully", { item: result });
});

export const deleteTimeOffType = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await deleteTimeOffTypeService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Leave type deleted successfully", { item: result });
});

// ==========================================
// 2. ALLOCATIONS CONTROLLERS
// ==========================================

export const getTimeOffAllocations = CatchAsync(async (req: Request, res: Response) => {
  const query = {
    employeeId: req.query.employeeId as string | undefined,
    timeOffTypeId: req.query.timeOffTypeId as string | undefined,
    status: req.query.status as string | undefined,
  };
  const userRole = req.user?.role?.toLowerCase();
  let userEmployeeId = req.user?.employeeId;

  if (userRole === "employee" && !userEmployeeId && req.user?.id) {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id, deletedAt: null } });
    if (emp) userEmployeeId = emp.id;
  }

  const result = await listAllocationsService(query, req.user?.companyId, userRole, userEmployeeId);
  sendResponse(res, StatusCodes.OK, "Allocations fetched successfully", { items: result });
});

export const getTimeOffAllocationById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getAllocationByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Allocation fetched successfully", { item: result });
});

export const createTimeOffAllocation = CatchAsync(async (req: Request, res: Response) => {
  const result = await createAllocationService(req.body, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Allocation created successfully", { item: result });
});

export const approveTimeOffAllocation = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await approveAllocationService(id, userId, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Allocation approved successfully", { item: result });
});

export const refuseTimeOffAllocation = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await refuseAllocationService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Allocation refused successfully", { item: result });
});

export const getEmployeeLeaveBalances = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getEmployeeLeaveBalancesService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Leave balances fetched successfully", { items: result });
});

// ==========================================
// 3. REQUESTS CONTROLLERS
// ==========================================

export const getTimeOffRequests = CatchAsync(async (req: Request, res: Response) => {
  const query = queryRequestSchema.parse(req.query);
  const result = await listRequestsService(query, req.user, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off requests fetched successfully", { items: result });
});

export const getTimeOffRequestById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getRequestByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request fetched successfully", { item: result });
});

export const createTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.clerkUserId;
  const userRole = req.user?.role?.toLowerCase();
  let userEmployeeId = req.user?.employeeId;

  if (userRole === "employee" && !userEmployeeId && req.user?.id) {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id, deletedAt: null } });
    if (emp) userEmployeeId = emp.id;
  }

  // Regular employees can only submit time off requests for themselves
  if (userRole === "employee") {
    if (!userEmployeeId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "No employee record associated with this user account");
    }
    req.body.employeeId = userEmployeeId;
  }

  const result = await createRequestService(req.body, userId, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;
  const employeeUserId = (result as any).employee?.userId;

  const eventPayload = {
    requestId: result.id,
    employeeId: result.employeeId,
    employeeName,
    timeOffTypeId: result.timeOffTypeId,
    timeOffTypeName: (result as any).timeOffType?.name,
    startDate: result.startDate,
    endDate: result.endDate,
    duration: Number(result.duration),
    status: result.status as any,
    actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    timestamp: new Date().toISOString(),
  };

  if (result.status === "approved") {
    emitTimeOffRequestApproved(result.companyId, result.employeeId, employeeUserId, eventPayload);
  } else {
    emitTimeOffRequestCreated(result.companyId, result.employeeId, employeeUserId, eventPayload);
  }

  sendResponse(res, StatusCodes.CREATED, "Time off request submitted successfully", { item: result });
});

export const approveTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await approveRequestService(id, userId, req.user?.companyId);

  emitTimeOffRequestApproved(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      requestId: result.id,
      employeeId: result.employeeId,
      employeeName: (result as any).employee
        ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
        : undefined,
      timeOffTypeId: result.timeOffTypeId,
      timeOffTypeName: (result as any).timeOffType?.name,
      startDate: result.startDate,
      endDate: result.endDate,
      duration: Number(result.duration),
      status: "approved",
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Time off request approved successfully", { item: result });
});

export const refuseTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { refusalReason } = req.body || {};
  const result = await refuseRequestService(id, refusalReason, req.user?.companyId);

  emitTimeOffRequestRefused(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      requestId: result.id,
      employeeId: result.employeeId,
      employeeName: (result as any).employee
        ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
        : undefined,
      timeOffTypeId: result.timeOffTypeId,
      timeOffTypeName: (result as any).timeOffType?.name,
      startDate: result.startDate,
      endDate: result.endDate,
      duration: Number(result.duration),
      status: "refused",
      refusalReason: result.refusalReason,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Time off request refused successfully", { item: result });
});

export const updateTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await updateRequestService(id, req.body, req.user?.companyId);

  emitTimeOffRequestUpdated(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      requestId: result.id,
      employeeId: result.employeeId,
      employeeName: (result as any).employee
        ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
        : undefined,
      timeOffTypeId: result.timeOffTypeId,
      timeOffTypeName: (result as any).timeOffType?.name,
      startDate: result.startDate,
      endDate: result.endDate,
      duration: Number(result.duration),
      status: result.status as any,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Time off request updated successfully", { item: result });
});

export const cancelTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await cancelRequestService(id, req.user?.companyId);

  emitTimeOffRequestCancelled(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      requestId: result.id,
      employeeId: result.employeeId,
      employeeName: (result as any).employee
        ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
        : undefined,
      timeOffTypeId: result.timeOffTypeId,
      timeOffTypeName: (result as any).timeOffType?.name,
      startDate: result.startDate,
      endDate: result.endDate,
      duration: Number(result.duration),
      status: "cancelled",
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Time off request cancelled successfully", { item: result });
});
