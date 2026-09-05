import { Router } from "express";

import authRoutes from "../modules/auth/auth.route.js";
<<<<<<< HEAD
import contractRoutes from "../modules/contract/contract.route.js";
=======
import employeeRoutes from "../modules/employee/employee.route.js";
import { ruleRouter, structureRouter } from "../modules/salary/salary.route.js";
import workingScheduleRoutes from "../modules/working-schedule/working-schedule.route.js";
>>>>>>> 011fd478bcb0ee1734b862ac0e30633c1be7625f

/* <NEATNODE_IMPORTS> */
// Reserved for NeatNode file generation. Do not remove or modify.

const router = Router();

router.use("/auth", authRoutes);
<<<<<<< HEAD
router.use("/contracts", contractRoutes);
=======
router.use("/employees", employeeRoutes);
router.use("/salary-structures", structureRouter);
router.use("/salary-rules", ruleRouter);
router.use("/working-schedules", workingScheduleRoutes);
>>>>>>> 011fd478bcb0ee1734b862ac0e30633c1be7625f

/* <NEATNODE_ROUTES> */
// Reserved for NeatNode file generation. Do not remove or modify.

export default router;
