import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import {
  getMeService,
  listUsersService,
  loginService,
  updateUserRoleService,
  updateUserStatusService,
  updateMyProfileService,
  updateMyPasswordService,
} from "./auth.service.js";

export const login = CatchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginService(email, password);
  sendResponse(res, StatusCodes.OK, "Login successful", result);
});

export const getMe = CatchAsync(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.id);
  sendResponse(res, StatusCodes.OK, "User profile fetched successfully", { user });
});

export const updateMyProfile = CatchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, phone } = req.body;
  const user = await updateMyProfileService(req.user!.id, { firstName, lastName, phone });
  sendResponse(res, StatusCodes.OK, "Profile information updated successfully", { user });
});

export const updateMyPassword = CatchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await updateMyPasswordService(req.user!.id, { currentPassword, newPassword });
  sendResponse(res, StatusCodes.OK, "Password updated successfully", result);
});

export const listUsers = CatchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.role === "admin" ? undefined : req.user?.companyId || undefined;
  const users = await listUsersService(companyId);
  sendResponse(res, StatusCodes.OK, "Users retrieved successfully", { users });
});

export const updateUserRole = CatchAsync(async (req: Request, res: Response) => {
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role } = req.body;
  const companyId = req.user?.role === "admin" ? undefined : req.user?.companyId || undefined;
  const updatedUser = await updateUserRoleService(targetId, role, companyId);
  sendResponse(res, StatusCodes.OK, "User role updated successfully", { user: updatedUser });
});

export const updateUserStatus = CatchAsync(async (req: Request, res: Response) => {
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { isActive } = req.body;
  const companyId = req.user?.role === "admin" ? undefined : req.user?.companyId || undefined;
  const updatedUser = await updateUserStatusService(targetId, isActive, companyId);
  sendResponse(res, StatusCodes.OK, "User status updated successfully", { user: updatedUser });
});