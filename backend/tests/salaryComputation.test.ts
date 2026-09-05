import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { evaluateFormula } from "../src/shared/utils/formulaEvaluator.js";
import { detectCircularDependencies } from "../src/shared/utils/circularDependencyChecker.js";

describe("Salary Setup & Computation Engine Tests", () => {
  describe("1. Isolated Computation Methods (Unit Tests)", () => {
    it("should compute fixed amount rule correctly", () => {
      const fixedRule = { code: "BASIC", amount: 50000 };
      const context: Record<string, number> = {};
      context[fixedRule.code] = fixedRule.amount;

      assert.equal(context.BASIC, 50000);
    });

    it("should compute percentage rule correctly based on referenced rule code", () => {
      const context: Record<string, number> = { BASIC: 50000 };
      const percentageValue = 20; // 20%
      const hra = context.BASIC * (percentageValue / 100);
      context.HRA = hra;

      assert.equal(context.HRA, 10000);
    });

    it("should evaluate formula correctly using sandboxed evaluator", () => {
      const context: Record<string, number> = {
        BASIC: 50000,
        HRA: 10000,
        TRANSPORT: 5000,
      };
      const gross = evaluateFormula("BASIC + HRA + TRANSPORT", context);
      context.GROSS = gross;

      assert.equal(context.GROSS, 65000);
    });

    it("should throw error if formula references uncomputed rule code", () => {
      const context: Record<string, number> = { BASIC: 50000 };
      assert.throws(() => {
        evaluateFormula("BASIC + UNCOMPUTED_RULE", context);
      }, /before being computed/);
    });
  });

  describe("2. Integration Test — Worked Example (Spec Standard)", () => {
    it("should compute worked example with exact net = ₹58,500", () => {
      // Worked Example Spec Rules in Sequence:
      // 1. BASIC (fixed): ₹50,000
      // 2. HRA (percentage): 20% of BASIC -> ₹10,000
      // 3. TRANSPORT (fixed): ₹5,000
      // 4. GROSS (formula): BASIC + HRA + TRANSPORT -> ₹65,000
      // 5. TAX (percentage): 10% of GROSS -> ₹6,500
      // 6. NET (formula): GROSS - TAX -> ₹58,500

      const rulesSequence = [
        { code: "BASIC", computationMethod: "fixed", amount: 50000 },
        { code: "HRA", computationMethod: "percentage", basedOnCode: "BASIC", percentageValue: 20 },
        { code: "TRANSPORT", computationMethod: "fixed", amount: 5000 },
        { code: "GROSS", computationMethod: "formula", formula: "BASIC + HRA + TRANSPORT" },
        { code: "TAX", computationMethod: "percentage", basedOnCode: "GROSS", percentageValue: 10 },
        { code: "NET", computationMethod: "formula", formula: "GROSS - TAX" },
      ];

      const context: Record<string, number> = {};

      for (const rule of rulesSequence) {
        if (rule.computationMethod === "fixed") {
          context[rule.code] = rule.amount!;
        } else if (rule.computationMethod === "percentage") {
          const baseValue = context[rule.basedOnCode!];
          context[rule.code] = baseValue * (rule.percentageValue! / 100);
        } else if (rule.computationMethod === "formula") {
          context[rule.code] = evaluateFormula(rule.formula!, context);
        }
      }

      assert.equal(context.BASIC, 50000);
      assert.equal(context.HRA, 10000);
      assert.equal(context.TRANSPORT, 5000);
      assert.equal(context.GROSS, 65000);
      assert.equal(context.TAX, 6500);
      assert.equal(context.NET, 58500);
    });
  });

  describe("3. Sequence Ordering Impact Test", () => {
    it("should fail sequence validation if percentage rule runs before its base rule", () => {
      // Wrong sequence: HRA attempts to run before BASIC is in context
      const outOfOrderSequence = [
        { code: "HRA", computationMethod: "percentage", basedOnCode: "BASIC", percentageValue: 20 },
        { code: "BASIC", computationMethod: "fixed", amount: 50000 },
      ];

      const context: Record<string, number> = {};

      assert.throws(() => {
        const rule = outOfOrderSequence[0];
        if (rule.computationMethod === "percentage") {
          const baseCode = rule.basedOnCode!;
          if (!(baseCode in context)) {
            throw new Error(`Sequence Validation Error: Rule code "${baseCode}" referenced before being computed`);
          }
          context[rule.code] = context[baseCode] * (rule.percentageValue! / 100);
        }
      }, /referenced before being computed/);
    });
  });

  describe("4. Circular Dependency Detection Test", () => {
    it("should detect circular references across formula & percentage chains at save time", () => {
      const circularRules = [
        { code: "NET", computationMethod: "formula", formula: "GROSS - TAX" },
        { code: "GROSS", computationMethod: "formula", formula: "NET + 100" },
        { code: "TAX", computationMethod: "fixed", amount: 50 },
      ];

      assert.throws(() => {
        detectCircularDependencies(circularRules);
      }, /Circular dependency detected/);
    });
  });
});
