import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createPayrunSchema = z.object({
  name: z.string().min(2, "Payrun name must be at least 2 characters long"),
  periodLabel: z.string().max(30).optional(),
  periodStart: z.string().regex(dateRegex, "periodStart must be YYYY-MM-DD format"),
  periodEnd: z.string().regex(dateRegex, "periodEnd must be YYYY-MM-DD format"),
  salaryStructureId: z.string().uuid("Invalid salary structure ID").optional().nullable(),
  employeeIds: z.array(z.string().uuid("Invalid employee ID")).optional(),
  notes: z.string().optional().nullable(),
});

export const updatePayrunSchema = z.object({
  name: z.string().min(2).optional(),
  periodLabel: z.string().max(30).optional().nullable(),
  salaryStructureId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const selectEmployeesSchema = z.object({
  employeeIds: z
    .array(z.string().uuid("Invalid employee ID"))
    .min(1, "At least one employee must be selected"),
});

export const queryPayrunSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
});

export const queryPayslipSchema = z.object({
  payrunId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
export type UpdatePayrunInput = z.infer<typeof updatePayrunSchema>;
export type SelectEmployeesInput = z.infer<typeof selectEmployeesSchema>;
export type QueryPayrunInput = z.infer<typeof queryPayrunSchema>;
export type QueryPayslipInput = z.infer<typeof queryPayslipSchema>;
