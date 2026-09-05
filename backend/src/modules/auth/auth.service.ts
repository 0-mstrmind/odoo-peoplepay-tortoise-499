import { StatusCodes } from "http-status-codes";

import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      linkedEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: { select: { id: true, name: true } },
          jobPosition: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User profile not found");
  }

  return user;
};

export const listUsersService = async (companyId?: string) => {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
    },
    include: {
      company: { select: { id: true, name: true } },
      linkedEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateUserRoleService = async (targetUserId: string, role: string, companyId?: string) => {
  const allowedRoles = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user", "employee"];
  if (!allowedRoles.includes(role.toLowerCase())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid role. Must be one of: ${allowedRoles.join(", ")}`);
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
    },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: role.toLowerCase() },
  });
};

export const updateUserStatusService = async (targetUserId: string, isActive: boolean, companyId?: string) => {
  const existing = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
    },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
  });
};
