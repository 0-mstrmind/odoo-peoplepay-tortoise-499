import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import { emitCheck } from "../../socket/emitter.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createBankAccountSchema,
  updateBankAccountSchema,
  queryEmployeeSchema,
  createDepartmentSchema,
  createJobPositionSchema,
} from "./employee.validation.js";
import {
  listEmployeesService,
  getEmployeeByIdService,
  createEmployeeService,
  updateEmployeeService,
  deleteEmployeeService,
  updateEmployeeRoleService,
  getEmployeeContractsService,
  getEmployeeAttendancesService,
  getEmployeeTimeOffService,
  getEmployeePayslipsService,
  getEmployeeBankAccountsService,
  getEmployeeStatsService,
  addBankAccountService,
  updateBankAccountService,
  deleteBankAccountService,
  getMasterDataService,
  createDepartmentService,
  createJobPositionService,
  createWorkingScheduleService,
  getMyEmployeeProfileService,
} from "./employee.service.js";

export const getMyEmployeeProfile = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userEmployeeId = req.user?.employeeId;
  const userEmail = req.user?.email;
  const employee = await getMyEmployeeProfileService(userId, userEmployeeId, userEmail, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Logged in employee profile retrieved successfully", { employee });
});

export const getEmployees = CatchAsync(async (req: Request, res: Response) => {
  const query = queryEmployeeSchema.parse(req.query);
  const result = await listEmployeesService(query, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employees retrieved successfully", result);
});

export const getEmployeeById = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const employee = await getEmployeeByIdService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee details retrieved successfully", { employee });
});

export const createEmployee = CatchAsync(async (req: Request, res: Response) => {
  const input = createEmployeeSchema.parse(req.body);
  const employee = await createEmployeeService(input, {
    role: req.user?.role || "employee",
    id: req.user?.id,
    companyId: req.user?.companyId,
  });

  // Emit real-time notification to company room
  emitCheck({
    message: `Employee created: ${employee.firstName} ${employee.lastName}`,
    payload: { id: employee.id, employeeCode: employee.employeeCode },
    target: { companyId: employee.companyId },
  });

  sendResponse(res, StatusCodes.CREATED, "Employee created successfully", { employee });
});

export const updateEmployee = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateEmployeeSchema.parse(req.body);
  const employee = await updateEmployeeService(id, input, {
    role: req.user?.role || "employee",
    id: req.user?.id,
    companyId: req.user?.companyId,
  });
  sendResponse(res, StatusCodes.OK, "Employee updated successfully", { employee });
});

export const deleteEmployee = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = await deleteEmployeeService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee deactivated successfully", { employee: deleted });
});

export const updateEmployeeRole = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role } = req.body;
  const result = await updateEmployeeRoleService(id, role, {
    role: req.user?.role || "employee",
    id: req.user?.id,
    companyId: req.user?.companyId,
  });
  sendResponse(res, StatusCodes.OK, "Employee role updated successfully", result);
});

// Smart button sub-resources
export const getEmployeeContracts = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const contracts = await getEmployeeContractsService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee contracts retrieved successfully", { contracts });
});

export const getEmployeeAttendances = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const attendances = await getEmployeeAttendancesService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee attendances retrieved successfully", { attendances });
});

export const getEmployeeTimeOff = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const timeOff = await getEmployeeTimeOffService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee time off records retrieved successfully", timeOff);
});

export const getEmployeePayslips = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payslips = await getEmployeePayslipsService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee payslips retrieved successfully", { payslips });
});

export const getEmployeeBankAccounts = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const bankAccounts = await getEmployeeBankAccountsService(id, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee bank accounts retrieved successfully", { bankAccounts });
});

export const addBankAccount = CatchAsync(async (req: Request, res: Response) => {
  const employeeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = createBankAccountSchema.parse(req.body);
  const bankAccount = await addBankAccountService(employeeId, input, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Bank account added successfully", { bankAccount });
});

export const updateBankAccount = CatchAsync(async (req: Request, res: Response) => {
  const bankAccountId = Array.isArray(req.params.bankAccountId) ? req.params.bankAccountId[0] : req.params.bankAccountId;
  const input = updateBankAccountSchema.parse(req.body);
  const bankAccount = await updateBankAccountService(bankAccountId, input, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Bank account updated successfully", { bankAccount });
});

export const deleteBankAccount = CatchAsync(async (req: Request, res: Response) => {
  const bankAccountId = Array.isArray(req.params.bankAccountId) ? req.params.bankAccountId[0] : req.params.bankAccountId;
  const deleted = await deleteBankAccountService(bankAccountId, req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Bank account removed successfully", { bankAccount: deleted });
});

// Meta routes
export const getMasterData = CatchAsync(async (req: Request, res: Response) => {
  const masterData = await getMasterDataService(req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Master data retrieved successfully", masterData);
});

export const getEmployeeStats = CatchAsync(async (req: Request, res: Response) => {
  const stats = await getEmployeeStatsService(req.user?.companyId);
  sendResponse(res, StatusCodes.OK, "Employee stats retrieved successfully", stats);
});

export const createDepartment = CatchAsync(async (req: Request, res: Response) => {
  const input = createDepartmentSchema.parse(req.body);
  const dept = await createDepartmentService(input, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Department created successfully", { department: dept });
});

export const createJobPosition = CatchAsync(async (req: Request, res: Response) => {
  const input = createJobPositionSchema.parse(req.body);
  const position = await createJobPositionService(input, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Job position created successfully", { jobPosition: position });
});

export const createWorkingSchedule = CatchAsync(async (req: Request, res: Response) => {
  const schedule = await createWorkingScheduleService(req.body, req.user?.companyId);
  sendResponse(res, StatusCodes.CREATED, "Working schedule created successfully", { schedule });
});
