import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import sendResponse from "../../shared/utils/ApiResponse.js";
import {
  checkInSchema,
  checkOutSchema,
  createAttendanceRequestSchema,
  reviewAttendanceRequestSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  queryAttendanceSchema,
  todayAttendanceSummarySchema,
} from "./attendance.validation.js";
import {
  checkInService,
  checkOutService,
  createAttendanceRequestService,
  approveAttendanceRequestService,
  refuseAttendanceRequestService,
  listAttendancesService,
  getTodayAttendanceSummaryService,
  getAttendanceByIdService,
  createAttendanceService,
  updateAttendanceService,
  deleteAttendanceService,
} from "./attendance.service.js";
import {
  emitAttendanceCheckIn,
  emitAttendanceCheckOut,
  emitAttendanceRequestCreated,
  emitAttendanceRequestApproved,
  emitAttendanceRequestRefused,
  emitAttendanceUpdated,
} from "../../socket/modules/attendance/attendance.socket.js";

/**
 * 1. Check-In Endpoint
 */
export const checkIn = CatchAsync(async (req: Request, res: Response) => {
  const input = checkInSchema.parse(req.body);
  const result = await checkInService(input, req.user || {}, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;

  emitAttendanceCheckIn(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      employeeName,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      status: result.status,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.CREATED, "Check-in recorded successfully", { item: result });
});

/**
 * 2. Check-Out Endpoint
 */
export const checkOut = CatchAsync(async (req: Request, res: Response) => {
  const input = checkOutSchema.parse(req.body);
  const result = await checkOutService(input, req.user || {}, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;

  emitAttendanceCheckOut(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      employeeName,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      workedHours: result.workedHours ? Number(result.workedHours) : null,
      expectedHours: result.expectedHours ? Number(result.expectedHours) : null,
      overtimeHours: result.overtimeHours ? Number(result.overtimeHours) : 0,
      status: result.status,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Check-out recorded successfully", { item: result });
});

/**
 * 3. Employee Attendance Request (Manual Entry / Correction Request)
 */
export const createAttendanceRequest = CatchAsync(async (req: Request, res: Response) => {
  const input = createAttendanceRequestSchema.parse(req.body);
  const result = await createAttendanceRequestService(input, req.user || {}, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;

  emitAttendanceRequestCreated(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      employeeName,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      workedHours: result.workedHours ? Number(result.workedHours) : null,
      expectedHours: result.expectedHours ? Number(result.expectedHours) : null,
      overtimeHours: result.overtimeHours ? Number(result.overtimeHours) : 0,
      status: result.status,
      isCorrected: result.isCorrected,
      correctionReason: result.correctionReason,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.CREATED, "Attendance request submitted successfully", { item: result });
});

/**
 * 4. Accept / Approve Attendance Request (Manager / Admin)
 */
export const approveAttendanceRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const input = reviewAttendanceRequestSchema.parse(req.body);
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await approveAttendanceRequestService(id, input, userId, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;

  emitAttendanceRequestApproved(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      employeeName,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      workedHours: result.workedHours ? Number(result.workedHours) : null,
      expectedHours: result.expectedHours ? Number(result.expectedHours) : null,
      overtimeHours: result.overtimeHours ? Number(result.overtimeHours) : 0,
      status: result.status,
      isCorrected: result.isCorrected,
      correctionReason: result.correctionReason,
      correctedBy: result.correctedBy,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Attendance request accepted and record updated", { item: result });
});

/**
 * 5. Decline / Refuse Attendance Request (Manager / Admin)
 */
export const refuseAttendanceRequest = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const input = reviewAttendanceRequestSchema.parse(req.body);
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await refuseAttendanceRequestService(id, input, userId, req.user?.companyId);

  const employeeName = (result as any).employee
    ? `${(result as any).employee.firstName} ${(result as any).employee.lastName}`
    : undefined;

  emitAttendanceRequestRefused(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      employeeName,
      attendanceDate: result.attendanceDate,
      status: result.status,
      isCorrected: result.isCorrected,
      correctionReason: result.correctionReason,
      correctedBy: result.correctedBy,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Attendance request declined", { item: result });
});

/**
 * 6. List Attendances
 */
export const getAttendances = CatchAsync(async (req: Request, res: Response) => {
  const query = queryAttendanceSchema.parse(req.query);
  const result = await listAttendancesService(query, req.user, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Attendances fetched successfully", result);
});

/**
 * 6B. Get Today Attendance Summary (Present vs Absent Breakdown)
 */
export const getTodayAttendanceSummary = CatchAsync(async (req: Request, res: Response) => {
  const query = todayAttendanceSummarySchema.parse(req.query);
  const result = await getTodayAttendanceSummaryService(query, req.user, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Today's attendance summary fetched successfully", result);
});

/**
 * 7. Get Attendance by ID
 */
export const getAttendanceById = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await getAttendanceByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Attendance fetched successfully", { item: result });
});

/**
 * 8. Create Direct Attendance Record
 */
export const createAttendance = CatchAsync(async (req: Request, res: Response) => {
  const input = createAttendanceSchema.parse(req.body);
  const result = await createAttendanceService(input, req.user?.companyId);

  emitAttendanceUpdated(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      workedHours: result.workedHours ? Number(result.workedHours) : null,
      expectedHours: result.expectedHours ? Number(result.expectedHours) : null,
      overtimeHours: result.overtimeHours ? Number(result.overtimeHours) : 0,
      status: result.status,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.CREATED, "Attendance created successfully", { item: result });
});

/**
 * 9. Update Direct Attendance Record
 */
export const updateAttendance = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const input = updateAttendanceSchema.parse(req.body);
  const userId = req.user?.id || req.user?.clerkUserId;
  const result = await updateAttendanceService(id, input, userId, req.user?.companyId);

  emitAttendanceUpdated(
    result.companyId,
    result.employeeId,
    (result as any).employee?.userId,
    {
      attendanceId: result.id,
      employeeId: result.employeeId,
      attendanceDate: result.attendanceDate,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      workedHours: result.workedHours ? Number(result.workedHours) : null,
      expectedHours: result.expectedHours ? Number(result.expectedHours) : null,
      overtimeHours: result.overtimeHours ? Number(result.overtimeHours) : 0,
      status: result.status,
      isCorrected: result.isCorrected,
      correctionReason: result.correctionReason,
      actionBy: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
    },
  );

  sendResponse(res, StatusCodes.OK, "Attendance updated successfully", { item: result });
});

/**
 * 10. Delete Attendance Record
 */
export const deleteAttendance = CatchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await deleteAttendanceService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Attendance deleted successfully", { item: result });
});
