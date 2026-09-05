import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import { logger } from "../../core/config/logger.js";
import ApiError from "../../shared/utils/ApiError.js";
import { cacheService } from "../../redis/services/cache.service.js";
import { resolveCompanyId } from "../employee/employee.service.js";
import type {
  CreateWorkingScheduleInput,
  UpdateWorkingScheduleInput,
  AssignScheduleInput,
  QueryWorkingScheduleInput,
  ScheduleLineInput,
} from "./working-schedule.validation.js";

/**
 * Invalidate cached working schedules for a company
 */
export const invalidateScheduleCache = async (companyId: string): Promise<void> => {
  try {
    await cacheService.delByPattern(`schedule:*${companyId}*`);
    logger.debug(`[WorkingSchedule] Cache invalidated for company: ${companyId}`);
  } catch (err) {
    logger.warn(`[WorkingSchedule] Failed to invalidate cache: ${(err as Error).message}`);
  }
};

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

// Helper to convert time strings ("09:00", "18:00:00") or ISO timestamps to Date object for @db.Time column
export const parseTimeToDate = (timeStr?: string | null): Date | null => {
  if (!timeStr || !timeStr.trim()) return null;
  const trimmed = timeStr.trim();
  if (trimmed.includes("T")) {
    return new Date(trimmed);
  }
  const parts = trimmed.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
};

// Calculate line duration and total weekly hours automatically
export const processScheduleLines = (inputLines: ScheduleLineInput[]) => {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // If empty, generate standard 40-hour Monday-Friday 09:00-18:00 schedule with 60 min break
  const linesToProcess = inputLines && inputLines.length > 0
    ? inputLines
    : days.map((day) => {
        const isWeekend = day === "saturday" || day === "sunday";
        return {
          dayOfWeek: day as any,
          startTime: isWeekend ? null : "09:00",
          endTime: isWeekend ? null : "18:00",
          breakDurationMinutes: isWeekend ? 0 : 60,
          isDayOff: isWeekend,
        };
      });

  let totalWorkMinutes = 0;

  const processed = linesToProcess.map((line) => {
    if (line.isDayOff || !line.startTime || !line.endTime) {
      return {
        dayOfWeek: line.dayOfWeek.toLowerCase(),
        startTime: null,
        endTime: null,
        breakDurationMinutes: line.breakDurationMinutes || 0,
        workDurationMinutes: 0,
        isDayOff: true,
      };
    }

    const start = parseTimeToDate(line.startTime);
    const end = parseTimeToDate(line.endTime);

    if (!start || !end) {
      return {
        dayOfWeek: line.dayOfWeek.toLowerCase(),
        startTime: null,
        endTime: null,
        breakDurationMinutes: line.breakDurationMinutes || 0,
        workDurationMinutes: 0,
        isDayOff: true,
      };
    }

    const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    let endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    if (endMinutes < startMinutes) {
      // Overnight shift
      endMinutes += 24 * 60;
    }

    const rawMinutes = endMinutes - startMinutes;
    const breakMinutes = line.breakDurationMinutes || 0;
    const workDurationMinutes = Math.max(0, rawMinutes - breakMinutes);

    totalWorkMinutes += workDurationMinutes;

    return {
      dayOfWeek: line.dayOfWeek.toLowerCase(),
      startTime: start,
      endTime: end,
      breakDurationMinutes: breakMinutes,
      workDurationMinutes,
      isDayOff: false,
    };
  });

  // Sort Monday through Sunday
  processed.sort((a, b) => (DAY_ORDER[a.dayOfWeek] || 99) - (DAY_ORDER[b.dayOfWeek] || 99));

  const totalWeeklyHours = Number((totalWorkMinutes / 60).toFixed(2));

  return {
    processedLines: processed,
    totalWeeklyHours,
  };
};

// List working schedules with key metrics (PDF Section A3)
export const listWorkingSchedulesService = async (
  query: QueryWorkingScheduleInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const { search, scheduleType, isActive, page = 1, limit = 50 } = query;

  const skip = (page - 1) * limit;

  const where: any = {
    companyId,
    deletedAt: null,
  };

  if (scheduleType) {
    where.scheduleType = scheduleType;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.workingSchedule.count({ where }),
    prisma.workingSchedule.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            employees: { where: { deletedAt: null } },
            contracts: { where: { deletedAt: null } },
            scheduleLines: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      scheduleType: item.scheduleType,
      totalWeeklyHours: item.totalWeeklyHours ? Number(item.totalWeeklyHours) : 0,
      timezone: item.timezone,
      isActive: item.isActive,
      employeesCount: item._count.employees,
      contractsCount: item._count.contracts,
      linesCount: item._count.scheduleLines,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get single schedule with all 7 day lines and assignment details
export const getWorkingScheduleByIdService = async (
  id: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const cacheKey = `schedule:${companyId}:${id}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const schedule = await prisma.workingSchedule.findFirst({
        where: { id, companyId, deletedAt: null },
        include: {
          scheduleLines: true,
          employees: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              status: true,
              department: { select: { id: true, name: true } },
              jobPosition: { select: { id: true, title: true } },
            },
            take: 20,
          },
          contracts: {
            where: { deletedAt: null },
            select: {
              id: true,
              contractReference: true,
              status: true,
              wage: true,
              currency: true,
              startDate: true,
              endDate: true,
              employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
            },
            take: 20,
          },
          _count: {
            select: {
              employees: { where: { deletedAt: null } },
              contracts: { where: { deletedAt: null } },
            },
          },
        },
      });

      if (!schedule) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Working schedule not found");
      }

      // Sort lines Monday to Sunday
      const sortedLines = [...schedule.scheduleLines].sort(
        (a, b) => (DAY_ORDER[a.dayOfWeek.toLowerCase()] || 99) - (DAY_ORDER[b.dayOfWeek.toLowerCase()] || 99),
      );

      return {
        id: schedule.id,
        name: schedule.name,
        code: schedule.code,
        scheduleType: schedule.scheduleType,
        totalWeeklyHours: schedule.totalWeeklyHours ? Number(schedule.totalWeeklyHours) : 0,
        timezone: schedule.timezone,
        isActive: schedule.isActive,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        scheduleLines: sortedLines.map((line) => ({
          id: line.id,
          dayOfWeek: line.dayOfWeek,
          startTime: line.startTime ? line.startTime.toISOString().substring(11, 16) : null,
          endTime: line.endTime ? line.endTime.toISOString().substring(11, 16) : null,
          breakDurationMinutes: line.breakDurationMinutes,
          workDurationMinutes: line.workDurationMinutes,
          isDayOff: line.isDayOff,
        })),
        employeesCount: schedule._count.employees,
        contractsCount: schedule._count.contracts,
        assignedEmployees: schedule.employees,
        assignedContracts: schedule.contracts,
      };
    },
    7200, // 2 hours TTL
  );
};

// Create working schedule with automatic total weekly hours calculation
export const createWorkingScheduleService = async (
  input: CreateWorkingScheduleInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  // Check unique name per company
  const existingName = await prisma.workingSchedule.findFirst({
    where: { companyId, name: input.name, deletedAt: null },
  });
  if (existingName) {
    throw new ApiError(StatusCodes.CONFLICT, `Working schedule with name '${input.name}' already exists`);
  }

  if (input.code) {
    const existingCode = await prisma.workingSchedule.findFirst({
      where: { companyId, code: input.code, deletedAt: null },
    });
    if (existingCode) {
      throw new ApiError(StatusCodes.CONFLICT, `Working schedule code '${input.code}' is already in use`);
    }
  }

  const { processedLines, totalWeeklyHours } = processScheduleLines(input.scheduleLines || []);

  const created = await prisma.$transaction(
    async (tx) => {
      const schedule = await tx.workingSchedule.create({
        data: {
          companyId,
          name: input.name,
          code: input.code || null,
          scheduleType: input.scheduleType || "fixed",
          totalWeeklyHours,
          timezone: input.timezone || "Asia/Kolkata",
          isActive: true,
        },
      });

      if (processedLines.length > 0) {
        await tx.scheduleLine.createMany({
          data: processedLines.map((line) => ({
            companyId,
            scheduleId: schedule.id,
            dayOfWeek: line.dayOfWeek,
            startTime: line.startTime,
            endTime: line.endTime,
            breakDurationMinutes: line.breakDurationMinutes,
            workDurationMinutes: line.workDurationMinutes,
            isDayOff: line.isDayOff,
          })),
        });
      }

      return tx.workingSchedule.findUnique({
        where: { id: schedule.id },
        include: { scheduleLines: true },
      });
    },
    { timeout: 30000, maxWait: 15000 },
  );

  await invalidateScheduleCache(companyId);

  return created;
};

// Update working schedule and optionally replace schedule lines with automatic recalculation
export const updateWorkingScheduleService = async (
  id: string,
  input: UpdateWorkingScheduleInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const existing = await prisma.workingSchedule.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Working schedule not found");
  }

  // Check unique name if changed
  if (input.name && input.name !== existing.name) {
    const nameClash = await prisma.workingSchedule.findFirst({
      where: { companyId, name: input.name, deletedAt: null, id: { not: id } },
    });
    if (nameClash) {
      throw new ApiError(StatusCodes.CONFLICT, `Working schedule with name '${input.name}' already exists`);
    }
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      let updatedTotalHours = existing.totalWeeklyHours;

      if (input.scheduleLines) {
        const { processedLines, totalWeeklyHours } = processScheduleLines(input.scheduleLines);
        updatedTotalHours = totalWeeklyHours as any;

        // Replace schedule lines
        await tx.scheduleLine.deleteMany({ where: { scheduleId: id } });

        await tx.scheduleLine.createMany({
          data: processedLines.map((line) => ({
            companyId,
            scheduleId: id,
            dayOfWeek: line.dayOfWeek,
            startTime: line.startTime,
            endTime: line.endTime,
            breakDurationMinutes: line.breakDurationMinutes,
            workDurationMinutes: line.workDurationMinutes,
            isDayOff: line.isDayOff,
          })),
        });
      }

      const res = await tx.workingSchedule.update({
        where: { id },
        data: {
          name: input.name,
          code: input.code,
          scheduleType: input.scheduleType,
          timezone: input.timezone,
          isActive: input.isActive,
          totalWeeklyHours: updatedTotalHours,
        },
        include: { scheduleLines: true },
      });

      return res;
    },
    { timeout: 30000, maxWait: 15000 },
  );

  await invalidateScheduleCache(companyId);

  return updated;
};

// Soft delete working schedule
export const deleteWorkingScheduleService = async (
  id: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const existing = await prisma.workingSchedule.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
          contracts: { where: { deletedAt: null, status: "active" } },
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Working schedule not found");
  }

  if (existing._count.contracts > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot delete schedule '${existing.name}'. It is currently assigned to ${existing._count.contracts} active contract(s). Reassign them first.`,
    );
  }

  const deleted = await prisma.workingSchedule.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await invalidateScheduleCache(companyId);

  return deleted;
};

// Assign schedule to employees or contracts (PDF Section A3)
export const assignScheduleService = async (
  scheduleId: string,
  input: AssignScheduleInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const schedule = await prisma.workingSchedule.findFirst({
    where: { id: scheduleId, companyId, deletedAt: null },
  });

  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Working schedule not found");
  }

  const assignmentResult = await prisma.$transaction(
    async (tx) => {
      let employeesUpdated = 0;
      let contractsUpdated = 0;

      if (input.employeeIds && input.employeeIds.length > 0) {
        const empRes = await tx.employee.updateMany({
          where: {
            id: { in: input.employeeIds },
            companyId,
            deletedAt: null,
          },
          data: { scheduleId },
        });
        employeesUpdated = empRes.count;
      }

      if (input.contractIds && input.contractIds.length > 0) {
        const contRes = await tx.contract.updateMany({
          where: {
            id: { in: input.contractIds },
            companyId,
            deletedAt: null,
          },
          data: { scheduleId },
        });
        contractsUpdated = contRes.count;
      }

      return {
        scheduleId,
        scheduleName: schedule.name,
        employeesAssigned: employeesUpdated,
        contractsAssigned: contractsUpdated,
      };
    },
    { timeout: 30000, maxWait: 15000 },
  );

  await invalidateScheduleCache(companyId);

  return assignmentResult;
};
