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

export const createContract = async (companyId: string, userId: string, data: any, userRole?: string) => {
  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  // Only admin, super_admin, or hr_payroll_manager can directly activate a contract on creation
  const canDirectlyActivate = userRole === "admin" || userRole === "super_admin" || userRole === "hr_payroll_manager";
  const status = canDirectlyActivate ? (data.status || "draft") : "draft";

  if (status === "active") {
    await checkOverlap(companyId, data.employeeId, startDate, endDate);
  }

  let validCreatorId: string | null = null;
  if (userId) {
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (userExists) validCreatorId = userExists.id;
  }

  let contractReference = data.contractReference ? data.contractReference.trim() : "";
  if (!contractReference) {
    const emp = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { employeeCode: true },
    });
    const code = emp?.employeeCode || data.employeeId.slice(0, 5).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    contractReference = `CNT-${code}-${new Date().getFullYear()}-${rand}`;
  }

  const createData: any = {
    companyId,
    createdBy: validCreatorId,
    employeeId: data.employeeId,
    contractReference,
    startDate,
    endDate,
    wage: data.wage,
    currency: data.currency || "INR",
    payFrequency: data.payFrequency || "monthly",
    status,
    notes: data.notes ? data.notes.trim() : null,
  };

  if (data.departmentId && data.departmentId.trim()) {
    createData.departmentId = data.departmentId;
  }
  if (data.jobPositionId && data.jobPositionId.trim()) {
    createData.jobPositionId = data.jobPositionId;
  }
  if (data.scheduleId && data.scheduleId.trim()) {
    createData.scheduleId = data.scheduleId;
  }
  if (data.salaryStructureId && data.salaryStructureId.trim()) {
    createData.salaryStructureId = data.salaryStructureId;
  }

  return prisma.contract.create({
    data: createData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      department: { select: { id: true, name: true } },
      jobPosition: { select: { id: true, title: true } },
      schedule: { select: { id: true, name: true } },
      salaryStructure: { select: { id: true, name: true } },
    },
  });
};

export const getContracts = async (companyId: string, employeeId?: string, status?: string) => {
  return prisma.contract.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(employeeId && { employeeId }),
      ...(status && { status }),
    },
    orderBy: { startDate: "desc" },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      department: { select: { id: true, name: true } },
      jobPosition: { select: { id: true, title: true } },
      schedule: { select: { id: true, name: true } },
      salaryStructure: { select: { id: true, name: true } },
    },
  });
};

export const updateContract = async (companyId: string, contractId: string, data: any, userRole?: string) => {
  const existing = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
  });

  if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, "Contract not found");

  const newStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
  const newEndDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;
  const newStatus = data.status || existing.status;

  if (newStatus === "active") {
    const canActivate = userRole === "admin" || userRole === "super_admin" || userRole === "hr_payroll_manager";
    if (!canActivate && existing.status !== "active") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Only Admins and Payroll Managers have authority to activate contracts.");
    }
    await checkOverlap(companyId, existing.employeeId, newStartDate, newEndDate, contractId);
  }

  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = newStartDate;
  if (data.endDate !== undefined) updateData.endDate = newEndDate;
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId ? data.departmentId : null;
  if (data.jobPositionId !== undefined) updateData.jobPositionId = data.jobPositionId ? data.jobPositionId : null;
  if (data.scheduleId !== undefined) updateData.scheduleId = data.scheduleId ? data.scheduleId : null;
  if (data.salaryStructureId !== undefined) updateData.salaryStructureId = data.salaryStructureId ? data.salaryStructureId : null;

  return prisma.contract.update({
    where: { id: contractId },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      department: { select: { id: true, name: true } },
      jobPosition: { select: { id: true, title: true } },
      schedule: { select: { id: true, name: true } },
      salaryStructure: { select: { id: true, name: true } },
    },
  });
};
