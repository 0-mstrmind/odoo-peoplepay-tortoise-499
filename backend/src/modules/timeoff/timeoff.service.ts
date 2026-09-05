import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import type {
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateAllocationInput,
  QueryAllocationInput,
  CreateRequestInput,
  UpdateRequestInput,
  QueryRequestInput,
} from "./timeoff.validation.js";

// Helper to resolve company context or default company
export const resolveCompanyId = async (providedCompanyId?: string | null): Promise<string> => {
  if (providedCompanyId) {
    const company = await prisma.company.findUnique({ where: { id: providedCompanyId } });
    if (company) return company.id;
  }

  let defaultCompany = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: "PeoplePay360 Inc.",
        slug: "peoplepay360",
        currency: "INR",
        industry: "Information Technology",
        country: "India",
        timezone: "Asia/Kolkata",
      },
    });
  }

  return defaultCompany.id;
};

// ==========================================
// 1. TIME OFF TYPES SERVICES
// ==========================================

export const listTimeOffTypesService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.timeOffType.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
};

export const getTimeOffTypeByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const leaveType = await prisma.timeOffType.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!leaveType) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Leave type not found");
  }
  return leaveType;
};

export const createTimeOffTypeService = async (input: CreateTimeOffTypeInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  // Check code uniqueness if provided
  if (input.code) {
    const existing = await prisma.timeOffType.findFirst({
      where: { companyId, code: input.code, deletedAt: null },
    });
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, `Leave type code '${input.code}' already exists`);
    }
  }

  return prisma.timeOffType.create({
    data: {
      companyId,
      ...input,
    },
  });
};

export const updateTimeOffTypeService = async (
  id: string,
  input: UpdateTimeOffTypeInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const leaveType = await getTimeOffTypeByIdService(id, companyId);

  if (input.code && input.code !== leaveType.code) {
    const existing = await prisma.timeOffType.findFirst({
      where: { companyId, code: input.code, deletedAt: null, id: { not: id } },
    });
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, `Leave type code '${input.code}' already exists`);
    }
  }

  return prisma.timeOffType.update({
    where: { id },
    data: input,
  });
};

export const deleteTimeOffTypeService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  await getTimeOffTypeByIdService(id, companyId);

  // Block deletion if referenced by any time_off_allocations or time_off_requests
  const [allocationCount, requestCount] = await Promise.all([
    prisma.timeOffAllocation.count({
      where: { timeOffTypeId: id, companyId, deletedAt: null },
    }),
    prisma.timeOffRequest.count({
      where: { timeOffTypeId: id, companyId, deletedAt: null },
    }),
  ]);

  if (allocationCount > 0 || requestCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete leave type that is referenced by existing allocations or requests",
    );
  }

  return prisma.timeOffType.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
};

// ==========================================
// 2. TIME OFF ALLOCATIONS SERVICES
// ==========================================

export const listAllocationsService = async (query: QueryAllocationInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const where: any = { companyId, deletedAt: null };

  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.timeOffTypeId) where.timeOffTypeId = query.timeOffTypeId;
  if (query.status) where.status = query.status;

  return prisma.timeOffAllocation.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true },
      },
      timeOffType: {
        select: { id: true, name: true, unit: true, requiresAllocation: true },
      },
      approver: {
        select: { id: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllocationByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const allocation = await prisma.timeOffAllocation.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      timeOffType: true,
      approver: { select: { id: true, email: true } },
    },
  });

  if (!allocation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Time off allocation not found");
  }

  return allocation;
};

export const createAllocationService = async (input: CreateAllocationInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  // Verify employee and leave type
  const [employee, leaveType] = await Promise.all([
    prisma.employee.findFirst({ where: { id: input.employeeId, companyId, deletedAt: null } }),
    prisma.timeOffType.findFirst({ where: { id: input.timeOffTypeId, companyId, deletedAt: null } }),
  ]);

  if (!employee) throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  if (!leaveType) throw new ApiError(StatusCodes.NOT_FOUND, "Leave type not found");

  const validFrom = new Date(input.validFrom);
  const validTo = new Date(input.validTo);

  if (validFrom > validTo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "validFrom date must be on or before validTo date");
  }

  const allocated = Number(input.allocated);

  return prisma.timeOffAllocation.create({
    data: {
      companyId,
      employeeId: input.employeeId,
      timeOffTypeId: input.timeOffTypeId,
      allocated,
      taken: 0,
      remaining: allocated,
      validFrom,
      validTo,
      status: "pending",
      notes: input.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      timeOffType: { select: { id: true, name: true, unit: true } },
    },
  });
};

export const approveAllocationService = async (
  id: string,
  approvedByUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const allocation = await getAllocationByIdService(id, companyId);

  if (allocation.status === "approved") {
    return allocation;
  }

  return prisma.timeOffAllocation.update({
    where: { id },
    data: {
      status: "approved",
      approvedBy: approvedByUserId || null,
      approvedAt: new Date(),
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true } },
    },
  });
};

export const refuseAllocationService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  await getAllocationByIdService(id, companyId);

  return prisma.timeOffAllocation.update({
    where: { id },
    data: {
      status: "refused",
    },
  });
};

export const getEmployeeLeaveBalancesService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId, deletedAt: null },
  });
  if (!employee) throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch active leave types
  const leaveTypes = await prisma.timeOffType.findMany({
    where: { companyId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });

  // Fetch approved allocations valid today
  const allocations = await prisma.timeOffAllocation.findMany({
    where: {
      companyId,
      employeeId,
      status: "approved",
      deletedAt: null,
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: today } }] },
        { OR: [{ validTo: null }, { validTo: { gte: today } }] },
      ],
    },
  });

  // Aggregate balance per leave type
  return leaveTypes.map((type) => {
    const matchingAllocations = allocations.filter((a) => a.timeOffTypeId === type.id);
    const allocated = matchingAllocations.reduce((acc, a) => acc + Number(a.allocated), 0);
    const taken = matchingAllocations.reduce((acc, a) => acc + Number(a.taken), 0);
    const remaining = matchingAllocations.reduce((acc, a) => acc + Number(a.remaining), 0);

    return {
      timeOffType: {
        id: type.id,
        name: type.name,
        code: type.code,
        unit: type.unit,
        requiresAllocation: type.requiresAllocation,
        approvalRequired: type.approvalRequired,
        payrollIntegration: type.payrollIntegration,
      },
      allocated,
      taken,
      remaining,
      activeAllocationsCount: matchingAllocations.length,
    };
  });
};

// ==========================================
// 3. TIME OFF REQUESTS & CORE BUSINESS LOGIC
// ==========================================

// Calculate duration in days or hours
export const calculateDuration = async (
  startDateStr: string,
  endDateStr: string,
  unit: string,
  halfDay?: boolean,
  employeeId?: string,
): Promise<number> => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "startDate must be on or before endDate");
  }

  // Days unit
  if (unit === "days") {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    let duration = days;
    if (halfDay) {
      duration = Math.max(0.5, duration - 0.5);
    }
    return duration;
  }

  // Hours unit
  let dailyHours = 8;
  if (employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { schedule: { include: { scheduleLines: true } } },
    });
    if (employee?.schedule?.scheduleLines && employee.schedule.scheduleLines.length > 0) {
      const activeWorkLines = employee.schedule.scheduleLines.filter((l) => !l.isDayOff);
      if (activeWorkLines.length > 0) {
        const avgMins =
          activeWorkLines.reduce((acc, l) => acc + (l.workDurationMinutes || 480), 0) / activeWorkLines.length;
        dailyHours = avgMins / 60;
      }
    }
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  let duration = days * dailyHours;
  if (halfDay) {
    duration = Math.max(dailyHours / 2, duration - dailyHours / 2);
  }
  return duration;
};

// Check for overlapping approved/pending requests
const checkForOverlappingRequests = async (
  employeeId: string,
  companyId: string,
  startDate: Date,
  endDate: Date,
  excludeRequestId?: string,
) => {
  const overlapping = await prisma.timeOffRequest.findFirst({
    where: {
      companyId,
      employeeId,
      deletedAt: null,
      status: { in: ["pending", "approved"] },
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
  });

  if (overlapping) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Overlapping leave request exists for this period");
  }
};

export const listRequestsService = async (query: QueryRequestInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const where: any = { companyId, deletedAt: null };

  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.timeOffTypeId) where.timeOffTypeId = query.timeOffTypeId;

  return prisma.timeOffRequest.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true },
      },
      timeOffType: {
        select: { id: true, name: true, unit: true, requiresAllocation: true, approvalRequired: true },
      },
      allocation: {
        select: { id: true, allocated: true, taken: true, remaining: true, validFrom: true, validTo: true },
      },
      approver: {
        select: { id: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getRequestByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const request = await prisma.timeOffRequest.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      timeOffType: true,
      allocation: true,
      approver: { select: { id: true, email: true } },
    },
  });

  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Time off request not found");
  }

  return request;
};

export const createRequestService = async (
  input: CreateRequestInput,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const [employee, timeOffType] = await Promise.all([
    prisma.employee.findFirst({ where: { id: input.employeeId, companyId, deletedAt: null } }),
    prisma.timeOffType.findFirst({ where: { id: input.timeOffTypeId, companyId, deletedAt: null } }),
  ]);

  if (!employee) throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  if (!timeOffType) throw new ApiError(StatusCodes.NOT_FOUND, "Leave type not found");

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  // 1. Check double-booking / overlap
  await checkForOverlappingRequests(input.employeeId, companyId, startDate, endDate);

  // 2. Compute duration
  const duration = await calculateDuration(
    input.startDate,
    input.endDate,
    timeOffType.unit,
    input.halfDay,
    input.employeeId,
  );

  let resolvedAllocationId: string | null = null;

  // 3. Allocation resolution & balance check if requiresAllocation = true
  if (timeOffType.requiresAllocation) {
    let allocation;
    if (input.allocationId) {
      allocation = await prisma.timeOffAllocation.findFirst({
        where: {
          id: input.allocationId,
          employeeId: input.employeeId,
          timeOffTypeId: input.timeOffTypeId,
          companyId,
          status: "approved",
          deletedAt: null,
        },
      });
    } else {
      // Resolve matching approved allocation valid for the period
      allocation = await prisma.timeOffAllocation.findFirst({
        where: {
          employeeId: input.employeeId,
          timeOffTypeId: input.timeOffTypeId,
          companyId,
          status: "approved",
          deletedAt: null,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: startDate } }] },
            { OR: [{ validTo: null }, { validTo: { gte: endDate } }] },
          ],
        },
        orderBy: { validTo: "asc" },
      });
    }

    if (!allocation) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "No valid allocation for this period.");
    }

    // Check validity range explicitly
    if (allocation.validFrom && startDate < allocation.validFrom) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Request start date falls outside allocation validFrom date.");
    }
    if (allocation.validTo && endDate > allocation.validTo) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Request end date falls outside allocation validTo date.");
    }

    // Check remaining balance
    if (Number(allocation.remaining) < duration) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient leave balance");
    }

    resolvedAllocationId = allocation.id;
  }

  // 4. Determine initial status & auto-approval
  const autoApprove = !timeOffType.approvalRequired;

  if (autoApprove) {
    // Transactionally create approved request and deduct allocation
    return prisma.$transaction(async (tx) => {
      if (resolvedAllocationId) {
        const allocations: any[] = await tx.$queryRaw`
          SELECT * FROM time_off_allocations WHERE id = ${resolvedAllocationId}::uuid FOR UPDATE
        `;
        const alloc = allocations[0];
        if (!alloc || alloc.status !== "approved" || Number(alloc.remaining) < duration) {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient leave balance");
        }

        const newTaken = Number(alloc.taken) + duration;
        const newRemaining = Number(alloc.allocated) - newTaken;

        await tx.timeOffAllocation.update({
          where: { id: resolvedAllocationId },
          data: {
            taken: newTaken,
            remaining: newRemaining,
          },
        });
      }

      return tx.timeOffRequest.create({
        data: {
          companyId,
          employeeId: input.employeeId,
          timeOffTypeId: input.timeOffTypeId,
          allocationId: resolvedAllocationId,
          startDate,
          endDate,
          duration,
          halfDay: input.halfDay || false,
          halfDayPeriod: input.halfDayPeriod || null,
          reason: input.reason,
          status: "approved",
          approvedBy: currentUserId || null,
          approvedAt: new Date(),
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
          timeOffType: { select: { id: true, name: true } },
          allocation: true,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });
  }

  return prisma.timeOffRequest.create({
    data: {
      companyId,
      employeeId: input.employeeId,
      timeOffTypeId: input.timeOffTypeId,
      allocationId: resolvedAllocationId,
      startDate,
      endDate,
      duration,
      halfDay: input.halfDay || false,
      halfDayPeriod: input.halfDayPeriod || null,
      reason: input.reason,
      status: "pending",
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
      timeOffType: { select: { id: true, name: true } },
      allocation: true,
    },
  });
};

export const approveRequestService = async (
  id: string,
  approvedByUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.timeOffRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { timeOffType: true, allocation: true },
    });

    if (!request) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Time off request not found");
    }

    if (request.status === "approved") {
      return request;
    }

    if (request.status !== "pending") {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot approve request with status '${request.status}'`);
    }

    const duration = Number(request.duration);

    // If allocation is linked, deduct balance atomically with row locking
    if (request.allocationId) {
      const allocations: any[] = await tx.$queryRaw`
        SELECT * FROM time_off_allocations WHERE id = ${request.allocationId}::uuid FOR UPDATE
      `;
      const alloc = allocations[0];

      if (!alloc || alloc.status !== "approved") {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Linked allocation is no longer active or approved");
      }

      if (Number(alloc.remaining) < duration) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient leave balance remaining in allocation");
      }

      const newTaken = Number(alloc.taken) + duration;
      const newRemaining = Number(alloc.allocated) - newTaken;

      await tx.timeOffAllocation.update({
        where: { id: request.allocationId },
        data: {
          taken: newTaken,
          remaining: newRemaining,
        },
      });
    }

    return tx.timeOffRequest.update({
      where: { id },
      data: {
        status: "approved",
        approvedBy: approvedByUserId || null,
        approvedAt: new Date(),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
        timeOffType: { select: { id: true, name: true } },
        allocation: true,
      },
    });
  }, { maxWait: 15000, timeout: 30000 });
};

export const refuseRequestService = async (
  id: string,
  refusalReason?: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const request = await getRequestByIdService(id, companyId);

  if (request.status !== "pending") {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot refuse request with status '${request.status}'`);
  }

  return prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: "refused",
      refusalReason: refusalReason || null,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
      timeOffType: { select: { id: true, name: true } },
    },
  });
};

export const updateRequestService = async (
  id: string,
  input: UpdateRequestInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const existing = await getRequestByIdService(id, companyId);

  if (existing.status !== "pending") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Time off requests can only be edited while pending approval");
  }

  const startDateStr = input.startDate || existing.startDate.toISOString().split("T")[0];
  const endDateStr = input.endDate || existing.endDate.toISOString().split("T")[0];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  await checkForOverlappingRequests(existing.employeeId, companyId, startDate, endDate, id);

  const timeOffType = await prisma.timeOffType.findUnique({ where: { id: existing.timeOffTypeId } });
  const duration = await calculateDuration(
    startDateStr,
    endDateStr,
    timeOffType?.unit || "days",
    input.halfDay ?? existing.halfDay,
    existing.employeeId,
  );

  let resolvedAllocationId = existing.allocationId;

  if (timeOffType?.requiresAllocation) {
    const allocation = await prisma.timeOffAllocation.findFirst({
      where: {
        employeeId: existing.employeeId,
        timeOffTypeId: existing.timeOffTypeId,
        companyId,
        status: "approved",
        deletedAt: null,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: startDate } }] },
          { OR: [{ validTo: null }, { validTo: { gte: endDate } }] },
        ],
      },
    });

    if (!allocation) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "No valid allocation for this period.");
    }
    if (Number(allocation.remaining) < duration) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient leave balance");
    }
    resolvedAllocationId = allocation.id;
  }

  return prisma.timeOffRequest.update({
    where: { id },
    data: {
      startDate,
      endDate,
      duration,
      halfDay: input.halfDay ?? existing.halfDay,
      halfDayPeriod: input.halfDayPeriod ?? existing.halfDayPeriod,
      reason: input.reason ?? existing.reason,
      allocationId: resolvedAllocationId,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
      timeOffType: { select: { id: true, name: true } },
      allocation: true,
    },
  });
};

export const cancelRequestService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.timeOffRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!request) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Time off request not found");
    }

    if (request.status === "cancelled") {
      return request;
    }

    // Reverse deduction if approved request is cancelled
    if (request.status === "approved" && request.allocationId) {
      const alloc = await tx.timeOffAllocation.findUnique({ where: { id: request.allocationId } });
      if (alloc) {
        const newTaken = Math.max(0, Number(alloc.taken) - Number(request.duration));
        const newRemaining = Number(alloc.allocated) - newTaken;

        await tx.timeOffAllocation.update({
          where: { id: request.allocationId },
          data: {
            taken: newTaken,
            remaining: newRemaining,
          },
        });
      }
    }

    return tx.timeOffRequest.update({
      where: { id },
      data: { status: "cancelled" },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
        timeOffType: { select: { id: true, name: true } },
      },
    });
  });
};
