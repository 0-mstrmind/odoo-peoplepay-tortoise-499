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

const router = Router();

router.use(clerkAuthMiddleware);

router.post(
  "/",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  validateBody(createContractSchema.shape.body),
  createContractHandler,
);

router.get(
  "/",
  requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"),
  getContractsHandler,
);

router.patch(
  "/:id",
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  validateParams(updateContractSchema.shape.params),
  validateBody(updateContractSchema.shape.body),
  updateContractHandler,
);

export default router;
