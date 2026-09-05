/**
 * Socket Modules Registry
 *
 * Pluggable socket event listeners organized by feature module:
 *   - timeoff: leave requests, approvals, declinations
 *   - attendance: checkin, checkout, requests, approvals, declinations
 */

import type { AppSocket } from "../socket.types.js";
import { registerTimeOffSocket } from "./timeoff/timeoff.socket.js";
import { registerAttendanceSocket } from "./attendance/attendance.socket.js";

export const registerModuleSocketHandlers = (socket: AppSocket): void => {
  // Register Time Off socket event listeners
  registerTimeOffSocket(socket);

  // Register Attendance socket event listeners
  registerAttendanceSocket(socket);
};
