import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" });

const optionalUuidSchema = z
  .string()
  .uuid("Invalid ID format")
  .nullish()
  .or(z.literal(""));

const contractBodyBase = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  contractReference: z.string().min(1, "Reference is required"),
  startDate: dateStringSchema,
  endDate: dateStringSchema.nullish().or(z.literal("")),
  departmentId: optionalUuidSchema,
  jobPositionId: optionalUuidSchema,
  scheduleId: optionalUuidSchema,
  wage: z.coerce.number().positive("Wage must be positive"),
  currency: z.string().default("INR"),
  payFrequency: z.enum(["monthly", "bi_weekly", "weekly"]).default("monthly"),
  salaryStructureId: optionalUuidSchema,
  status: z.enum(["draft", "active", "expired", "terminated"]).default("draft"),
  notes: z.string().nullish().or(z.literal("")),
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
