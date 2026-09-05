import { z } from "zod";

// Time Off Type Schemas
export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(20).optional(),
  unit: z.enum(["days", "hours"]).default("days"),
  requiresAllocation: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  payrollIntegration: z.boolean().default(false),
  color: z.string().max(10).optional(),
  maxConsecutiveDays: z.number().int().positive().optional(),
  carryForward: z.boolean().optional(),
  carryForwardLimit: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const updateTimeOffTypeSchema = createTimeOffTypeSchema.partial();

// Allocation Schemas
export const createAllocationSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  timeOffTypeId: z.string().uuid("Invalid leave type ID"),
  allocated: z.coerce.number().positive("Allocated amount must be positive"),
  validFrom: z.string().min(1, "validFrom is required"),
  validTo: z.string().min(1, "validTo is required"),
  notes: z.string().optional(),
});

export const queryAllocationSchema = z.object({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z.string().optional(),
});

// Request Schemas
export const createRequestSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  timeOffTypeId: z.string().uuid("Invalid leave type ID"),
  allocationId: z.string().uuid().optional(),
  startDate: z.string().min(1, "startDate is required"),
  endDate: z.string().min(1, "endDate is required"),
  halfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(["am", "pm"]).optional(),
  reason: z.string().optional(),
});

export const updateRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  halfDay: z.boolean().optional(),
  halfDayPeriod: z.enum(["am", "pm"]).optional(),
  reason: z.string().optional(),
});

export const queryRequestSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  timeOffTypeId: z.string().uuid().optional(),
});

export const refuseRequestSchema = z.object({
  refusalReason: z.string().optional(),
});

export type CreateTimeOffTypeInput = z.infer<typeof createTimeOffTypeSchema>;
export type UpdateTimeOffTypeInput = z.infer<typeof updateTimeOffTypeSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type QueryAllocationInput = z.infer<typeof queryAllocationSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type QueryRequestInput = z.infer<typeof queryRequestSchema>;
