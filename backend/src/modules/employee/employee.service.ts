import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import { logger } from "../../core/config/logger.js";
import ApiError from "../../shared/utils/ApiError.js";
import { cacheService } from "../../redis/services/cache.service.js";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  QueryEmployeeInput,
} from "./employee.validation.js";

// Helper to resolve company context or default company with Redis cache
export const resolveCompanyId = async (providedCompanyId?: string | null): Promise<string> => {
  const cacheKey = `company:id:${providedCompanyId || "default"}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      if (providedCompanyId) {
        const company = await prisma.company.findUnique({
          where: { id: providedCompanyId },
          select: { id: true },
        });
        if (company) return company.id;
      }

      // Fallback to first active company or create default
      let defaultCompany = await prisma.company.findFirst({
        where: { deletedAt: null },
        select: { id: true },
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
    },
    3600, // 1 hour TTL
  );
};

/**
 * Invalidate cached company metadata
 */
export const invalidateCompanyCache = async (companyId?: string): Promise<void> => {
  try {
    if (companyId) {
      await cacheService.del(`company:id:${companyId}`, "company:id:default");
    } else {
      await cacheService.delByPattern("company:id:*");
    }
    logger.debug(`[Company] Cache invalidated for: ${companyId || "all"}`);
  } catch (err) {
    logger.warn(`[Company] Failed to invalidate cache: ${(err as Error).message}`);
  }
};

/**
 * Invalidate cached employee profile and master data
 */
export const invalidateEmployeeCache = async (companyId: string, employeeId?: string): Promise<void> => {
  try {
    if (employeeId) {
      await cacheService.del(`employee:${companyId}:${employeeId}`);
    }
    await cacheService.del(`employee:masters:${companyId}`);
    await cacheService.delByPattern(`employee:masters:*`);
    logger.debug(`[Employee] Cache invalidated for company ${companyId}, employee ${employeeId || "all"}`);
  } catch (err) {
    logger.warn(`[Employee] Failed to invalidate cache: ${(err as Error).message}`);
  }
};

/**
 * Ensures standard departments, positions, and starter employee/HR staff exist for a company.
 * Automatically links any company users (like Admin) to an active employee record in this company.
 */
export const ensureCompanyStarterStaff = async (companyId: string): Promise<void> => {
  try {
    // 1. Ensure standard departments exist
    let depts = await prisma.department.findMany({
      where: { companyId, deletedAt: null },
    });
    if (depts.length === 0) {
      depts = await Promise.all([
        prisma.department.create({ data: { companyId, name: "Engineering", code: "ENG" } }),
        prisma.department.create({ data: { companyId, name: "Human Resources", code: "HR" } }),
        prisma.department.create({ data: { companyId, name: "Finance & Accounts", code: "FIN" } }),
        prisma.department.create({ data: { companyId, name: "Operations", code: "OPS" } }),
      ]);
    }
    const hrDept = depts.find((d) => d.code === "HR" || d.name.toLowerCase().includes("human")) || depts[0];
    const engDept = depts.find((d) => d.code === "ENG" || d.name.toLowerCase().includes("eng")) || depts[0];
    const finDept = depts.find((d) => d.code === "FIN" || d.name.toLowerCase().includes("fin")) || depts[0];
    const opsDept = depts.find((d) => d.code === "OPS" || d.name.toLowerCase().includes("ops")) || depts[0];

    // 2. Ensure standard positions exist
    let positions = await prisma.jobPosition.findMany({
      where: { companyId, deletedAt: null },
    });
    if (positions.length === 0) {
      positions = await Promise.all([
        prisma.jobPosition.create({ data: { companyId, title: "Senior Software Engineer", code: "SSE", departmentId: engDept.id } }),
        prisma.jobPosition.create({ data: { companyId, title: "HR Manager", code: "HRM", departmentId: hrDept.id } }),
        prisma.jobPosition.create({ data: { companyId, title: "Payroll Specialist", code: "PRS", departmentId: finDept.id } }),
      ]);
    }
    const hrRole = positions.find((p) => p.code === "HRM" || p.title.toLowerCase().includes("hr")) || positions[0];
    const engRole = positions.find((p) => p.code === "SSE" || p.title.toLowerCase().includes("eng")) || positions[0];
    const finRole = positions.find((p) => p.code === "PRS" || p.title.toLowerCase().includes("pay")) || positions[0];

    // 3. Ensure all users in this company have a linked Employee record within this company
    const companyUsers = await prisma.user.findMany({
      where: { companyId, deletedAt: null },
      include: { linkedEmployee: true },
    });

    for (const u of companyUsers) {
      if (!u.employeeId || u.linkedEmployee?.companyId !== companyId) {
        // Clear any stale link to an employee in another company
        await prisma.employee.updateMany({
          where: { userId: u.id, companyId: { not: companyId } },
          data: { userId: null },
        });

        let emp = await prisma.employee.findFirst({
          where: { companyId, email: u.email, deletedAt: null },
        });

        if (!emp) {
          const emailPrefix = u.email.split("@")[0];
          const nameParts = emailPrefix.split(/[._-]/);
          const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "Company";
          const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : (u.role.toUpperCase() === "ADMIN" ? "Admin" : "Staff");

          const deptId = u.role.toLowerCase() === "admin" ? opsDept.id : hrDept.id;
          const posId = u.role.toLowerCase() === "admin" ? undefined : hrRole.id;

          emp = await prisma.employee.create({
            data: {
              companyId,
              employeeCode: `EMP-${u.role.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
              firstName,
              lastName,
              email: u.email,
              departmentId: deptId,
              jobPositionId: posId,
              status: "active",
              employeeType: "full_time",
              userId: u.id,
            },
          });
        } else {
          emp = await prisma.employee.update({
            where: { id: emp.id },
            data: { userId: u.id },
          });
        }

        await prisma.user.update({
          where: { id: u.id },
          data: { employeeId: emp.id },
        });
      }
    }

    // 4. If company has <= 1 employee, provision standard starter team (HR Manager, Lead Engineer, Payroll Specialist)
    const currentEmpCount = await prisma.employee.count({
      where: { companyId, deletedAt: null },
    });

    if (currentEmpCount <= 1) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      const slugDomain = company?.slug || "company";

      // HR Manager
      const hrEmail = `hr.${slugDomain}@peoplepay360.com`;
      let hrEmp = await prisma.employee.findFirst({
        where: { companyId, email: hrEmail, deletedAt: null },
      });
      if (!hrEmp) {
        hrEmp = await prisma.employee.create({
          data: {
            companyId,
            employeeCode: `EMP-HR-${Date.now().toString().slice(-4)}`,
            firstName: "Maya",
            lastName: "Shah",
            email: hrEmail,
            departmentId: hrDept.id,
            jobPositionId: hrRole.id,
            status: "active",
            employeeType: "full_time",
          },
        });

        const hrUser = await prisma.user.create({
          data: {
            companyId,
            email: hrEmail,
            role: "hr_manager",
            employeeId: hrEmp.id,
            isActive: true,
          },
        });

        await prisma.employee.update({
          where: { id: hrEmp.id },
          data: { userId: hrUser.id },
        });

        await prisma.department.update({
          where: { id: hrDept.id },
          data: { managerId: hrEmp.id },
        });
      }

      // Senior Software Engineer
      const engEmail = `dev.${slugDomain}@peoplepay360.com`;
      let engEmp = await prisma.employee.findFirst({
        where: { companyId, email: engEmail, deletedAt: null },
      });
      if (!engEmp) {
        engEmp = await prisma.employee.create({
          data: {
            companyId,
            employeeCode: `EMP-DEV-${Date.now().toString().slice(-4)}`,
            firstName: "Rahul",
            lastName: "Verma",
            email: engEmail,
            departmentId: engDept.id,
            jobPositionId: engRole.id,
            status: "active",
            employeeType: "full_time",
          },
        });

        const devUser = await prisma.user.create({
          data: {
            companyId,
            email: engEmail,
            role: "employee",
            employeeId: engEmp.id,
            isActive: true,
          },
        });

        await prisma.employee.update({
          where: { id: engEmp.id },
          data: { userId: devUser.id },
        });

        await prisma.department.update({
          where: { id: engDept.id },
          data: { managerId: engEmp.id },
        });
      }

      // Payroll Specialist
      const finEmail = `finance.${slugDomain}@peoplepay360.com`;
      let finEmp = await prisma.employee.findFirst({
        where: { companyId, email: finEmail, deletedAt: null },
      });
      if (!finEmp) {
        finEmp = await prisma.employee.create({
          data: {
            companyId,
            employeeCode: `EMP-FIN-${Date.now().toString().slice(-4)}`,
            firstName: "Aarav",
            lastName: "Mehta",
            email: finEmail,
            departmentId: finDept.id,
            jobPositionId: finRole.id,
            status: "active",
            employeeType: "full_time",
          },
        });

        const finUser = await prisma.user.create({
          data: {
            companyId,
            email: finEmail,
            role: "hr_payroll_user",
            employeeId: finEmp.id,
            isActive: true,
          },
        });

        await prisma.employee.update({
          where: { id: finEmp.id },
          data: { userId: finUser.id },
        });

        await prisma.department.update({
          where: { id: finDept.id },
          data: { managerId: finEmp.id },
        });
      }
    }

    await invalidateEmployeeCache(companyId);
  } catch (err: any) {
    logger.warn(`[Employee] Failed to ensure starter staff: ${err.message}`);
  }
};

// List employees with rich filters and smart count aggregation
export const listEmployeesService = async (
  query: QueryEmployeeInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  if (companyId) {
    const count = await prisma.employee.count({ where: { companyId, deletedAt: null } });
    if (count <= 1) {
      await ensureCompanyStarterStaff(companyId);
    }
  }
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

  if (query.withoutUser) {
    where.userId = null;
    where.usersWithEmployeeLink = { none: {} };
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

// Get logged-in user's own employee profile & hub details
export const getMyEmployeeProfileService = async (
  userId: string,
  userEmployeeId?: string | null,
  userEmail?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const whereConditions: any[] = [{ userId }];
  if (userEmployeeId) {
    whereConditions.push({ id: userEmployeeId });
  }
  if (userEmail) {
    whereConditions.push({ email: { equals: userEmail.trim(), mode: "insensitive" } });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      companyId,
      deletedAt: null,
      OR: whereConditions,
    },
    include: {
      department: {
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
          },
        },
      },
      jobPosition: true,
      manager: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true },
      },
      schedule: {
        include: {
          scheduleLines: {
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
      bankAccounts: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      contracts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          salaryStructure: {
            include: {
              structureRules: {
                orderBy: { sequence: "asc" },
                include: { rule: true },
              },
            },
          },
          schedule: true,
        },
      },
      timeOffAllocations: {
        where: { deletedAt: null },
        include: { timeOffType: true },
      },
      timeOffRequests: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { timeOffType: true },
      },
      attendances: {
        where: { deletedAt: null },
        take: 10,
        orderBy: { attendanceDate: "desc" },
      },
      payslips: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { periodStart: "desc" },
      },
    },
  });

  return employee;
};

// Get single employee operational hub details with smart counts
export const getEmployeeByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const cacheKey = `employee:${companyId}:${id}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
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
    },
    900, // 15 minutes TTL
  );
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
  const isAdmin = caller.role.toLowerCase() === "admin" || caller.role.toLowerCase() === "super_admin";
  if (input.role && !isAdmin && input.role.toLowerCase() !== "employee") {
    throw new ApiError(StatusCodes.FORBIDDEN, "HR Managers can only create employees with the 'employee' role. Administrator privileges are required to assign Admin or HR roles.");
  }

  const roleToAssign = input.role ? (isAdmin ? input.role : "employee") : "employee";
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

    // Auto-provision initial leave allocations for the new employee
    const activeLeaveTypes = await tx.timeOffType.findMany({
      where: { companyId, requiresAllocation: true, isActive: true, deletedAt: null },
    });

    if (activeLeaveTypes.length > 0) {
      const currentYear = new Date().getFullYear();
      const validFrom = new Date(`${currentYear}-01-01`);
      const validTo = new Date(`${currentYear}-12-31`);

      const DEFAULT_QUOTAS: Record<string, number> = {
        CL: 12,
        SL: 10,
        PL: 15,
        COMP: 5,
        MAT_PAT: 90,
      };

      for (const lt of activeLeaveTypes) {
        const code = (lt.code || "").toUpperCase();
        const quota = DEFAULT_QUOTAS[code] || 12;

        await tx.timeOffAllocation.create({
          data: {
            companyId,
            employeeId: employee.id,
            timeOffTypeId: lt.id,
            allocated: quota,
            taken: 0,
            remaining: quota,
            status: "approved",
            validFrom,
            validTo,
            notes: `Default annual quota initialized upon employee onboarding (${currentYear})`,
          },
        });
      }
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

  const updatedEmployee = await prisma.$transaction(async (tx) => {
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

  await invalidateEmployeeCache(companyId, id);

  return updatedEmployee;
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

  const deleted = await prisma.$transaction(async (tx) => {
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

  await invalidateEmployeeCache(companyId, id);

  return deleted;
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

  const created = await prisma.$transaction(async (tx) => {
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

  await invalidateEmployeeCache(companyId, employeeId);

  return created;
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

  const updated = await prisma.$transaction(async (tx) => {
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

  await invalidateEmployeeCache(companyId, bankAccount.employeeId);

  return updated;
};

export const deleteBankAccountService = async (bankAccountId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const bankAccount = await prisma.employeeBankAccount.findFirst({
    where: { id: bankAccountId, companyId, deletedAt: null },
  });

  if (!bankAccount) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bank account not found");
  }

  const deleted = await prisma.employeeBankAccount.update({
    where: { id: bankAccountId },
    data: { deletedAt: new Date() },
  });

  await invalidateEmployeeCache(companyId, bankAccount.employeeId);

  return deleted;
};

// Retrieve Master Data for Employee Form (Departments, Positions, Schedules, Managers)
export const getMasterDataService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const cacheKey = `employee:masters:${companyId}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
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
    },
    1800, // 30 minutes TTL
  );
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

  const result = await prisma.$transaction(async (tx) => {
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

  await invalidateEmployeeCache(companyId, employeeId);

  return result;
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

// Master retrieval & creation helpers
export const listDepartmentsService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  if (companyId) {
    const count = await prisma.employee.count({ where: { companyId, deletedAt: null } });
    if (count <= 1) {
      await ensureCompanyStarterStaff(companyId);
    }
  }
  const departments = await prisma.department.findMany({
    where: { companyId, deletedAt: null },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
          jobPositions: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    managerId: d.managerId,
    managerName: d.manager ? `${d.manager.firstName} ${d.manager.lastName}`.trim() : null,
    managerEmail: d.manager?.email || null,
    isActive: d.isActive,
    employeeCount: d._count.employees,
    positionCount: d._count.jobPositions,
    createdAt: d.createdAt,
  }));
};

export const listJobPositionsService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  if (companyId) {
    const count = await prisma.employee.count({ where: { companyId, deletedAt: null } });
    if (count <= 1) {
      await ensureCompanyStarterStaff(companyId);
    }
  }
  const positions = await prisma.jobPosition.findMany({
    where: { companyId, deletedAt: null },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { title: "asc" },
  });

  return positions.map((p) => ({
    id: p.id,
    title: p.title,
    code: p.code,
    departmentId: p.departmentId,
    departmentName: p.department?.name || "Unassigned",
    isActive: p.isActive,
    employeeCount: p._count.employees,
    createdAt: p.createdAt,
  }));
};

export const createDepartmentService = async (
  input: { name: string; code?: string | null; managerId?: string | null },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const trimmedName = input.name.trim();

  const existing = await prisma.department.findFirst({
    where: {
      companyId,
      name: { equals: trimmedName, mode: "insensitive" },
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, `Department "${trimmedName}" already exists`);
  }

  const dept = await prisma.department.create({
    data: {
      companyId,
      name: trimmedName,
      code: input.code?.trim() || null,
      managerId: input.managerId || null,
    },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
          jobPositions: { where: { deletedAt: null } },
        },
      },
    },
  });

  await invalidateEmployeeCache(companyId);

  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    managerId: dept.managerId,
    managerName: dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}`.trim() : null,
    managerEmail: dept.manager?.email || null,
    isActive: dept.isActive,
    employeeCount: dept._count.employees,
    positionCount: dept._count.jobPositions,
    createdAt: dept.createdAt,
  };
};

export const createJobPositionService = async (
  input: { title: string; code?: string | null; departmentId?: string | null },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const trimmedTitle = input.title.trim();

  const existing = await prisma.jobPosition.findFirst({
    where: {
      companyId,
      title: { equals: trimmedTitle, mode: "insensitive" },
      departmentId: input.departmentId || null,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, `Role / Job Position "${trimmedTitle}" already exists in this department`);
  }

  const pos = await prisma.jobPosition.create({
    data: {
      companyId,
      title: trimmedTitle,
      code: input.code?.trim() || null,
      departmentId: input.departmentId || null,
    },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });

  await invalidateEmployeeCache(companyId);

  return {
    id: pos.id,
    title: pos.title,
    code: pos.code,
    departmentId: pos.departmentId,
    departmentName: pos.department?.name || "Unassigned",
    isActive: pos.isActive,
    employeeCount: pos._count.employees,
    createdAt: pos.createdAt,
  };
};

export const createWorkingScheduleService = async (
  input: { name: string; code?: string | null; scheduleType?: string; totalWeeklyHours?: number },
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const sched = await prisma.workingSchedule.create({
    data: {
      companyId,
      name: input.name,
      code: input.code || null,
      scheduleType: input.scheduleType || "fixed",
      totalWeeklyHours: input.totalWeeklyHours ?? 40.0,
    },
  });

  await invalidateEmployeeCache(companyId);

  return sched;
};
