/**
 * Socket Modules Registry
 *
 * This directory mirrors the backend modules structure (e.g. employee, attendance, payroll, dashboard).
 * As real-time features for individual modules are developed, add corresponding module handlers here:
 *   - socket/modules/employee/
 *   - socket/modules/attendance/
 *   - socket/modules/payroll/
 *
 * To register module event listeners, create a handler function taking `(socket: AppSocket)`
 * and call it inside `registerSocketEvents` in `socket/events/index.ts`.
 */

import type { AppSocket } from "../socket.types.js";

export const registerModuleSocketHandlers = (_socket: AppSocket): void => {
  // Reserved for module-specific real-time event listeners.
  // Modules can be plugged in here without polluting core socket configuration.
};
