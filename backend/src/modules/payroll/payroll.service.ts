import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import type {
  CreatePayrunInput,
  UpdatePayrunInput,
  SelectEmployeesInput,
  QueryPayrunInput,
  QueryPayslipInput,
} from "./payroll.validation.js";
import { invalidateDashboardCache } from "../dashboard/dashboard.service.js";
import { resolveCompanyId } from "../employee/employee.service.js";
import { cacheService } from "../../redis/services/cache.service.js";

/**
 * 1. Create Payrun (Step 1 of Wizard: Scope, Period, Salary Structure, optional Employee Selection)
 */
export const createPayrunService = async (
  input: CreatePayrunInput,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const periodStart = new Date(`${input.periodStart}T00:00:00.000Z`);
  const periodEnd = new Date(`${input.periodEnd}T23:59:59.999Z`);

  if (periodStart > periodEnd) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "periodStart must be on or before periodEnd");
  }

  // Resolve salary structure if provided
  if (input.salaryStructureId) {
    const structure = await prisma.salaryStructure.findFirst({
      where: { id: input.salaryStructureId, companyId, deletedAt: null },
    });
    if (!structure) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Selected salary structure not found");
    }
  }

  const payrun = await prisma.payrun.create({
    data: {
      companyId,
      name: input.name,
      periodLabel: input.periodLabel || null,
      periodStart,
      periodEnd,
      salaryStructureId: input.salaryStructureId || null,
      status: "draft",
      notes: input.notes || null,
      createdBy: currentUserId || null,
      totalEmployees: input.employeeIds?.length || 0,
    },
  });

  // If employees selected in Step 1/2, link them and lock active contracts
  if (input.employeeIds && input.employeeIds.length > 0) {
    await linkEmployeesToPayrun(payrun.id, companyId, input.employeeIds, periodStart, periodEnd);
  }

  return getPayrunByIdService(payrun.id, companyId);
};

/**
 * Helper: Link employees to payrun, lock period contract, and surface warnings
 */
const linkEmployeesToPayrun = async (
  payrunId: string,
  companyId: string,
  employeeIds: string[],
  periodStart: Date,
  periodEnd: Date,
) => {
  // Remove existing links if any
  await prisma.payrunEmployee.deleteMany({ where: { payrunId } });

  for (const employeeId of employeeIds) {
    // Find active contract valid during the period
    const contract = await prisma.contract.findFirst({
      where: {
        companyId,
        employeeId,
        deletedAt: null,
        status: { in: ["active", "in_progress"] },
        startDate: { lte: periodEnd },
        OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
      },
      orderBy: { startDate: "desc" },
    });

    await prisma.payrunEmployee.create({
      data: {
        companyId,
        payrunId,
        employeeId,
        contractId: contract?.id || null,
        inclusionStatus: "included",
      },
    });

    // Check contract warning
    if (!contract) {
      await prisma.payrollWarning.create({
        data: {
          companyId,
          payrunId,
          employeeId,
          warningType: "no_active_contract",
          severity: "warning",
          message: "Employee has no active contract applicable to this payroll period",
        },
      });
    }

    // Check bank details warning
    const bankAccount = await prisma.employeeBankAccount.findFirst({
      where: { employeeId, companyId, isPrimary: true, deletedAt: null },
    });

    if (!bankAccount) {
      await prisma.payrollWarning.create({
        data: {
          companyId,
          payrunId,
          employeeId,
          warningType: "missing_bank",
          severity: "warning",
          message: "Employee is missing primary bank account details for salary disbursement",
        },
      });
    }
  }

  await prisma.payrun.update({
    where: { id: payrunId },
    data: { totalEmployees: employeeIds.length },
  });
};

/**
 * 2. Select Employees for Payrun (Step 2 of Wizard)
 */
export const selectEmployeesService = async (
  payrunId: string,
  input: SelectEmployeesInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const payrun = await getPayrunByIdService(payrunId, companyId);

  if (payrun.status !== "draft") {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot modify employees for payrun with status '${payrun.status}'`);
  }

  await linkEmployeesToPayrun(
    payrun.id,
    companyId,
    input.employeeIds,
    payrun.periodStart,
    payrun.periodEnd,
  );

  return getPayrunByIdService(payrun.id, companyId);
};

/**
 * 3. Compute Payrun (Batch Salary Computation Engine)
 */
export const computePayrunService = async (
  payrunId: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const payrun = await getPayrunByIdService(payrunId, companyId);

  if (payrun.status === "validated" || payrun.status === "paid") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot recompute payrun that is already '${payrun.status}'`,
    );
  }

  // Fetch included employees
  const payrunEmployees = await prisma.payrunEmployee.findMany({
    where: { payrunId, inclusionStatus: "included" },
    include: {
      employee: {
        include: {
          user: true,
          bankAccounts: { where: { isPrimary: true, deletedAt: null } },
        },
      },
      contract: {
        include: {
          salaryStructure: {
            include: {
              structureRules: {
                where: { isEnabled: true },
                include: { rule: true },
                orderBy: { sequence: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (payrunEmployees.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No employees selected for this payrun");
  }

  // Fetch default fallback structure if payrun has one
  let payrunStructure = null;
  if (payrun.salaryStructureId) {
    payrunStructure = await prisma.salaryStructure.findUnique({
      where: { id: payrun.salaryStructureId },
      include: {
        structureRules: {
          where: { isEnabled: true },
          include: { rule: true },
          orderBy: { sequence: "asc" },
        },
      },
    });
  }

  if (!payrunStructure) {
    // Look up active company structure
    payrunStructure = await prisma.salaryStructure.findFirst({
      where: { companyId, isActive: true, deletedAt: null },
      include: {
        structureRules: {
          where: { isEnabled: true },
          include: { rule: true },
          orderBy: { sequence: "asc" },
        },
      },
    });
  }

  // Delete previous payslips and lines for this payrun
  await prisma.payslipLine.deleteMany({
    where: { payslip: { payrunId } },
  });
  await prisma.payslip.deleteMany({
    where: { payrunId },
  });

  let payrunTotalGross = 0;
  let payrunTotalDeductions = 0;
  let payrunTotalNet = 0;

  for (const pe of payrunEmployees) {
    const employee = pe.employee;
    const contract = pe.contract;

    // Resolve salary rules to use
    const structureToUse = contract?.salaryStructure || payrunStructure;
    const structureRules = (structureToUse as any)?.structureRules || [];

    const wage = contract ? Number(contract.wage) : 30000; // Base contract wage

    // Calculate worked days and hours from attendances in period
    const attendances = await prisma.attendance.findMany({
      where: {
        companyId,
        employeeId: employee.id,
        deletedAt: null,
        attendanceDate: {
          gte: payrun.periodStart,
          lte: payrun.periodEnd,
        },
      },
    });

    const workedDays = attendances.filter((a) => a.status !== "absent").length;
    const overtimeHours = attendances.reduce(
      (acc, a) => acc + Number(a.overtimeHours || 0),
      0,
    );

    // Calculate leave days from approved time off requests in period
    const leaveRequests = await prisma.timeOffRequest.findMany({
      where: {
        companyId,
        employeeId: employee.id,
        status: "approved",
        deletedAt: null,
        startDate: { lte: payrun.periodEnd },
        endDate: { gte: payrun.periodStart },
      },
    });

    const leaveDays = leaveRequests.reduce(
      (acc, r) => acc + Number(r.duration || 0),
      0,
    );

    // Calculate rule breakdowns
    const computedValues: Record<string, number> = {
      BASIC: wage,
      WAGE: wage,
      GROSS: wage,
      DEDUCTIONS: 0,
      NET: wage,
    };

    const linesToCreate: Array<{
      salaryRuleId?: string | null;
      ruleCode: string;
      ruleName: string;
      category: string;
      sequence: number;
      computationMethod: string;
      baseAmount: number;
      rate: number | null;
      amount: number;
      appearsOnPayslip: boolean;
    }> = [];

    let basicAmount = wage;
    let totalAllowances = 0;
    let totalDeductions = 0;

    if (structureRules.length > 0) {
      for (const sr of structureRules) {
        const rule = sr.rule;
        if (!rule) continue;

        let ruleAmount = 0;
        let rate: number | null = null;
        const code = rule.code.toUpperCase();

        if (rule.computationMethod === "fixed") {
          ruleAmount = code === "BASIC" ? wage : Number(rule.amount || 0);
        } else if (rule.computationMethod === "percentage") {
          const percent = Number(rule.percentageValue || 0);
          rate = percent;
          const baseKey = rule.basedOnCode ? rule.basedOnCode.toUpperCase() : "BASIC";
          const baseValue = computedValues[baseKey] || basicAmount;
          ruleAmount = (percent / 100) * baseValue;
        } else {
          // Formula or default
          ruleAmount = Number(rule.amount || 0);
        }

        ruleAmount = Math.max(0, parseFloat(ruleAmount.toFixed(2)));
        computedValues[code] = ruleAmount;

        const category = rule.category.toLowerCase();
        if (category === "basic") {
          basicAmount = ruleAmount;
        } else if (category === "allowance") {
          totalAllowances += ruleAmount;
        } else if (category === "deduction") {
          totalDeductions += ruleAmount;
        }

        linesToCreate.push({
          salaryRuleId: rule.id,
          ruleCode: rule.code,
          ruleName: rule.name,
          category: rule.category,
          sequence: sr.sequence,
          computationMethod: rule.computationMethod,
          baseAmount: basicAmount,
          rate,
          amount: ruleAmount,
          appearsOnPayslip: rule.appearsOnPayslip,
        });
      }
    } else {
      // Default structure breakdown if no rules configured: Basic (100%), HRA (20%), Tax (5%)
      basicAmount = wage;
      const hra = parseFloat((wage * 0.2).toFixed(2));
      totalAllowances = hra;
      const tax = parseFloat((wage * 0.05).toFixed(2));
      totalDeductions = tax;

      linesToCreate.push(
        {
          ruleCode: "BASIC",
          ruleName: "Basic Salary",
          category: "basic",
          sequence: 1,
          computationMethod: "fixed",
          baseAmount: wage,
          rate: null,
          amount: basicAmount,
          appearsOnPayslip: true,
        },
        {
          ruleCode: "HRA",
          ruleName: "House Rent Allowance",
          category: "allowance",
          sequence: 2,
          computationMethod: "percentage",
          baseAmount: wage,
          rate: 20,
          amount: hra,
          appearsOnPayslip: true,
        },
        {
          ruleCode: "TAX",
          ruleName: "TDS / Income Tax",
          category: "deduction",
          sequence: 3,
          computationMethod: "percentage",
          baseAmount: wage,
          rate: 5,
          amount: tax,
          appearsOnPayslip: true,
        },
      );
    }

    const gross = basicAmount + totalAllowances;
    const net = Math.max(0, gross - totalDeductions);

    payrunTotalGross += gross;
    payrunTotalDeductions += totalDeductions;
    payrunTotalNet += net;

    // Create Payslip record
    const payslip = await prisma.payslip.create({
      data: {
        companyId,
        payrunId,
        employeeId: employee.id,
        contractId: contract?.id || null,
        structureId: structureToUse?.id || null,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        workedDays,
        leaveDays,
        overtimeHours,
        status: "computed",
        currency: contract?.currency || "INR",
        basic: basicAmount,
        totalAllowances,
        gross,
        totalDeductions,
        net,
        computedAt: new Date(),
      },
    });

    // Create frozen PayslipLine items
    if (linesToCreate.length > 0) {
      await prisma.payslipLine.createMany({
        data: linesToCreate.map((l) => ({
          ...l,
          companyId,
          payslipId: payslip.id,
        })),
      });
    }
  }

  // Update Payrun aggregate totals
  const updatedPayrun = await prisma.payrun.update({
    where: { id: payrunId },
    data: {
      status: "computed",
      totalGross: payrunTotalGross,
      totalDeductions: payrunTotalDeductions,
      totalNet: payrunTotalNet,
      computedAt: new Date(),
    },
    include: {
      salaryStructure: true,
      payslips: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
          },
        },
      },
      payrollWarnings: {
        where: { isResolved: false },
      },
    },
  });

  // Invalidate payslips and dashboard cache
  await cacheService.delByPattern("payslip:*");
  invalidateDashboardCache(companyId).catch(() => {});

  return updatedPayrun;
};

/**
 * 4. Validate Payrun (Approve Batch for Payment)
 */
export const validatePayrunService = async (
  payrunId: string,
  currentUserId?: string | null,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const payrun = await getPayrunByIdService(payrunId, companyId);

  if (payrun.status !== "computed") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot validate payrun with status '${payrun.status}'. Compute it first.`,
    );
  }

  const updatedPayrun = await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId },
      data: { status: "validated" },
    });

    return tx.payrun.update({
      where: { id: payrunId },
      data: {
        status: "validated",
        validatedAt: new Date(),
        validatedBy: currentUserId || null,
      },
      include: {
        salaryStructure: true,
        payslips: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
            },
          },
        },
        payrollWarnings: { where: { isResolved: false } },
      },
    });
  });

  // Invalidate dashboard cache so expenditure/counts reflect new validated status
  invalidateDashboardCache(companyId).catch(() => {});

  return updatedPayrun;
};

/**
 * 5. Mark Payrun as Paid (Finalize Disbursement)
 */
export const markPaidPayrunService = async (
  payrunId: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const payrun = await getPayrunByIdService(payrunId, companyId);

  if (payrun.status !== "validated" && payrun.status !== "computed") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot mark payrun as paid with status '${payrun.status}'. Must be validated or computed.`,
    );
  }

  const updatedPayrun = await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId },
      data: { status: "paid" },
    });

    return tx.payrun.update({
      where: { id: payrunId },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
      include: {
        salaryStructure: true,
        payslips: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
            },
          },
        },
        payrollWarnings: { where: { isResolved: false } },
      },
    });
  });

  // Invalidate dashboard cache so expenditure/counts reflect paid status
  invalidateDashboardCache(companyId).catch(() => {});

  return updatedPayrun;
};

/**
 * 6. Cancel Payrun
 */
export const cancelPayrunService = async (
  payrunId: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const payrun = await getPayrunByIdService(payrunId, companyId);

  if (payrun.status === "paid") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot cancel a payrun that has already been paid");
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId },
      data: { status: "cancelled" },
    });

    return tx.payrun.update({
      where: { id: payrunId },
      data: { status: "cancelled" },
    });
  });

  await cacheService.delByPattern("payslip:*");
  invalidateDashboardCache(companyId).catch(() => {});

  return cancelled;
};

/**
 * 7. List Payruns with Filtering & Pagination
 */
export const listPayrunsService = async (
  query: QueryPayrunInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const where: any = { companyId, deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.startDate || query.endDate) {
    if (query.startDate) where.periodStart = { gte: new Date(`${query.startDate}T00:00:00.000Z`) };
    if (query.endDate) where.periodEnd = { lte: new Date(`${query.endDate}T23:59:59.999Z`) };
  }

  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true } },
        validator: { select: { id: true, email: true } },
        _count: {
          select: {
            payslips: true,
            payrollWarnings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payrun.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * 8. Get Payrun by ID with Details
 */
export const getPayrunByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const payrun = await prisma.payrun.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      salaryStructure: true,
      creator: { select: { id: true, email: true } },
      validator: { select: { id: true, email: true } },
      payrunEmployees: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, userId: true },
          },
          contract: {
            select: { id: true, contractReference: true, wage: true, status: true },
          },
        },
      },
      payslips: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true },
          },
        },
      },
      payrollWarnings: {
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
      },
    },
  });

  if (!payrun) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Payrun not found");
  }

  return payrun;
};

/**
 * 9. List Payslips with Filtering
 */
export const listPayslipsService = async (
  query: QueryPayslipInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const where: any = { companyId, deletedAt: null };

  if (query.payrunId) where.payrunId = query.payrunId;
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;

  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true },
        },
        payrun: { select: { id: true, name: true, periodLabel: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payslip.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * 10. Get Payslip by ID with Breakdown Lines
 */
export const getPayslipByIdService = async (id: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const cacheKey = `payslip:${id}`;

  // Check Redis cache first
  const cached = await cacheService.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const payslip = await prisma.payslip.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          email: true,
          userId: true,
          department: { select: { id: true, name: true } },
          jobPosition: { select: { id: true, title: true } },
        },
      },
      payrun: { select: { id: true, name: true, periodLabel: true, status: true } },
      contract: { select: { id: true, contractReference: true, wage: true } },
      structure: { select: { id: true, name: true } },
      payslipLines: { orderBy: { sequence: "asc" } },
    },
  });

  if (!payslip) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Payslip not found");
  }

  // If payslip is finalized (validated or paid), cache for 24 hours
  if (
    payslip.status === "validated" ||
    payslip.status === "paid" ||
    payslip.payrun?.status === "validated" ||
    payslip.payrun?.status === "paid"
  ) {
    await cacheService.set(cacheKey, payslip, 86400); // 24 hours TTL
  }

  return payslip;
};
