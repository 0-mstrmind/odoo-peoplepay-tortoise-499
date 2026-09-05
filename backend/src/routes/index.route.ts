import { Router } from "express";

import authRoutes from "../modules/auth/auth.route.js";
import employeeRoutes from "../modules/employee/employee.route.js";
import { ruleRouter, structureRouter } from "../modules/salary/salary.route.js";
import workingScheduleRoutes from "../modules/working-schedule/working-schedule.route.js";

/* <NEATNODE_IMPORTS> */
// Reserved for NeatNode file generation. Do not remove or modify.

const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/salary-structures", structureRouter);
router.use("/salary-rules", ruleRouter);
router.use("/working-schedules", workingScheduleRoutes);

/* <NEATNODE_ROUTES> */
// Reserved for NeatNode file generation. Do not remove or modify.

export default router;
