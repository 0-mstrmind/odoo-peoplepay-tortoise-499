import { StatusCodes } from "http-status-codes";

import { prisma } from "../../core/config/prisma.js";
import { logger } from "../../core/config/logger.js";
import ApiError from "../../shared/utils/ApiError.js";
import { cacheService } from "../../redis/services/cache.service.js";
import { evaluateFormula } from "../../shared/utils/formulaEvaluator.js";
import { detectCircularDependencies } from "../../shared/utils/circularDependencyChecker.js";

// ─────────────────────────────────────────
// SALARY STRUCTURES SERVICE
// ─────────────────────────────────────────

/**
 * Invalidate cached salary structures and rules
 */
export const invalidateSalaryCache = async (companyId?: string): Promise<void> => {
  try {
    if (companyId) {
      await cacheService.delByPattern(`salary:*${companyId}*`);
    } else {
      await cacheService.delByPattern("salary:*");
    }
    logger.debug(`[Salary] Cache invalidated for: ${companyId || "all"}`);
  } catch (err) {
    logger.warn(`[Salary] Failed to invalidate cache: ${(err as Error).message}`);
  }
};

export const listSalaryStructuresService = async (companyId?: string) => {
  const cacheKey = `salary:structures:${companyId || "all"}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const structures = await prisma.salaryStructure.findMany({
        where: {
          deletedAt: null,
          ...(companyId ? { companyId } : {}),
        },
        include: {
          structureRules: true,
          contracts: {
            where: {
              status: "active",
              deletedAt: null,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return structures.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        description: s.description,
        active: s.isActive,
        ruleCount: s.structureRules.length,
        employeeCount: s.contracts.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    },
    3600, // 1 hour TTL
  );
};

export const getSalaryStructureByIdService = async (id: string) => {
  const cacheKey = `salary:structure:${id}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const structure = await prisma.salaryStructure.findFirst({
        where: { id, deletedAt: null },
        include: {
          structureRules: {
            orderBy: { sequence: "asc" },
            include: {
              rule: true,
            },
          },
        },
      });

      if (!structure) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Salary structure not found");
      }

      return {
        id: structure.id,
        name: structure.name,
        code: structure.code,
        description: structure.description,
        active: structure.isActive,
        rules: structure.structureRules.map((sr) => ({
          structureRuleId: sr.id,
          ruleId: sr.rule.id,
          name: sr.rule.name,
          code: sr.rule.code,
          category: sr.rule.category,
          sequence: sr.sequence,
          computationMethod: sr.rule.computationMethod,
          amount: sr.rule.amount ? Number(sr.rule.amount) : null,
          percentageValue: sr.rule.percentageValue ? Number(sr.rule.percentageValue) : null,
          basedOnCode: sr.rule.basedOnCode,
          formula: sr.rule.formula,
          appearsOnPayslip: sr.rule.appearsOnPayslip,
          isEnabled: sr.isEnabled,
        })),
        createdAt: structure.createdAt,
        updatedAt: structure.updatedAt,
      };
    },
    3600, // 1 hour TTL
  );
};

export const createSalaryStructureService = async (data: {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  companyId?: string | null;
}) => {
  const created = await prisma.salaryStructure.create({
    data: {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      isActive: data.isActive ?? true,
      companyId: data.companyId || null,
    },
  });

  await invalidateSalaryCache(data.companyId || undefined);

  return created;
};

export const updateSalaryStructureService = async (
  id: string,
  data: { name?: string; code?: string | null; description?: string | null; isActive?: boolean },
) => {
  const structure = await prisma.salaryStructure.findFirst({
    where: { id, deletedAt: null },
    include: {
      structureRules: {
        include: { rule: true },
      },
      contracts: {
        where: { status: "active", deletedAt: null },
      },
    },
  });

  if (!structure) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Salary structure not found");
  }

  // Deactivation check: Block setting active = false if active contracts use this structure
  if (data.isActive === false && structure.contracts.length > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot deactivate salary structure currently assigned to ${structure.contracts.length} active employee contract(s)`,
    );
  }

  // Activation check: Must have at least one basic and one net rule linked
  if (data.isActive === true) {
    const rules = structure.structureRules.map((sr) => sr.rule);
    const hasBasic = rules.some((r) => r.category === "basic");
    const hasNet = rules.some((r) => r.category === "net");

    if (structure.structureRules.length > 0 && (!hasBasic || !hasNet)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot activate salary structure. Linked rules must include at least one rule with category 'basic' and one with category 'net'",
      );
    }
  }

  const updated = await prisma.salaryStructure.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  await invalidateSalaryCache(structure.companyId || undefined);

  return updated;
};

export const addRuleToStructureService = async (
  structureId: string,
  ruleId: string,
  sequence: number,
  companyId?: string | null,
) => {
  const structure = await prisma.salaryStructure.findFirst({
    where: { id: structureId, deletedAt: null },
    include: { structureRules: { include: { rule: true } } },
  });

  if (!structure) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Salary structure not found");
  }

  const ruleToAdd = await prisma.salaryRule.findFirst({
    where: { id: ruleId, deletedAt: null },
  });

  if (!ruleToAdd) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Salary rule not found");
  }

  // Circular dependency check on combined rules
  const existingRules = structure.structureRules.map((sr) => ({
    code: sr.rule.code,
    computationMethod: sr.rule.computationMethod,
    basedOnCode: sr.rule.basedOnCode,
    formula: sr.rule.formula,
  }));

  const allRules = [
    ...existingRules.filter((r) => r.code !== ruleToAdd.code),
    {
      code: ruleToAdd.code,
      computationMethod: ruleToAdd.computationMethod,
      basedOnCode: ruleToAdd.basedOnCode,
      formula: ruleToAdd.formula,
    },
  ];

  detectCircularDependencies(allRules);

  const existingLink = await prisma.structureRule.findUnique({
    where: { structureId_ruleId: { structureId, ruleId } },
  });

  let result;
  if (existingLink) {
    result = await prisma.structureRule.update({
      where: { id: existingLink.id },
      data: { sequence },
    });
  } else {
    result = await prisma.structureRule.create({
      data: {
        structureId,
        ruleId,
        sequence,
        companyId: companyId || structure.companyId || null,
      },
    });
  }

  await invalidateSalaryCache(companyId || structure.companyId || undefined);

  return result;
};

export const updateStructureRuleSequenceService = async (structureId: string, ruleId: string, sequence: number) => {
  const link = await prisma.structureRule.findUnique({
    where: { structureId_ruleId: { structureId, ruleId } },
  });

  if (!link) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Rule link in structure not found");
  }

  const updated = await prisma.structureRule.update({
    where: { id: link.id },
    data: { sequence },
  });

  await invalidateSalaryCache(link.companyId || undefined);

  return updated;
};

export const removeRuleFromStructureService = async (structureId: string, ruleId: string) => {
  const link = await prisma.structureRule.findUnique({
    where: { structureId_ruleId: { structureId, ruleId } },
  });

  if (!link) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Rule link in structure not found");
  }

  const deleted = await prisma.structureRule.delete({
    where: { id: link.id },
  });

  await invalidateSalaryCache(link.companyId || undefined);

  return deleted;
};

// ─────────────────────────────────────────
// SALARY RULES SERVICE
// ─────────────────────────────────────────

export const listSalaryRulesService = async (companyId?: string) => {
  const cacheKey = `salary:rules:${companyId || "all"}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return prisma.salaryRule.findMany({
        where: {
          deletedAt: null,
          ...(companyId ? { companyId } : {}),
        },
        orderBy: { sequence: "asc" },
      });
    },
    3600, // 1 hour TTL
  );
};

export const getSalaryRuleByIdService = async (id: string) => {
  const cacheKey = `salary:rule:${id}`;

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const rule = await prisma.salaryRule.findFirst({
        where: { id, deletedAt: null },
      });

      if (!rule) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Salary rule not found");
      }

      return rule;
    },
    3600, // 1 hour TTL
  );
};

export const createSalaryRuleService = async (data: {
  name: string;
  code: string;
  category: string;
  sequence?: number;
  computationMethod: string;
  amount?: number | null;
  percentageValue?: number | null;
  basedOnCode?: string | null;
  formula?: string | null;
  appearsOnPayslip?: boolean;
  description?: string | null;
  isActive?: boolean;
  companyId?: string | null;
}) => {
  const existingCode = await prisma.salaryRule.findFirst({
    where: { code: data.code, deletedAt: null },
  });

  if (existingCode) {
    throw new ApiError(StatusCodes.CONFLICT, `Salary rule code '${data.code}' already exists`);
  }

  // Validate circular dependency
  const existingRules = await prisma.salaryRule.findMany({
    where: { deletedAt: null },
    select: { code: true, computationMethod: true, basedOnCode: true, formula: true },
  });

  detectCircularDependencies([...existingRules, data]);

  const created = await prisma.salaryRule.create({
    data: {
      name: data.name,
      code: data.code,
      category: data.category,
      sequence: data.sequence ?? 1,
      computationMethod: data.computationMethod,
      amount: data.amount !== undefined && data.amount !== null ? data.amount : null,
      percentageValue: data.percentageValue !== undefined && data.percentageValue !== null ? data.percentageValue : null,
      basedOnCode: data.basedOnCode || null,
      formula: data.formula || null,
      appearsOnPayslip: data.appearsOnPayslip ?? true,
      description: data.description || null,
      isActive: data.isActive ?? true,
      companyId: data.companyId || null,
    },
  });

  await invalidateSalaryCache(data.companyId || undefined);

  return created;
};

export const updateSalaryRuleService = async (
  id: string,
  data: {
    name?: string;
    category?: string;
    sequence?: number;
    computationMethod?: string;
    amount?: number | null;
    percentageValue?: number | null;
    basedOnCode?: string | null;
    formula?: string | null;
    appearsOnPayslip?: boolean;
    description?: string | null;
    isActive?: boolean;
  },
) => {
  const existing = await prisma.salaryRule.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Salary rule not found");
  }

  const updatedRule = {
    ...existing,
    ...data,
  };

  const allRules = await prisma.salaryRule.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, computationMethod: true, basedOnCode: true, formula: true },
  });

  const mergedRules = allRules.map((r) => (r.id === id ? updatedRule : r));
  detectCircularDependencies(mergedRules);

  const updated = await prisma.salaryRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.sequence !== undefined ? { sequence: data.sequence } : {}),
      ...(data.computationMethod !== undefined ? { computationMethod: data.computationMethod } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.percentageValue !== undefined ? { percentageValue: data.percentageValue } : {}),
      ...(data.basedOnCode !== undefined ? { basedOnCode: data.basedOnCode } : {}),
      ...(data.formula !== undefined ? { formula: data.formula } : {}),
      ...(data.appearsOnPayslip !== undefined ? { appearsOnPayslip: data.appearsOnPayslip } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  await invalidateSalaryCache(existing.companyId || undefined);

  return updated;
};

export const deleteSalaryRuleService = async (id: string) => {
  const rule = await prisma.salaryRule.findFirst({
    where: { id, deletedAt: null },
    include: {
      structureRules: {
        include: {
          structure: {
            include: {
              payruns: {
                where: {
                  status: { not: "draft" },
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!rule) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Salary rule not found");
  }

  // Check if active on any structure_rules row belonging to a structure referenced by non-draft payruns
  const blockedPayrun = rule.structureRules.some(
    (sr) => sr.isEnabled && sr.structure.payruns.length > 0,
  );

  if (blockedPayrun) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Cannot delete salary rule because it is linked to a structure referenced in non-draft payruns",
    );
  }

  const deleted = await prisma.salaryRule.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await invalidateSalaryCache(rule.companyId || undefined);

  return deleted;
};

// ─────────────────────────────────────────
// SALARY COMPUTATION ENGINE
// ─────────────────────────────────────────

export interface ComputePayslipPeriod {
  periodStart: Date;
  periodEnd: Date;
}

export const computePayslipEngine = async (
  employeeId: string,
  contractId: string,
  structureId: string,
  period: ComputePayslipPeriod,
  payrunId?: string,
) => {
  // Query structure_rules ordered by structure_rules.sequence
  const structureRules = await prisma.structureRule.findMany({
    where: {
      structureId,
      isEnabled: true,
      rule: { isActive: true, deletedAt: null },
    },
    orderBy: { sequence: "asc" },
    include: {
      rule: true,
    },
  });

  if (structureRules.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Salary structure has no active rules configured");
  }

  // Calculate period calendar days and time-off leave days
  const periodStart = new Date(period.periodStart);
  const periodEnd = new Date(period.periodEnd);
  const totalPeriodDays =
    Math.floor(Math.abs(periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const approvedRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: "approved",
      deletedAt: null,
      AND: [{ startDate: { lte: periodEnd } }, { endDate: { gte: periodStart } }],
    },
    include: {
      timeOffType: true,
    },
  });

  let leaveDays = 0;
  let unpaidLeaveDays = 0;

  for (const req of approvedRequests) {
    const reqStart = new Date(req.startDate);
    const reqEnd = new Date(req.endDate);

    const overlapStart = reqStart < periodStart ? periodStart : reqStart;
    const overlapEnd = reqEnd > periodEnd ? periodEnd : reqEnd;
    const overlapDays =
      Math.floor(Math.abs(overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    leaveDays += overlapDays;
    if (req.timeOffType.payrollIntegration) {
      unpaidLeaveDays += overlapDays;
    }
  }

  const workedDays = Math.max(0, totalPeriodDays - unpaidLeaveDays);

  // Initialize computation context
  const context: Record<string, number> = {
    TOTAL_DAYS: totalPeriodDays,
    WORKED_DAYS: workedDays,
    LEAVE_DAYS: leaveDays,
    UNPAID_LEAVE_DAYS: unpaidLeaveDays,
  };
  const computedLines: {
    salaryRuleId: string;
    ruleCode: string;
    ruleName: string;
    category: string;
    sequence: number;
    computationMethod: string;
    amount: number;
    appearsOnPayslip: boolean;
  }[] = [];

  // Iterate rules in sequence order
  for (const sr of structureRules) {
    const rule = sr.rule;
    let computedValue = 0;

    if (rule.computationMethod === "fixed") {
      computedValue = rule.amount ? Number(rule.amount) : 0;
    } else if (rule.computationMethod === "percentage") {
      const baseCode = rule.basedOnCode;
      if (!baseCode) {
        throw new Error(`Configuration Error: Rule "${rule.code}" missing basedOnCode`);
      }
      if (!(baseCode in context)) {
        throw new Error(
          `Sequence Validation Error: Rule code "${baseCode}" referenced by "${rule.code}" has not been computed yet`,
        );
      }
      const baseValue = context[baseCode];
      const rate = rule.percentageValue ? Number(rule.percentageValue) / 100 : 0;
      computedValue = baseValue * rate;
    } else if (rule.computationMethod === "formula") {
      if (!rule.formula) {
        throw new Error(`Configuration Error: Rule "${rule.code}" missing formula`);
      }
      computedValue = evaluateFormula(rule.formula, context);
    }

    context[rule.code] = computedValue;

    computedLines.push({
      salaryRuleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      sequence: sr.sequence,
      computationMethod: rule.computationMethod,
      amount: computedValue,
      appearsOnPayslip: rule.appearsOnPayslip,
    });
  }

  // Category rollups
  let basic = 0;
  let totalAllowances = 0;
  let totalDeductions = 0;
  let gross = 0;
  let net = 0;

  let hasGrossRule = false;
  let hasNetRule = false;

  for (const line of computedLines) {
    const cat = line.category.toLowerCase();
    if (cat === "basic") {
      basic += line.amount;
    } else if (cat === "allowance") {
      totalAllowances += line.amount;
    } else if (cat === "deduction") {
      totalDeductions += line.amount;
    } else if (cat === "gross") {
      gross = line.amount;
      hasGrossRule = true;
    } else if (cat === "net") {
      net = line.amount;
      hasNetRule = true;
    }
  }

  if (!hasGrossRule) {
    gross = basic + totalAllowances;
  }
  if (!hasNetRule) {
    net = gross - totalDeductions;
  }

  // Contract structure mismatch check
  const warnings: { warningType: string; severity: string; message: string }[] = [];
  const employeeContract = await prisma.contract.findFirst({
    where: { id: contractId, employeeId, deletedAt: null },
  });

  if (employeeContract && employeeContract.salaryStructureId !== structureId) {
    warnings.push({
      warningType: "structure_mismatch",
      severity: "warning",
      message: `Payrun structure differs from employee's contract salary structure`,
    });
  }

  return {
    summary: {
      basic,
      totalAllowances,
      gross,
      totalDeductions,
      net,
      workedDays,
      leaveDays,
      unpaidLeaveDays,
    },
    lines: computedLines,
    context,
    warnings,
  };
};
