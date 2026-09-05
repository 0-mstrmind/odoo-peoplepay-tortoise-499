/**
 * Socket Modules Registry
 *
 * Pluggable socket event listeners organized by feature module:
 *   - timeoff: leave requests, approvals, declinations
 *   - attendance: checkin, checkout, requests, approvals, declinations
 *   - payroll: payrun status transitions, computation progress, employee payslip notifications
 */

import type { AppSocket } from "../socket.types.js";
import { registerTimeOffSocket } from "./timeoff/timeoff.socket.js";
import { registerAttendanceSocket } from "./attendance/attendance.socket.js";
import { registerPayrollSocket } from "./payroll/payroll.socket.js";

export const registerModuleSocketHandlers = (socket: AppSocket): void => {
  // Register Time Off socket event listeners
  registerTimeOffSocket(socket);

  // Register Attendance socket event listeners
  registerAttendanceSocket(socket);

  // Register Payroll socket event listeners
  registerPayrollSocket(socket);
};
