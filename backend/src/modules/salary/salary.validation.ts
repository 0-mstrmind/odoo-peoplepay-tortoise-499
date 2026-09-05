import { z } from "zod";

export const categoryEnum = z.enum(["basic", "allowance", "gross", "deduction", "net"]);
export const computationMethodEnum = z.enum(["fixed", "percentage", "formula"]);

export const createSalaryRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required").regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Code must contain alphanumeric characters or underscores only"),
    category: categoryEnum,
    sequence: z.number().int().optional().default(1),
    computationMethod: computationMethodEnum,
    amount: z.number().optional().nullable(),
    percentageValue: z.number().optional().nullable(),
    basedOnCode: z.string().optional().nullable(),
    formula: z.string().optional().nullable(),
    appearsOnPayslip: z.boolean().optional().default(true),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.computationMethod === "fixed") {
      if (data.amount === undefined || data.amount === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "amount is required when computationMethod is fixed",
          path: ["amount"],
        });
      }
    } else if (data.computationMethod === "percentage") {
      if (data.percentageValue === undefined || data.percentageValue === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "percentageValue is required when computationMethod is percentage",
          path: ["percentageValue"],
        });
      }
      if (!data.basedOnCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "basedOnCode is required when computationMethod is percentage",
          path: ["basedOnCode"],
        });
      }
    } else if (data.computationMethod === "formula") {
      if (!data.formula || data.formula.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "formula is required when computationMethod is formula",
          path: ["formula"],
        });
      }
    }
  });

export const updateSalaryRuleSchema = z.object({
  name: z.string().min(1).optional(),
  category: categoryEnum.optional(),
  sequence: z.number().int().optional(),
  computationMethod: computationMethodEnum.optional(),
  amount: z.number().optional().nullable(),
  percentageValue: z.number().optional().nullable(),
  basedOnCode: z.string().optional().nullable(),
  formula: z.string().optional().nullable(),
  appearsOnPayslip: z.boolean().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateSalaryStructureSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const addStructureRuleSchema = z.object({
  ruleId: z.string().uuid("Invalid ruleId format"),
  sequence: z.number().int(),
});

export const updateStructureRuleSequenceSchema = z.object({
  sequence: z.number().int(),
});
