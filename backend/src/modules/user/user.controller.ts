import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import {
  createUserSchema,
  updateUserSchema,
  queryUserSchema,
} from "./user.validation.js";
import {
  listUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
} from "./user.service.js";

export const getUsers = CatchAsync(async (req: Request, res: Response) => {
  const query = queryUserSchema.parse(req.query);
  const result = await listUsersService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Users retrieved successfully", result);
});

export const getUserById = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await getUserByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "User details retrieved successfully", result);
});

export const createUser = CatchAsync(async (req: Request, res: Response) => {
  // Support both camelCase and snake_case request body keys
  const body = {
    employeeId: req.body.employeeId || req.body.employee_id,
    email: req.body.email,
    role: req.body.role,
    isActive: req.body.isActive ?? req.body.is_active,
  };

  const input = createUserSchema.parse(body);
  const user = await createUserService(input, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "User account created successfully", { user });
});

export const updateUser = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = {
    role: req.body.role,
    isActive: req.body.isActive ?? req.body.is_active,
    email: req.body.email,
  };

  const input = updateUserSchema.parse(body);
  const user = await updateUserService(id, input, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "User access updated successfully", { user });
});

export const updateUserStatus = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const isActive = req.body.isActive ?? req.body.is_active ?? req.body.status === "ACTIVE";

  const user = await updateUserService(id, { isActive }, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "User status updated successfully", { user });
});
