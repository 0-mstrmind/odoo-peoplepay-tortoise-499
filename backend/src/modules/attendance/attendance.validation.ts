import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const checkInSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID").optional(),
  attendanceDate: z
    .string()
    .regex(dateRegex, "Date must be YYYY-MM-DD format")
    .optional(),
  checkInTime: z.string().datetime().optional(),
  source: z.enum(["system", "manual", "biometric", "mobile"]).default("system"),
});

export const checkOutSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID").optional(),
  employeeId: z.string().uuid("Invalid employee ID").optional(),
  checkOutTime: z.string().datetime().optional(),
});

export const createAttendanceRequestSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID").optional(),
  attendanceDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD format"),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  correctionReason: z.string().min(3, "Reason must be at least 3 characters long"),
  source: z.enum(["system", "manual", "biometric", "mobile"]).default("manual"),
});

export const reviewAttendanceRequestSchema = z.object({
  action: z.enum(["approve", "refuse"]).optional(),
  reviewNote: z.string().optional(),
  status: z
    .enum(["present", "late", "absent", "half_day", "on_leave", "holiday"])
    .optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
});

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  attendanceDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD format"),
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  source: z.enum(["system", "manual", "biometric", "mobile"]).default("manual"),
  status: z
    .enum(["present", "late", "absent", "half_day", "on_leave", "holiday"])
    .default("present"),
  isCorrected: z.boolean().default(false),
  correctionReason: z.string().optional().nullable(),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  status: z
    .enum(["present", "late", "absent", "half_day", "on_leave", "holiday"])
    .optional(),
  isCorrected: z.boolean().optional(),
  correctionReason: z.string().optional().nullable(),
});

export const queryAttendanceSchema = z.object({
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD format").optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  source: z.string().optional(),
  hasRequest: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  requestStatus: z.enum(["pending", "approved", "refused", "all"]).optional(),
  isCorrected: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
});

export const todayAttendanceSummarySchema = z.object({
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD format").optional(),
  search: z.string().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CreateAttendanceRequestInput = z.infer<typeof createAttendanceRequestSchema>;
export type ReviewAttendanceRequestInput = z.infer<typeof reviewAttendanceRequestSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type QueryAttendanceInput = z.infer<typeof queryAttendanceSchema>;
export type TodayAttendanceSummaryInput = z.infer<typeof todayAttendanceSummarySchema>;

