import { Router } from "express";

import {
  addStructureRule,
  createSalaryRule,
  createSalaryStructure,
  deleteSalaryRule,
  deleteSalaryStructure,
  getSalaryRule,
  getSalaryStructure,
  listSalaryRules,
  listSalaryStructures,
  removeStructureRule,
  updateSalaryRule,
  updateSalaryStructure,
  updateStructureRule,
} from "./salary.controller.js";
import {
  addStructureRuleSchema,
  createSalaryRuleSchema,
  createSalaryStructureSchema,
  updateSalaryRuleSchema,
  updateSalaryStructureSchema,
  updateStructureRuleSequenceSchema,
} from "./salary.validation.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { validateBody } from "../../core/middlewares/validateRequest.middleware.js";

const router = Router();

// Only admin and hr_payroll_manager can mutate salary structures/rules
// hr_payroll_user has read-only access (GET routes have no requireRole guard)
const PAYROLL_WRITE_ROLES = ["admin", "hr_payroll_manager"];

// Salary Structures Routes
export const structureRouter = Router();
structureRouter.get("/", clerkAuthMiddleware, listSalaryStructures);
structureRouter.get("/:id", clerkAuthMiddleware, getSalaryStructure);
structureRouter.post("/", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(createSalaryStructureSchema), createSalaryStructure);
structureRouter.put("/:id", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(updateSalaryStructureSchema), updateSalaryStructure);
structureRouter.delete("/:id", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), deleteSalaryStructure);

structureRouter.post("/:id/rules", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(addStructureRuleSchema), addStructureRule);
structureRouter.put("/:id/rules/:ruleId", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(updateStructureRuleSequenceSchema), updateStructureRule);
structureRouter.delete("/:id/rules/:ruleId", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), removeStructureRule);

// Salary Rules Routes
export const ruleRouter = Router();
ruleRouter.get("/", clerkAuthMiddleware, listSalaryRules);
ruleRouter.get("/:id", clerkAuthMiddleware, getSalaryRule);
ruleRouter.post("/", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(createSalaryRuleSchema), createSalaryRule);
ruleRouter.put("/:id", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), validateBody(updateSalaryRuleSchema), updateSalaryRule);
ruleRouter.delete("/:id", clerkAuthMiddleware, requireRole(...PAYROLL_WRITE_ROLES), deleteSalaryRule);

export default router;
