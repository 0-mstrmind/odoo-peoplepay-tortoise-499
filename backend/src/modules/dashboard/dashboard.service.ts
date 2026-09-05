import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import { resolveCompanyId } from "../employee/employee.service.js";
import type { DashboardFilterInput, ResolveWarningInput } from "./dashboard.validation.js";

// Helper to build date range filter
const resolveDateRange = (startDateStr?: string, endDateStr?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (startDateStr) {
    start = new Date(startDateStr);
  } else {
    // Default to first day of current month
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  if (endDateStr) {
    end = new Date(endDateStr);
  } else {
    // Default to last day of current month
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  return { start, end };
};

// 1. Full Dashboard Overview (PDF Sections A7 & B9)
export const getDashboardOverviewService = async (
  filter: DashboardFilterInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const { start, end } = resolveDateRange(filter.startDate, filter.endDate);

  // Build employee scoping condition
  const employeeWhere: any = {
    companyId,
    deletedAt: null,
  };

  if (filter.departmentId) {
    employeeWhere.departmentId = filter.departmentId;
  }

  if (filter.employeeType) {
    employeeWhere.employeeType = filter.employeeType;
  }

  // Get matching employee IDs
  const matchingEmployees = await prisma.employee.findMany({
    where: employeeWhere,
    select: { id: true, status: true, departmentId: true, employeeType: true },
  });
  const employeeIds = matchingEmployees.map((e) => e.id);

  // Active headcount
  const activeHeadcount = matchingEmployees.filter((e) => e.status === "active").length;

  // Employee scoping clause for related tables
  const employeeFilterClause = (filter.departmentId || filter.employeeType)
    ? { employeeId: { in: employeeIds } }
    : {};

  // 1. KPI: Payslips & Salary Expenditure
  const payslips = await prisma.payslip.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...employeeFilterClause,
      periodStart: { lte: end },
      periodEnd: { gte: start },
    },
    select: {
      id: true,
      basic: true,
      gross: true,
      net: true,
      totalDeductions: true,
      totalAllowances: true,
      status: true,
    },
  });

  const payslipsGenerated = payslips.length;
  const paidPayslips = payslips.filter((p) => p.status === "paid" || p.status === "validated");
  const totalNetSalaryPaid = paidPayslips.reduce((sum, p) => sum + Number(p.net || 0), 0);
  const totalGrossSalary = paidPayslips.reduce((sum, p) => sum + Number(p.gross || 0), 0);
  const totalDeductions = paidPayslips.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0);
  const averageSalary = payslipsGenerated > 0 ? Number((totalNetSalaryPaid / payslipsGenerated).toFixed(2)) : 0;

  // 2. KPI: Attendance Health & Breakdown
  const attendances = await prisma.attendance.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...employeeFilterClause,
      attendanceDate: { gte: start, lte: end },
    },
    select: {
      status: true,
      workedHours: true,
      overtimeHours: true,
      isCorrected: true,
    },
  });

  const totalAttendanceEntries = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "present").length;
  const lateCount = attendances.filter((a) => a.status === "late").length;
  const absentCount = attendances.filter((a) => a.status === "absent").length;
  const halfDayCount = attendances.filter((a) => a.status === "half_day").length;
  const onLeaveCount = attendances.filter((a) => a.status === "on_leave").length;
  const correctedCount = attendances.filter((a) => a.isCorrected).length;

  const totalWorkedHours = Number(
    attendances.reduce((sum, a) => sum + Number(a.workedHours || 0), 0).toFixed(2),
  );
  const totalOvertimeHours = Number(
    attendances.reduce((sum, a) => sum + Number(a.overtimeHours || 0), 0).toFixed(2),
  );

  const attendanceHealthPercentage = totalAttendanceEntries > 0
    ? Number((((presentCount + halfDayCount) / totalAttendanceEntries) * 100).toFixed(1))
    : 100.0;

  // 3. KPI: Time Off
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...employeeFilterClause,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: {
      duration: true,
      status: true,
    },
  });

  const approvedTimeOffDays = Number(
    timeOffRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + Number(r.duration || 0), 0)
      .toFixed(1),
  );
  const pendingTimeOffCount = timeOffRequests.filter((r) => r.status === "pending" || r.status === "draft").length;

  // 4. Operational Alerts & Warnings (PDF Section B9)
  const unresolvedWarnings = await prisma.payrollWarning.findMany({
    where: {
      companyId,
      isResolved: false,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      payrun: { select: { id: true, name: true, periodLabel: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Dynamic checks for operational attention
  const [employeesWithoutBank, employeesWithoutActiveContract, activePayrunsCount] = await Promise.all([
    prisma.employee.count({
      where: {
        companyId,
        status: "active",
        deletedAt: null,
        bankAccounts: { none: { isPrimary: true, deletedAt: null } },
      },
    }),
    prisma.employee.count({
      where: {
        companyId,
        status: "active",
        deletedAt: null,
        contracts: { none: { status: "active", deletedAt: null } },
      },
    }),
    prisma.payrun.count({
      where: {
        companyId,
        deletedAt: null,
        status: { in: ["draft", "computing", "computed"] },
      },
    }),
  ]);

  return {
    kpis: {
      totalNetSalaryPaid,
      totalGrossSalary,
      totalDeductions,
      payslipsGenerated,
      averageSalary,
      approvedTimeOffDays,
      pendingTimeOffCount,
      attendanceHealthPercentage,
      activeHeadcount,
    },
    attendanceOverview: {
      totalEntries: totalAttendanceEntries,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      halfDay: halfDayCount,
      onLeave: onLeaveCount,
      manualEdits: correctedCount,
      totalWorkedHours,
      totalOvertimeHours,
      attendanceCoverageRate: attendanceHealthPercentage,
    },
    operationalAlerts: {
      unresolvedWarningsCount: unresolvedWarnings.length,
      unresolvedWarnings,
      attentionItems: {
        employeesWithoutBank,
        employeesWithoutActiveContract,
        activePayrunsAwaitingFinalization: activePayrunsCount,
      },
    },
    filtersApplied: {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
      departmentId: filter.departmentId || null,
      employeeType: filter.employeeType || null,
    },
  };
};

// 2. Monthly Salary Trends (Past N Months)
export const getSalaryTrendsService = async (
  monthsBack: number = 6,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const now = new Date();

  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999));
    const label = monthDate.toISOString().substring(0, 7); // "YYYY-MM"
    months.push({ label, start: monthDate, end: nextMonth });
  }

  const trends = await Promise.all(
    months.map(async (m) => {
      const payslips = await prisma.payslip.findMany({
        where: {
          companyId,
          deletedAt: null,
          periodStart: { lte: m.end },
          periodEnd: { gte: m.start },
        },
        select: {
          gross: true,
          net: true,
          totalDeductions: true,
          totalAllowances: true,
          status: true,
        },
      });

      const totalGross = payslips.reduce((sum, p) => sum + Number(p.gross || 0), 0);
      const totalNet = payslips.reduce((sum, p) => sum + Number(p.net || 0), 0);
      const totalDeductions = payslips.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0);

      return {
        month: m.label,
        grossSalary: totalGross,
        netSalary: totalNet,
        deductions: totalDeductions,
        payslipCount: payslips.length,
      };
    }),
  );

  return { trends };
};

// 3. Department Breakdown (Headcount & Expenditure)
export const getDepartmentBreakdownService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const departments = await prisma.department.findMany({
    where: { companyId, deletedAt: null },
    include: {
      employees: {
        where: { deletedAt: null, status: "active" },
        include: {
          contracts: {
            where: { status: "active", deletedAt: null },
            select: { wage: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const breakdown = departments.map((dept) => {
    const activeHeadcount = dept.employees.length;
    const totalWageBudget = dept.employees.reduce((sum, emp) => {
      const contractWage = emp.contracts[0]?.wage ? Number(emp.contracts[0].wage) : 0;
      return sum + contractWage;
    }, 0);
    const averageWage = activeHeadcount > 0 ? Number((totalWageBudget / activeHeadcount).toFixed(2)) : 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      activeHeadcount,
      totalSalaryExpenditure: totalWageBudget,
      averageSalary: averageWage,
    };
  });

  return { breakdown };
};

// 4. Detailed Attendance Overview
export const getAttendanceOverviewService = async (
  filter: DashboardFilterInput,
  callerCompanyId?: string | null,
) => {
  const overview = await getDashboardOverviewService(filter, callerCompanyId);
  return overview.attendanceOverview;
};

// 5. Operational Alerts & Warnings List
export const getOperationalAlertsService = async (callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const warnings = await prisma.payrollWarning.findMany({
    where: { companyId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
      payrun: { select: { id: true, name: true, periodLabel: true, status: true } },
      resolver: { select: { id: true, email: true } },
    },
    orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return { warnings };
};

// 6. Resolve Warning
export const resolveWarningService = async (
  warningId: string,
  input: ResolveWarningInput,
  callerUserId?: string,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const existing = await prisma.payrollWarning.findFirst({
    where: { id: warningId, companyId },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Payroll warning not found");
  }

  const updated = await prisma.payrollWarning.update({
    where: { id: warningId },
    data: {
      isResolved: true,
      resolvedBy: callerUserId || null,
      resolvedAt: new Date(),
      message: input.resolutionNotes ? `${existing.message || ""} [Resolution: ${input.resolutionNotes}]` : existing.message,
    },
  });

  return updated;
};
