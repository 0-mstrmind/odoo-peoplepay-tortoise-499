import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import {
  createWorkingScheduleSchema,
  updateWorkingScheduleSchema,
  assignScheduleSchema,
  queryWorkingScheduleSchema,
} from "./working-schedule.validation.js";
import {
  listWorkingSchedulesService,
  getWorkingScheduleByIdService,
  createWorkingScheduleService,
  updateWorkingScheduleService,
  deleteWorkingScheduleService,
  assignScheduleService,
} from "./working-schedule.service.js";

export const listWorkingSchedules = CatchAsync(async (req: Request, res: Response) => {
  const query = queryWorkingScheduleSchema.parse(req.query);
  const result = await listWorkingSchedulesService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Working schedules retrieved successfully", result);
});

export const getWorkingScheduleById = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const schedule = await getWorkingScheduleByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Working schedule details retrieved successfully", { schedule });
});

export const createWorkingSchedule = CatchAsync(async (req: Request, res: Response) => {
  const input = createWorkingScheduleSchema.parse(req.body);
  const schedule = await createWorkingScheduleService(input, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Working schedule created successfully", { schedule });
});

export const updateWorkingSchedule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateWorkingScheduleSchema.parse(req.body);
  const schedule = await updateWorkingScheduleService(id, input, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Working schedule updated successfully", { schedule });
});

export const deleteWorkingSchedule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = await deleteWorkingScheduleService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Working schedule deactivated successfully", { schedule: deleted });
});

export const assignSchedule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = assignScheduleSchema.parse(req.body);
  const result = await assignScheduleService(id, input, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Working schedule assigned successfully", result);
});
