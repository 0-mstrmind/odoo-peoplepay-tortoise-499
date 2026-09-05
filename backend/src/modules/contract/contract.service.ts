import { StatusCodes } from "http-status-codes";

import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";

/**
 * Checks for temporal overlaps to prevent concurrent active contracts.
 */
const checkOverlap = async (
  companyId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date | null,
  excludeContractId?: string,
) => {
  const overlappingContract = await prisma.contract.findFirst({
    where: {
      companyId,
      employeeId,
      status: "active",
      deletedAt: null,
      id: excludeContractId ? { not: excludeContractId } : undefined,
      startDate: endDate ? { lte: endDate } : undefined,
      OR: [
        { endDate: null },
        { endDate: { gte: startDate } },
      ],
    },
  });

  if (overlappingContract) {
    throw new ApiError(StatusCodes.CONFLICT, "Employee already has an active contract overlapping this time period.");
  }
};

export const createContract = async (companyId: string, userId: string, data: any) => {
  if (data.status === "active") {
    await checkOverlap(companyId, data.employeeId, new Date(data.startDate), data.endDate ? new Date(data.endDate) : null);
  }

  return prisma.contract.create({
    data: {
      ...data,
      companyId,
      createdBy: userId,
    },
  });
};

export const getContracts = async (companyId: string, employeeId?: string) => {
  return prisma.contract.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(employeeId && { employeeId }),
    },
    orderBy: { startDate: "desc" },
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
  });
};

export const updateContract = async (companyId: string, contractId: string, data: any) => {
  const existing = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
  });

  if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, "Contract not found");

  const newStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
  const newEndDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;
  const newStatus = data.status || existing.status;

  if (newStatus === "active") {
    await checkOverlap(companyId, existing.employeeId, newStartDate, newEndDate, contractId);
  }

  return prisma.contract.update({
    where: { id: contractId },
    data,
  });
};
