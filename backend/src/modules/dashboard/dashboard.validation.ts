import { z } from "zod";
import { EmployeeTypeEnum } from "../employee/employee.validation.js";

export const dashboardFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  employeeType: EmployeeTypeEnum.optional(),
  monthsBack: z.coerce.number().int().min(1).max(24).default(6),
});

export const resolveWarningSchema = z.object({
  resolutionNotes: z.string().trim().max(500).optional(),
});

export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
export type ResolveWarningInput = z.infer<typeof resolveWarningSchema>;
