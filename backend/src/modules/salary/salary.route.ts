import { Router } from "express";

import {
  addStructureRule,
  createSalaryRule,
  createSalaryStructure,
  deleteSalaryRule,
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

// Salary Structures Routes
export const structureRouter = Router();
structureRouter.get("/", clerkAuthMiddleware, listSalaryStructures);
structureRouter.get("/:id", clerkAuthMiddleware, getSalaryStructure);
structureRouter.post("/", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(createSalaryStructureSchema), createSalaryStructure);
structureRouter.put("/:id", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(updateSalaryStructureSchema), updateSalaryStructure);

structureRouter.post("/:id/rules", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(addStructureRuleSchema), addStructureRule);
structureRouter.put("/:id/rules/:ruleId", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(updateStructureRuleSequenceSchema), updateStructureRule);
structureRouter.delete("/:id/rules/:ruleId", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), removeStructureRule);

// Salary Rules Routes
export const ruleRouter = Router();
ruleRouter.get("/", clerkAuthMiddleware, listSalaryRules);
ruleRouter.get("/:id", clerkAuthMiddleware, getSalaryRule);
ruleRouter.post("/", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(createSalaryRuleSchema), createSalaryRule);
ruleRouter.put("/:id", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), validateBody(updateSalaryRuleSchema), updateSalaryRule);
ruleRouter.delete("/:id", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), deleteSalaryRule);

export default router;
