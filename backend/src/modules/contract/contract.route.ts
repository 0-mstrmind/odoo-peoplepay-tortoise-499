import { Router } from "express";

import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { validateBody, validateParams } from "../../core/middlewares/validateRequest.middleware.js";
import {
  createContractHandler,
  getContractsHandler,
  updateContractHandler,
} from "./contract.controller.js";
import { createContractSchema, updateContractSchema } from "./contract.validation.js";

// Roles allowed to manage contracts.
// hr_payroll_user inherits full hr_manager permissions per business rules.
const CONTRACT_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"] as const;

const router = Router();

router.use(clerkAuthMiddleware);

router.post(
  "/",
  requireRole(...CONTRACT_ROLES),
  validateBody(createContractSchema.shape.body),
  createContractHandler,
);

router.get(
  "/",
  requireRole(...CONTRACT_ROLES),
  getContractsHandler,
);

router.patch(
  "/:id",
  requireRole(...CONTRACT_ROLES),
  validateParams(updateContractSchema.shape.params),
  validateBody(updateContractSchema.shape.body),
  updateContractHandler,
);

export default router;
