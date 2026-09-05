import { z } from "zod";

export const ScheduleTypeEnum = z.enum(["fixed", "flexible", "shift"]);
export const DayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const scheduleLineInputSchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  startTime: z.string().trim().optional().nullable(),
  endTime: z.string().trim().optional().nullable(),
  breakDurationMinutes: z.number().int().min(0).default(0),
  isDayOff: z.boolean().default(false),
});

export const createWorkingScheduleSchema = z.object({
  name: z.string().trim().min(1, "Schedule name is required").max(150),
  code: z.string().trim().max(30).optional().nullable(),
  scheduleType: ScheduleTypeEnum.default("fixed"),
  timezone: z.string().trim().max(60).optional().default("Asia/Kolkata"),
  scheduleLines: z.array(scheduleLineInputSchema).optional().default([]),
});

export const updateWorkingScheduleSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  code: z.string().trim().max(30).optional().nullable(),
  scheduleType: ScheduleTypeEnum.optional(),
  timezone: z.string().trim().max(60).optional(),
  isActive: z.boolean().optional(),
  scheduleLines: z.array(scheduleLineInputSchema).optional(),
});

export const assignScheduleSchema = z.object({
  employeeIds: z.array(z.string().uuid()).optional().default([]),
  contractIds: z.array(z.string().uuid()).optional().default([]),
});

export const queryWorkingScheduleSchema = z.object({
  search: z.string().optional(),
  scheduleType: ScheduleTypeEnum.optional(),
  isActive: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type ScheduleLineInput = z.infer<typeof scheduleLineInputSchema>;
export type CreateWorkingScheduleInput = z.infer<typeof createWorkingScheduleSchema>;
export type UpdateWorkingScheduleInput = z.infer<typeof updateWorkingScheduleSchema>;
export type AssignScheduleInput = z.infer<typeof assignScheduleSchema>;
export type QueryWorkingScheduleInput = z.infer<typeof queryWorkingScheduleSchema>;
