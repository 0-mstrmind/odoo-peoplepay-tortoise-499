import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  QueryEmployeeInput,
} from "./employee.validation.js";

// Helper to resolve company context or default company
export const resolveCompanyId = async (providedCompanyId?: string | null): Promise<string> => {
  if (providedCompanyId) {
    const company = await prisma.company.findUnique({ where: { id: providedCompanyId } });
    if (company) return company.id;
  }

  // Fallback to first active company or create default
  let defaultCompany = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: "PeoplePay360 Inc.",
        slug: "peoplepay360",
        currency: "INR",
        industry: "Information Technology",
        country: "India",
        timezone: "Asia/Kolkata",
      },
    });
  }

  return defaultCompany.id;
};

// List employees with rich filters and smart count aggregation
export const listEmployeesService = async (
  query: QueryEmployeeInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const { search, departmentId, jobPositionId, status, employeeType, page = 1, limit = 50 } = query;

  const skip = (page - 1) * limit;

  const where: any = {
    companyId,
    deletedAt: null,
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (jobPositionId) {
    where.jobPositionId = jobPositionId;
  }

  if (status) {
    where.status = status;
  }

  if (employeeType) {
    where.employeeType = employeeType;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { employeeCode: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: {
        department: { select: { id: true, name: true, code: true } },
        jobPosition: { select: { id: true, title: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        schedule: { select: { id: true, name: true, scheduleType: true, totalWeeklyHours: true } },
        user: { select: { id: true, email: true, role: true, isActive: true } },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            timeOffRequests: true,
            payslips: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get single employee operational hub details with smart counts
export const getEmployeeByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const employee = await prisma.employee.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      department: true,
      jobPosition: true,
      manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
      schedule: {
        include: {
          scheduleLines: {
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
      subordinates: {
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: { select: { title: true } } },
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          clerkUserId: true,
        },
      },
      bankAccounts: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      contracts: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          contractReference: true,
          status: true,
          wage: true,
          currency: true,
          startDate: true,
          endDate: true,
        },
      },
      attendances: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { attendanceDate: "desc" },
        select: {
          id: true,
          attendanceDate: true,
          checkIn: true,
          checkOut: true,
          workedHours: true,
          status: true,
        },
      },
      timeOffRequests: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          duration: true,
          status: true,
          timeOffType: { select: { name: true, unit: true } },
        },
      },
      payslips: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { periodStart: "desc" },
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          net: true,
          currency: true,
          status: true,
        },
      },
      _count: {
        select: {
          contracts: { where: { deletedAt: null } },
          attendances: { where: { deletedAt: null } },
          timeOffRequests: { where: { deletedAt: null } },
          payslips: { where: { deletedAt: null } },
          timeOffAllocations: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  return {
    ...employee,
    smartCounts: {
      contracts: employee._count.contracts,
      attendance: employee._count.attendances,
      timeOff: employee._count.timeOffRequests,
      payslips: employee._count.payslips,
      allocations: employee._count.timeOffAllocations,
    },
  };
};

// Create new employee & optional user account / role assignment (Admin only for role assignment)
export const createEmployeeService = async (
  input: CreateEmployeeInput,
  caller: { role: string; id?: string; companyId?: string | null },
) => {
  const companyId = await resolveCompanyId(caller.companyId);

  // Check unique employeeCode
  const existingCode = await prisma.employee.findFirst({
    where: { companyId, employeeCode: input.employeeCode, deletedAt: null },
  });
  if (existingCode) {
    throw new ApiError(StatusCodes.CONFLICT, `Employee code '${input.employeeCode}' is already in use`);
  }

  // Check unique email
  const existingEmail = await prisma.employee.findFirst({
    where: { companyId, email: input.email, deletedAt: null },
  });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, `Employee with email '${input.email}' already exists`);
  }

  // Role assignment authorization check
  const isAdmin = caller.role.toLowerCase() === "admin";
  if (input.role && !isAdmin) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only administrators can assign user roles to employees");
  }

  const roleToAssign = isAdmin && input.role ? input.role : "employee";
  const shouldCreateUser = Boolean(input.role || input.createAccount);

  return prisma.$transaction(async (tx) => {
    let linkedUserId: string | null = null;

    if (shouldCreateUser) {
      // Find existing user or create a new system user
      let existingUser = await tx.user.findFirst({
        where: { email: input.email, deletedAt: null },
      });

      if (existingUser) {
        if (isAdmin && input.role) {
          existingUser = await tx.user.update({
            where: { id: existingUser.id },
            data: { role: roleToAssign, companyId },
          });
        }
        linkedUserId = existingUser.id;
      } else {
        const newUser = await tx.user.create({
          data: {
            companyId,
            email: input.email,
            role: roleToAssign,
            isActive: true,
          },
        });
        linkedUserId = newUser.id;
      }
    }

    const employee = await tx.employee.create({
      data: {
        companyId,
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : null,
        departmentId: input.departmentId || null,
        managerId: input.managerId || null,
        jobPositionId: input.jobPositionId || null,
        scheduleId: input.scheduleId || null,
        employeeType: input.employeeType || "full_time",
        status: input.status || "active",
        avatarUrl: input.avatarUrl || null,
        userId: linkedUserId,
      },
      include: {
        department: true,
        jobPosition: true,
        manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        schedule: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    if (linkedUserId) {
      await tx.user.update({
        where: { id: linkedUserId },
        data: { employeeId: employee.id },
      });
    }

    return employee;
  }, { timeout: 30000, maxWait: 15000 });
};

// Update employee & optional role promotion/update
export const updateEmployeeService = async (
  id: string,
  input: UpdateEmployeeInput,
  caller: { role: string; id?: string; companyId?: string | null },
) => {
  const companyId = await resolveCompanyId(caller.companyId);
  const isAdmin = caller.role.toLowerCase() === "admin";

  const existing = await prisma.employee.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { user: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  // If role is supplied and caller is not admin, reject
  if (input.role && !isAdmin) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only administrators can modify employee system access roles");
  }

  // Check unique code if changed
  if (input.employeeCode && input.employeeCode !== existing.employeeCode) {
    const codeClash = await prisma.employee.findFirst({
      where: { companyId, employeeCode: input.employeeCode, deletedAt: null, id: { not: id } },
    });
    if (codeClash) {
      throw new ApiError(StatusCodes.CONFLICT, `Employee code '${input.employeeCode}' is already in use`);
    }
  }

  // Check unique email if changed
  if (input.email && input.email !== existing.email) {
    const emailClash = await prisma.employee.findFirst({
      where: { companyId, email: input.email, deletedAt: null, id: { not: id } },
    });
    if (emailClash) {
      throw new ApiError(StatusCodes.CONFLICT, `Email '${input.email}' is already in use by another employee`);
    }
  }

  return prisma.$transaction(async (tx) => {
    let linkedUserId = existing.userId;

    // Admin updating role
    if (isAdmin && input.role) {
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { role: input.role },
        });
      } else {
        // Create user account linked to this employee
        const newUser = await tx.user.create({
          data: {
            companyId,
            email: input.email || existing.email,
            role: input.role,
            employeeId: existing.id,
            isActive: true,
          },
        });
        linkedUserId = newUser.id;
      }
    }

    const updated = await tx.employee.update({
      where: { id },
      data: {
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : undefined,
        departmentId: input.departmentId,
        managerId: input.managerId,
        jobPositionId: input.jobPositionId,
        scheduleId: input.scheduleId,
        employeeType: input.employeeType,
        status: input.status,
        avatarUrl: input.avatarUrl,
        userId: linkedUserId,
      },
      include: {
        department: true,
        jobPosition: true,
        manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        schedule: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    return updated;
  }, { timeout: 30000, maxWait: 15000 });
};

// Soft delete employee & deactivate linked user
export const deleteEmployeeService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const existing = await prisma.employee.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  return prisma.$transaction(async (tx) => {
    if (existing.userId) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { isActive: false, deletedAt: new Date() },
      });
    }

    return tx.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: "terminated" },
    });
  }, { timeout: 30000, maxWait: 15000 });
};

// Bank Accounts management
export const addBankAccountService = async (
  employeeId: string,
  input: CreateBankAccountInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId, deletedAt: null },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.employeeBankAccount.updateMany({
        where: { employeeId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return tx.employeeBankAccount.create({
      data: {
        companyId,
        employeeId,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode || null,
        accountHolderName: input.accountHolderName || `${employee.firstName} ${employee.lastName}`,
        isPrimary: input.isPrimary ?? false,
        isVerified: input.isVerified ?? false,
      },
    });
  }, { timeout: 30000, maxWait: 15000 });
};

export const updateBankAccountService = async (
  bankAccountId: string,
  input: UpdateBankAccountInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const bankAccount = await prisma.employeeBankAccount.findFirst({
    where: { id: bankAccountId, companyId, deletedAt: null },
  });

  if (!bankAccount) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bank account not found");
  }

  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.employeeBankAccount.updateMany({
        where: { employeeId: bankAccount.employeeId, isPrimary: true, id: { not: bankAccountId } },
        data: { isPrimary: false },
      });
    }

    return tx.employeeBankAccount.update({
      where: { id: bankAccountId },
      data: input,
    });
  }, { timeout: 30000, maxWait: 15000 });
};

export const deleteBankAccountService = async (bankAccountId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const bankAccount = await prisma.employeeBankAccount.findFirst({
    where: { id: bankAccountId, companyId, deletedAt: null },
  });

  if (!bankAccount) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bank account not found");
  }

  return prisma.employeeBankAccount.update({
    where: { id: bankAccountId },
    data: { deletedAt: new Date() },
  });
};

// Retrieve Master Data for Employee Form (Departments, Positions, Schedules, Managers)
export const getMasterDataService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  let [departments, jobPositions, schedules, managers] = await Promise.all([
    prisma.department.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.jobPosition.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true, title: true, code: true, departmentId: true },
      orderBy: { title: "asc" },
    }),
    prisma.workingSchedule.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, scheduleType: true, totalWeeklyHours: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { companyId, deletedAt: null, status: "active" },
      select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: { select: { title: true } } },
      orderBy: { firstName: "asc" },
    }),
  ]);

  // If no departments exist yet, provision standard starter entries so user forms are ready
  if (departments.length === 0) {
    const defaultDepts = await Promise.all([
      prisma.department.create({ data: { companyId, name: "Engineering", code: "ENG" } }),
      prisma.department.create({ data: { companyId, name: "Human Resources", code: "HR" } }),
      prisma.department.create({ data: { companyId, name: "Finance & Accounts", code: "FIN" } }),
      prisma.department.create({ data: { companyId, name: "Operations", code: "OPS" } }),
    ]);
    departments = defaultDepts.map((d) => ({ id: d.id, name: d.name, code: d.code }));

    const defaultPositions = await Promise.all([
      prisma.jobPosition.create({ data: { companyId, title: "Senior Software Engineer", code: "SSE", departmentId: departments[0].id } }),
      prisma.jobPosition.create({ data: { companyId, title: "HR Manager", code: "HRM", departmentId: departments[1].id } }),
      prisma.jobPosition.create({ data: { companyId, title: "Payroll Specialist", code: "PRS", departmentId: departments[2].id } }),
    ]);
    jobPositions = defaultPositions.map((p) => ({ id: p.id, title: p.title, code: p.code, departmentId: p.departmentId }));
  }

  // If no working schedule exists, provision standard 40hr schedule
  if (schedules.length === 0) {
    const defaultSchedule = await prisma.workingSchedule.create({
      data: {
        companyId,
        name: "Standard Full-Time (40 Hours)",
        code: "STD-40",
        scheduleType: "fixed",
        totalWeeklyHours: 40.0,
      },
    });
    schedules = [{ id: defaultSchedule.id, name: defaultSchedule.name, scheduleType: defaultSchedule.scheduleType, totalWeeklyHours: defaultSchedule.totalWeeklyHours }];
  }

  return {
    departments,
    jobPositions,
    schedules,
    managers,
  };
};

// Admin endpoint to explicitly update or assign role to an employee
export const updateEmployeeRoleService = async (
  employeeId: string,
  newRole: string,
  caller: { role: string; id?: string; companyId?: string | null },
) => {
  const allowedRoles = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user", "employee"];
  const normalizedRole = newRole.toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`);
  }

  const isAdmin = caller.role.toLowerCase() === "admin";
  if (!isAdmin) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only administrators are authorized to assign or modify user roles");
  }

  const companyId = await resolveCompanyId(caller.companyId);

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId, deletedAt: null },
    include: { user: true },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  return prisma.$transaction(async (tx) => {
    let user;

    if (employee.userId) {
      user = await tx.user.update({
        where: { id: employee.userId },
        data: { role: normalizedRole },
      });
    } else {
      // Check if user already exists with employee's email
      const existingUser = await tx.user.findFirst({
        where: { email: employee.email, deletedAt: null },
      });

      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: { role: normalizedRole, employeeId: employee.id },
        });
      } else {
        user = await tx.user.create({
          data: {
            companyId,
            email: employee.email,
            role: normalizedRole,
            employeeId: employee.id,
            isActive: true,
          },
        });
      }

      await tx.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });
    }

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: user.role,
      userId: user.id,
    };
  }, { timeout: 30000, maxWait: 15000 });
};

// Smart button related collections
export const getEmployeeContractsService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.contract.findMany({
    where: { employeeId, companyId, deletedAt: null },
    include: {
      salaryStructure: { select: { id: true, name: true, code: true } },
      jobPosition: { select: { id: true, title: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getEmployeeAttendancesService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.attendance.findMany({
    where: { employeeId, companyId, deletedAt: null },
    orderBy: { attendanceDate: "desc" },
    take: 100,
  });
};

export const getEmployeeTimeOffService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const [requests, allocations] = await Promise.all([
    prisma.timeOffRequest.findMany({
      where: { employeeId, companyId, deletedAt: null },
      include: { timeOffType: { select: { id: true, name: true, unit: true, color: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timeOffAllocation.findMany({
      where: { employeeId, companyId, deletedAt: null },
      include: { timeOffType: { select: { id: true, name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { requests, allocations };
};

export const getEmployeePayslipsService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.payslip.findMany({
    where: { employeeId, companyId, deletedAt: null },
    include: {
      payrun: { select: { id: true, name: true, periodLabel: true } },
      structure: { select: { id: true, name: true } },
    },
    orderBy: { periodStart: "desc" },
  });
};

export const getEmployeeBankAccountsService = async (employeeId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.employeeBankAccount.findMany({
    where: { employeeId, companyId, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
};

// Summary metrics & distribution for HR dashboard
export const getEmployeeStatsService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const [total, active, onLeave, inactive, terminated, byDepartment, byType] = await Promise.all([
    prisma.employee.count({ where: { companyId, deletedAt: null } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, status: "active" } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, status: "on_leave" } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, status: "inactive" } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, status: "terminated" } }),
    prisma.department.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { employees: { where: { deletedAt: null } } } },
      },
    }),
    prisma.employee.groupBy({
      by: ["employeeType"],
      where: { companyId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  return {
    total,
    active,
    onLeave,
    inactive,
    terminated,
    departmentBreakdown: byDepartment.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      count: d._count.employees,
    })),
    typeBreakdown: byType.map((t) => ({
      type: t.employeeType || "unassigned",
      count: t._count._all,
    })),
  };
};

// Master creation helpers
export const createDepartmentService = async (
  input: { name: string; code?: string | null; managerId?: string | null },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.department.create({
    data: {
      companyId,
      name: input.name,
      code: input.code || null,
      managerId: input.managerId || null,
    },
  });
};

export const createJobPositionService = async (
  input: { title: string; code?: string | null; departmentId?: string | null },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.jobPosition.create({
    data: {
      companyId,
      title: input.title,
      code: input.code || null,
      departmentId: input.departmentId || null,
    },
  });
};

export const createWorkingScheduleService = async (
  input: { name: string; code?: string | null; scheduleType?: string; totalWeeklyHours?: number },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  return prisma.workingSchedule.create({
    data: {
      companyId,
      name: input.name,
      code: input.code || null,
      scheduleType: input.scheduleType || "fixed",
      totalWeeklyHours: input.totalWeeklyHours ?? 40.0,
    },
  });
};
