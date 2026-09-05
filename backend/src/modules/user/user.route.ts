import { Router } from "express";
import { authMiddleware } from "../../core/middlewares/auth.middleware.js";
import { requireRole } from "../../core/middlewares/rbac.middleware.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
} from "./user.controller.js";

const userRouter = Router();

// Apply router-level security middleware (Admins and HR Managers)
userRouter.use(authMiddleware);
userRouter.use(requireRole("ADMIN", "super_admin", "hr_manager", "hr_payroll_manager"));

userRouter.get("/", getUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);
userRouter.patch("/:id", updateUser);
userRouter.patch("/:id/status", updateUserStatus);

export default userRouter;
