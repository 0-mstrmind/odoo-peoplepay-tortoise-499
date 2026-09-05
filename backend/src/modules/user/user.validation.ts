import { z } from "zod";

export const UserRoleEnum = z.enum([
  "EMPLOYEE",
  "HR_MANAGER",
  "HR_PAYROLL_USER",
  "HR_PAYROLL_MANAGER",
  "ADMIN",
]);

export const createUserSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  email: z.string().trim().email("Invalid work email address").max(255),
  role: UserRoleEnum.default("EMPLOYEE"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  role: UserRoleEnum.optional(),
  isActive: z.boolean().optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
});

export const queryUserSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "active", "inactive", "all"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type QueryUserInput = z.infer<typeof queryUserSchema>;
