import { Router } from "express";
import { createCompany, getCompany, updateCompany, listCompanies } from "./company.controller.js";
import { clerkAuthMiddleware } from "../../core/middlewares/clerk.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";

const router = Router();

// Public / Registration endpoint
router.post("/", createCompany);

// Authenticated endpoints
router.get("/me", clerkAuthMiddleware, getCompany);
router.put("/me", clerkAuthMiddleware, requireRole("admin", "hr_payroll_manager"), updateCompany);
router.get("/", clerkAuthMiddleware, requireRole("admin", "super_admin"), listCompanies);

export default router;
