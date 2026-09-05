import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import { resolveCompanyId } from "../employee/employee.service.js";
import type {
  CheckInInput,
  CheckOutInput,
  CreateAttendanceRequestInput,
  ReviewAttendanceRequestInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
  QueryAttendanceInput,
  TodayAttendanceSummaryInput,
} from "./attendance.validation.js";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Resolves employee ID from input or authenticated user
 */
const resolveEmployeeId = async (
  employeeIdInput?: string,
  user?: { id?: string; employeeId?: string | null; role?: string },
  companyId?: string,
): Promise<string> => {
  if (employeeIdInput) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeIdInput, ...(companyId ? { companyId } : {}), deletedAt: null },
    });
    if (!employee) throw new ApiError(StatusCodes.NOT_FOUND, "Specified employee not found");
    return employee.id;
  }

  if (user?.employeeId) {
    return user.employeeId;
  }

  if (user?.id) {
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id, ...(companyId ? { companyId } : {}), deletedAt: null },
    });
    if (employee) return employee.id;
  }

  throw new ApiError(StatusCodes.BAD_REQUEST, "Employee ID is required or no linked employee profile found");
};

/**
 * Computes worked hours, expected hours, and overtime hours from schedule
 */
export const calculateWorkedHours = async (
  employeeId: string,
  attendanceDate: Date,
  checkIn: Date,
  checkOut: Date,
) => {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const rawHours = Math.max(0, diffMs / (1000 * 60 * 60));

  let expectedHours = 8.0;
  let breakMinutes = 0;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      schedule: {
        include: { scheduleLines: true },
      },
    },
  });

  if (employee?.schedule?.scheduleLines && employee.schedule.scheduleLines.length > 0) {
    const dayOfWeek = DAY_NAMES[attendanceDate.getUTCDay()];
    const line = employee.schedule.scheduleLines.find(
      (l) => l.dayOfWeek.toLowerCase() === dayOfWeek,
    );

    if (line) {
      if (line.isDayOff) {
        expectedHours = 0;
      } else if (line.workDurationMinutes) {
        expectedHours = line.workDurationMinutes / 60;
      }
      breakMinutes = line.breakDurationMinutes || 0;
    }
  }

  const breakHours = breakMinutes / 60;
  const workedHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));
  const overtimeHours = Math.max(0, parseFloat((workedHours - expectedHours).toFixed(2)));

  return {
    workedHours,
    expectedHours: parseFloat(expectedHours.toFixed(2)),
    overtimeHours,
  };
};

/**
 * 1. Daily Check-In
 */
export const checkInService = async (
  input: CheckInInput,
  currentUser: { id?: string; employeeId?: string | null; role?: string },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const employeeId = await resolveEmployeeId(input.employeeId, currentUser, companyId);

  const checkInTime = input.checkInTime ? new Date(input.checkInTime) : new Date();
  const dateStr = input.attendanceDate || checkInTime.toISOString().split("T")[0];
  const attendanceDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Check if an attendance record already exists for this employee on this date
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      companyId,
      employeeId,
      attendanceDate,
      deletedAt: null,
    },
  });

  if (existingAttendance) {
    if (existingAttendance.checkOut) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "You have already completed your punch out for today. Punching in again on the same day is not permitted."
      );
    }
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Employee is already checked in for this date without checking out"
    );
  }

  const isEmployeeRole = currentUser?.role?.toLowerCase() === "employee";
  const initialStatus = isEmployeeRole ? "pending" : "present";

  return prisma.attendance.create({
    data: {
      companyId,
      employeeId,
      attendanceDate,
      checkIn: checkInTime,
      source: input.source || "system",
      status: initialStatus,
      isCorrected: false,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
    },
  });
};

/**
 * 2. Daily Check-Out
 */
export const checkOutService = async (
  input: CheckOutInput,
  currentUser: { id?: string; employeeId?: string | null; role?: string },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const employeeId = await resolveEmployeeId(input.employeeId, currentUser, companyId);

  const checkOutTime = input.checkOutTime ? new Date(input.checkOutTime) : new Date();

  // Find latest active check-in
  let attendance = input.attendanceId
    ? await prisma.attendance.findFirst({
        where: { id: input.attendanceId, companyId, employeeId, deletedAt: null },
      })
    : await prisma.attendance.findFirst({
        where: {
          companyId,
          employeeId,
          checkOut: null,
          deletedAt: null,
        },
        orderBy: { checkIn: "desc" },
      });

  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No active check-in record found to check out");
  }

  const checkInTime = attendance.checkIn || checkOutTime;
  if (checkOutTime < checkInTime) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Check-out time cannot be earlier than check-in time");
  }

  const { workedHours, expectedHours, overtimeHours } = await calculateWorkedHours(
    employeeId,
    attendance.attendanceDate,
    checkInTime,
    checkOutTime,
  );

  const isEmployeeRole = currentUser?.role?.toLowerCase() === "employee";

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: checkOutTime,
      workedHours,
      expectedHours,
      overtimeHours,
      status: isEmployeeRole ? "pending" : (workedHours < (expectedHours / 2) && expectedHours > 0 ? "half_day" : "present"),
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
    },
  });
};

/**
 * 3. Employee Attendance Request (Manual Entry / Correction Request)
 */
export const createAttendanceRequestService = async (
  input: CreateAttendanceRequestInput,
  currentUser: { id?: string; employeeId?: string | null; role?: string },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const employeeId = await resolveEmployeeId(input.employeeId, currentUser, companyId);

  const attendanceDate = new Date(`${input.attendanceDate}T00:00:00.000Z`);
  const checkIn = input.checkIn ? new Date(input.checkIn) : null;
  const checkOut = input.checkOut ? new Date(input.checkOut) : null;

  let workedHours = null;
  let expectedHours = null;
  let overtimeHours = 0;

  if (checkIn && checkOut) {
    if (checkOut < checkIn) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Check-out time cannot be earlier than check-in time");
    }
    const computed = await calculateWorkedHours(employeeId, attendanceDate, checkIn, checkOut);
    workedHours = computed.workedHours;
    expectedHours = computed.expectedHours;
    overtimeHours = computed.overtimeHours;
  }

  // Create attendance record flagged as pending correction / manual submission
  return prisma.attendance.create({
    data: {
      companyId,
      employeeId,
      attendanceDate,
      checkIn,
      checkOut,
      workedHours,
      expectedHours,
      overtimeHours,
      source: input.source || "manual",
      status: "pending",
      isCorrected: false,
      correctionReason: input.correctionReason || "Manual attendance request",
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
    },
  });
};

/**
 * 4. Accept / Approve Attendance Request (Manager / Admin)
 */
export const approveAttendanceRequestService = async (
  id: string,
  input: ReviewAttendanceRequestInput,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const attendance = await prisma.attendance.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { employee: true },
  });

  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attendance record not found");
  }

  const checkIn = input.checkIn ? new Date(input.checkIn) : attendance.checkIn;
  const checkOut = input.checkOut ? new Date(input.checkOut) : attendance.checkOut;

  let workedHours = attendance.workedHours ? Number(attendance.workedHours) : null;
  let expectedHours = attendance.expectedHours ? Number(attendance.expectedHours) : null;
  let overtimeHours = Number(attendance.overtimeHours || 0);

  if (checkIn && checkOut) {
    const computed = await calculateWorkedHours(
      attendance.employeeId,
      attendance.attendanceDate,
      checkIn,
      checkOut,
    );
    workedHours = computed.workedHours;
    expectedHours = computed.expectedHours;
    overtimeHours = computed.overtimeHours;
  }

  const reason = input.reviewNote
    ? `${attendance.correctionReason ? `${attendance.correctionReason} | ` : ""}Approved: ${input.reviewNote}`
    : attendance.correctionReason;

  return prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours,
      expectedHours,
      overtimeHours,
      status: input.status || "present",
      isCorrected: true,
      originalCheckIn: attendance.originalCheckIn || attendance.checkIn,
      originalCheckOut: attendance.originalCheckOut || attendance.checkOut,
      correctedBy: currentUserId || null,
      correctionReason: reason,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
      corrector: {
        select: { id: true, email: true, role: true },
      },
    },
  });
};

/**
 * 5. Decline / Refuse Attendance Request (Manager / Admin)
 */
export const refuseAttendanceRequestService = async (
  id: string,
  input: ReviewAttendanceRequestInput,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const attendance = await prisma.attendance.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attendance record not found");
  }

  const reason = input.reviewNote
    ? `Declined: ${input.reviewNote}${attendance.correctionReason ? ` (Orig: ${attendance.correctionReason})` : ""}`
    : `Declined attendance request${attendance.correctionReason ? `: ${attendance.correctionReason}` : ""}`;

  return prisma.attendance.update({
    where: { id },
    data: {
      status: "absent",
      isCorrected: false,
      correctedBy: currentUserId || null,
      correctionReason: reason,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
      corrector: {
        select: { id: true, email: true, role: true },
      },
    },
  });
};

/**
 * 6. List Attendances with Filtering & Pagination
 */
export const listAttendancesService = async (
  query: QueryAttendanceInput,
  currentUser?: { id?: string; employeeId?: string | null; role?: string },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const where: any = { companyId, deletedAt: null };

  const callerRole = currentUser?.role?.toLowerCase();
  if (callerRole === "employee" && currentUser) {
    let empId = currentUser.employeeId;
    if (!empId && currentUser.id) {
      const u = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { employeeId: true, linkedEmployee: { select: { id: true } } },
      });
      empId = u?.employeeId || u?.linkedEmployee?.id;
    }
    where.employeeId = empId || "00000000-0000-0000-0000-000000000000";
  } else if (query.employeeId) {
    where.employeeId = query.employeeId;
  }
  if (query.status) where.status = query.status;
  if (query.source) where.source = query.source;
  if (typeof query.isCorrected === "boolean") where.isCorrected = query.isCorrected;

  if (query.hasRequest) {
    where.OR = [
      { status: "pending" },
      { correctionReason: { not: null } },
      { source: "manual" },
    ];
  }

  if (query.requestStatus === "pending") {
    where.isCorrected = false;
    where.status = { not: "absent" };
    where.OR = [
      { status: "pending" },
      { correctionReason: { not: null } },
      { source: "manual" },
    ];
  } else if (query.requestStatus === "approved") {
    where.isCorrected = true;
  } else if (query.requestStatus === "refused") {
    where.status = "absent";
  }

  if (query.date) {
    where.attendanceDate = new Date(`${query.date}T00:00:00.000Z`);
  } else if (query.startDate || query.endDate) {
    where.attendanceDate = {};
    if (query.startDate) where.attendanceDate.gte = new Date(`${query.startDate}T00:00:00.000Z`);
    if (query.endDate) where.attendanceDate.lte = new Date(`${query.endDate}T23:59:59.999Z`);
  }

  // Employee relation conditions (department, manager filter, search)
  const employeeWhere: any = {};

  if (query.departmentId) {
    employeeWhere.departmentId = query.departmentId;
  }

  if (query.managerId) {
    employeeWhere.managerId = query.managerId;
  }

  const conditions: any[] = [];

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    conditions.push({
      OR: [
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { employeeCode: { contains: s, mode: "insensitive" } },
      ],
    });
  }

  if (conditions.length > 0) {
    employeeWhere.AND = conditions;
  }

  if (Object.keys(employeeWhere).length > 0) {
    where.employee = employeeWhere;
  }

  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            departmentId: true,
            managerId: true,
            department: { select: { id: true, name: true, code: true } },
            jobPosition: { select: { id: true, title: true, code: true } },
            manager: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        corrector: {
          select: { id: true, email: true },
        },
      },
      orderBy: { attendanceDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * 6B. Today's Attendance Summary (Present vs Absent Breakdown)
 */
export const getTodayAttendanceSummaryService = async (
  query: TodayAttendanceSummaryInput,
  currentUser?: { id?: string; employeeId?: string | null; role?: string },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const dateStr = query.date || new Date().toISOString().split("T")[0];
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Build employee filter scope (company, department, HR allotment, search)
  const empWhere: any = {
    companyId,
    deletedAt: null,
    status: "active",
  };

  if (query.departmentId) {
    empWhere.departmentId = query.departmentId;
  }

  const conditions: any[] = [];

  if (query.managerId) {
    conditions.push({ managerId: query.managerId });
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    conditions.push({
      OR: [
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { employeeCode: { contains: s, mode: "insensitive" } },
      ],
    });
  }

  if (conditions.length > 0) {
    empWhere.AND = conditions;
  }

  // 1. Fetch all matching in-scope employees and active departments
  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: empWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        email: true,
        departmentId: true,
        managerId: true,
        department: { select: { id: true, name: true, code: true } },
        jobPosition: { select: { id: true, title: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ departmentId: "asc" }, { firstName: "asc" }],
    }),
    prisma.department.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const employeeIds = employees.map((e) => e.id);

  // 2. Fetch today's attendance records for these employees
  const attendances = await prisma.attendance.findMany({
    where: {
      companyId,
      attendanceDate: targetDate,
      employeeId: { in: employeeIds },
      deletedAt: null,
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: { select: { id: true, name: true } },
          jobPosition: { select: { id: true, title: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const attendanceByEmpId = new Map(attendances.map((a) => [a.employeeId, a]));

  // 3. Separate into Present vs Absent
  const present: any[] = [];
  const absent: any[] = [];

  let lateCount = 0;
  let halfDayCount = 0;
  let onLeaveCount = 0;

  for (const emp of employees) {
    const att = attendanceByEmpId.get(emp.id);
    const isConfirmedPresent = att && att.status !== "absent" && att.status !== "pending";
    if (isConfirmedPresent) {
      if (att.status === "late") lateCount++;
      if (att.status === "half_day") halfDayCount++;
      if (att.status === "on_leave") onLeaveCount++;

      present.push({
        attendanceId: att.id,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || "General",
        departmentId: emp.departmentId,
        jobPosition: emp.jobPosition?.title || "Staff",
        checkIn: att.checkIn ? att.checkIn.toISOString() : null,
        checkOut: att.checkOut ? att.checkOut.toISOString() : null,
        workedHours: att.workedHours ? Number(att.workedHours) : 0,
        expectedHours: att.expectedHours ? Number(att.expectedHours) : 8,
        overtimeHours: att.overtimeHours ? Number(att.overtimeHours) : 0,
        status: att.status,
        managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
        isCorrected: att.isCorrected,
      });
    } else {
      absent.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        department: emp.department?.name || "General",
        departmentId: emp.departmentId,
        jobPosition: emp.jobPosition?.title || "Staff",
        status: att?.status === "on_leave" ? "on_leave" : "absent",
        managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
        attendanceId: att?.id || null,
      });
    }
  }

  const totalEmployees = employees.length;
  const presentCount = present.length;
  const absentCount = absent.length;
  const attendanceRate = totalEmployees > 0 ? parseFloat(((presentCount / totalEmployees) * 100).toFixed(1)) : 0;

  // Pending user attendance requests within in-scope employees
  const pendingRequestsCount = employeeIds.length > 0 ? await prisma.attendance.count({
    where: {
      companyId,
      employeeId: { in: employeeIds },
      deletedAt: null,
      isCorrected: false,
      status: { not: "absent" },
      OR: [
        { status: "pending" },
        { correctionReason: { not: null } },
        { source: "manual" },
      ],
    },
  }) : 0;

  return {
    date: dateStr,
    stats: {
      totalEmployees,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      onLeaveCount,
      attendanceRate,
      pendingRequestsCount,
    },
    present,
    absent,
    departments,
  };
};

/**
 * 7. Get Attendance by ID
 */
export const getAttendanceByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const attendance = await prisma.attendance.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, userId: true },
      },
      corrector: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attendance record not found");
  }

  return attendance;
};

/**
 * 8. Create Direct Attendance (Admin / HR)
 */
export const createAttendanceService = async (
  input: CreateAttendanceInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, companyId, deletedAt: null },
  });
  if (!employee) throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");

  const attendanceDate = new Date(`${input.attendanceDate}T00:00:00.000Z`);
  const checkIn = input.checkIn ? new Date(input.checkIn) : null;
  const checkOut = input.checkOut ? new Date(input.checkOut) : null;

  let workedHours = null;
  let expectedHours = null;
  let overtimeHours = 0;

  if (checkIn && checkOut) {
    const computed = await calculateWorkedHours(input.employeeId, attendanceDate, checkIn, checkOut);
    workedHours = computed.workedHours;
    expectedHours = computed.expectedHours;
    overtimeHours = computed.overtimeHours;
  }

  return prisma.attendance.create({
    data: {
      companyId,
      employeeId: input.employeeId,
      attendanceDate,
      checkIn,
      checkOut,
      workedHours,
      expectedHours,
      overtimeHours,
      source: input.source || "manual",
      status: input.status || "present",
      isCorrected: input.isCorrected || false,
      correctionReason: input.correctionReason || null,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
    },
  });
};

/**
 * 9. Update Direct Attendance (Admin / HR)
 */
export const updateAttendanceService = async (
  id: string,
  input: UpdateAttendanceInput,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const attendance = await getAttendanceByIdService(id, companyId);

  const checkIn = input.checkIn !== undefined ? (input.checkIn ? new Date(input.checkIn) : null) : attendance.checkIn;
  const checkOut = input.checkOut !== undefined ? (input.checkOut ? new Date(input.checkOut) : null) : attendance.checkOut;

  let workedHours = attendance.workedHours ? Number(attendance.workedHours) : null;
  let expectedHours = attendance.expectedHours ? Number(attendance.expectedHours) : null;
  let overtimeHours = Number(attendance.overtimeHours || 0);

  if (checkIn && checkOut) {
    const computed = await calculateWorkedHours(attendance.employeeId, attendance.attendanceDate, checkIn, checkOut);
    workedHours = computed.workedHours;
    expectedHours = computed.expectedHours;
    overtimeHours = computed.overtimeHours;
  }

  return prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours,
      expectedHours,
      overtimeHours,
      status: input.status || attendance.status,
      isCorrected: input.isCorrected !== undefined ? input.isCorrected : true,
      correctedBy: currentUserId || attendance.correctedBy,
      correctionReason: input.correctionReason !== undefined ? input.correctionReason : attendance.correctionReason,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
      },
    },
  });
};

/**
 * 10. Delete Attendance (Soft delete)
 */
export const deleteAttendanceService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  await getAttendanceByIdService(id, companyId);

  return prisma.attendance.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
