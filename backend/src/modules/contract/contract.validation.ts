import { z } from "zod";

const contractBodyBase = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  contractReference: z.string().min(1, "Reference is required"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  departmentId: z.string().uuid("Invalid department ID").optional(),
  jobPositionId: z.string().uuid("Invalid position ID").optional(),
  scheduleId: z.string().uuid("Invalid schedule ID").optional(),
  wage: z.number().positive("Wage must be positive"),
  currency: z.string().default("INR"),
  payFrequency: z.enum(["monthly", "bi_weekly", "weekly"]),
  salaryStructureId: z.string().uuid("Invalid salary structure ID").optional(),
  status: z.enum(["draft", "active", "expired", "terminated"]).default("draft"),
  notes: z.string().optional(),
});

export const createContractSchema = z.object({
  body: contractBodyBase.refine(
    (data) => !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "endDate cannot be earlier than startDate",
      path: ["endDate"],
    },
  ),
});

export const updateContractSchema = z.object({
  body: contractBodyBase.partial().refine(
    (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "endDate cannot be earlier than startDate",
      path: ["endDate"],
    },
  ),
  params: z.object({
    id: z.string().uuid("Invalid contract ID"),
  }),
});
