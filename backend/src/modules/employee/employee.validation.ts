import { z } from "zod";

export const EmployeeTypeEnum = z.enum(["full_time", "part_time", "contract", "intern"]);
export const EmployeeStatusEnum = z.enum(["active", "inactive", "on_leave", "terminated"]);
export const UserRoleEnum = z.enum([
  "admin",
  "hr_manager",
  "hr_payroll_manager",
  "hr_payroll_user",
  "employee",
]);

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required").max(30),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  jobPositionId: z.string().uuid().optional().nullable(),
  scheduleId: z.string().uuid().optional().nullable(),
  employeeType: EmployeeTypeEnum.default("full_time"),
  status: EmployeeStatusEnum.default("active"),
  avatarUrl: z.string().url().or(z.literal("")).optional().nullable(),
  role: UserRoleEnum.optional(),
  createAccount: z.boolean().optional().default(false),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(30).optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  jobPositionId: z.string().uuid().optional().nullable(),
  scheduleId: z.string().uuid().optional().nullable(),
  employeeType: EmployeeTypeEnum.optional(),
  status: EmployeeStatusEnum.optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional().nullable(),
  role: UserRoleEnum.optional(),
});

export const createBankAccountSchema = z.object({
  bankName: z.string().trim().min(1, "Bank name is required").max(150),
  accountNumber: z.string().trim().min(1, "Account number is required").max(50),
  ifscCode: z.string().trim().max(20).optional().nullable(),
  accountHolderName: z.string().trim().max(150).optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
  isVerified: z.boolean().optional().default(false),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

export const queryEmployeeSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  jobPositionId: z.string().uuid().optional(),
  status: EmployeeStatusEnum.optional(),
  employeeType: EmployeeTypeEnum.optional(),
  withoutUser: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().max(20).optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
});

export const createJobPositionSchema = z.object({
  title: z.string().trim().min(1).max(150),
  code: z.string().trim().max(30).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type QueryEmployeeInput = z.infer<typeof queryEmployeeSchema>;
