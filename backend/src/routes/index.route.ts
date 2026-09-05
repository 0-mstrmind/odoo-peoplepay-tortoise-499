import { Router } from "express";

import authRoutes from "../modules/auth/auth.route.js";
import employeeRoutes from "../modules/employee/employee.route.js";

/* <NEATNODE_IMPORTS> */
// Reserved for NeatNode file generation. Do not remove or modify.

const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);

/* <NEATNODE_ROUTES> */
// Reserved for NeatNode file generation. Do not remove or modify.

export default router;
