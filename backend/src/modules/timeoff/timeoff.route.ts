import { Router } from "express";
import {
  getTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  getTimeOffAllocations,
  getTimeOffAllocationById,
  createTimeOffAllocation,
  approveTimeOffAllocation,
  refuseTimeOffAllocation,
  getTimeOffRequests,
  getTimeOffRequestById,
  createTimeOffRequest,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  updateTimeOffRequest,
  cancelTimeOffRequest,
} from "./timeoff.controller.js";
import {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  createAllocationSchema,
  createRequestSchema,
  updateRequestSchema,
  refuseRequestSchema,
} from "./timeoff.validation.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import { validateBody } from "../../core/middlewares/validateRequest.middleware.js";

// Router for /time-off-types
export const timeOffTypeRouter = Router();
timeOffTypeRouter.get("/", clerkAuthMiddleware, getTimeOffTypes);
timeOffTypeRouter.get("/:id", clerkAuthMiddleware, getTimeOffTypeById);
timeOffTypeRouter.post(
  "/",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  validateBody(createTimeOffTypeSchema),
  createTimeOffType,
);
timeOffTypeRouter.put(
  "/:id",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  validateBody(updateTimeOffTypeSchema),
  updateTimeOffType,
);
timeOffTypeRouter.delete(
  "/:id",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  deleteTimeOffType,
);

// Router for /time-off-allocations
export const timeOffAllocationRouter = Router();
timeOffAllocationRouter.get("/", clerkAuthMiddleware, getTimeOffAllocations);
timeOffAllocationRouter.get("/:id", clerkAuthMiddleware, getTimeOffAllocationById);
timeOffAllocationRouter.post(
  "/",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  validateBody(createAllocationSchema),
  createTimeOffAllocation,
);
timeOffAllocationRouter.put(
  "/:id/approve",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  approveTimeOffAllocation,
);
timeOffAllocationRouter.put(
  "/:id/refuse",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  refuseTimeOffAllocation,
);

// Router for /time-off-requests
export const timeOffRequestRouter = Router();
timeOffRequestRouter.get("/", clerkAuthMiddleware, getTimeOffRequests);
timeOffRequestRouter.get("/:id", clerkAuthMiddleware, getTimeOffRequestById);
timeOffRequestRouter.post(
  "/",
  clerkAuthMiddleware,
  validateBody(createRequestSchema),
  createTimeOffRequest,
);
timeOffRequestRouter.put(
  "/:id/approve",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  approveTimeOffRequest,
);
timeOffRequestRouter.put(
  "/:id/refuse",
  clerkAuthMiddleware,
  requireRole("admin", "hr_manager"),
  validateBody(refuseRequestSchema),
  refuseTimeOffRequest,
);
timeOffRequestRouter.put(
  "/:id/cancel",
  clerkAuthMiddleware,
  cancelTimeOffRequest,
);
timeOffRequestRouter.put(
  "/:id",
  clerkAuthMiddleware,
  validateBody(updateRequestSchema),
  updateTimeOffRequest,
);
