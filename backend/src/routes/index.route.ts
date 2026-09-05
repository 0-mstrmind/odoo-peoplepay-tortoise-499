import { Router } from "express";

import authRoutes from "../modules/auth/auth.route.js";
import companyRoutes from "../modules/company/company.route.js";
import employeeRoutes from "../modules/employee/employee.route.js";
import contractRoutes from "../modules/contract/contract.route.js";
import { ruleRouter, structureRouter } from "../modules/salary/salary.route.js";
import workingScheduleRoutes from "../modules/working-schedule/working-schedule.route.js";
import dashboardRoutes from "../modules/dashboard/dashboard.route.js";
import {
  timeOffAllocationRouter,
  timeOffRequestRouter,
  timeOffTypeRouter,
} from "../modules/timeoff/timeoff.route.js";
import attendanceRoutes from "../modules/attendance/attendance.route.js";
import { payrunRouter, payslipRouter } from "../modules/payroll/payroll.route.js";
import userRouter from "../modules/user/user.route.js";

/* <NEATNODE_IMPORTS> */
// Reserved for NeatNode file generation. Do not remove or modify.

const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", userRouter);
router.use("/contracts", contractRoutes);
router.use("/salary-structures", structureRouter);
router.use("/salary-rules", ruleRouter);
router.use("/working-schedules", workingScheduleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/time-off-types", timeOffTypeRouter);
router.use("/time-off-allocations", timeOffAllocationRouter);
router.use("/time-off-requests", timeOffRequestRouter);
router.use("/attendance", attendanceRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/companies", companyRoutes);
router.use("/payruns", payrunRouter);
router.use("/payslips", payslipRouter);

/* <NEATNODE_ROUTES> */
// Reserved for NeatNode file generation. Do not remove or modify.

export default router;
