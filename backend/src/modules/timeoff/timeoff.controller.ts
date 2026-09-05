import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import sendResponse from "../../shared/utils/ApiResponse.js";
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
  const result = await listAllocationsService(query, req.user?.companyId);
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
  const query = {
    employeeId: req.query.employeeId as string | undefined,
    status: req.query.status as string | undefined,
    timeOffTypeId: req.query.timeOffTypeId as string | undefined,
  };
  const result = await listRequestsService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off requests fetched successfully", { items: result });
});

export const getTimeOffRequestById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getRequestByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request fetched successfully", { item: result });
});

export const createTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await createRequestService(req.body, userId, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Time off request submitted successfully", { item: result });
});

export const approveTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await approveRequestService(id, userId, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request approved successfully", { item: result });
});

export const refuseTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { refusalReason } = req.body || {};
  const result = await refuseRequestService(id, refusalReason, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request refused successfully", { item: result });
});

export const updateTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await updateRequestService(id, req.body, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request updated successfully", { item: result });
});

export const cancelTimeOffRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await cancelRequestService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Time off request cancelled successfully", { item: result });
});
