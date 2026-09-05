import { logger } from "../../../core/config/logger.js";
import type { AppSocket, AttendanceEventPayload } from "../../socket.types.js";
import { notifyEmployeeAndAuthorizedRoles } from "../../emitter.js";

/**
 * Socket listener registration for Attendance module
 */
export const registerAttendanceSocket = (socket: AppSocket): void => {
  const user = socket.data.user;

  // Allow client to subscribe to specific employee's attendance updates
  socket.on("attendance:subscribe", (data, callback) => {
    try {
      if (data?.employeeId) {
        const room = `employee:${data.employeeId}`;
        socket.join(room);
        logger.debug(`[Socket:Attendance] Socket ${socket.id} subscribed to ${room}`);
      }

      if (typeof callback === "function") {
        callback({ success: true, subscribed: data?.employeeId || user?.employeeId || null });
      }
    } catch (err) {
      logger.error("[Socket:Attendance] Error in attendance:subscribe:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Subscription failed" });
      }
    }
  });
};

/**
 * High-level socket emitter helpers for Attendance requests and actions
 */
export const emitAttendanceCheckIn = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:checkin",
    data: payload,
    notification: {
      title: "Attendance Check-In",
      message: `${payload.employeeName || "Employee"} checked in successfully`,
      type: "info",
      category: "attendance",
    },
  });
};

export const emitAttendanceCheckOut = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:checkout",
    data: payload,
    notification: {
      title: "Attendance Check-Out",
      message: `${payload.employeeName || "Employee"} checked out (${payload.workedHours || 0} hrs worked)`,
      type: "info",
      category: "attendance",
    },
  });
};

export const emitAttendanceRequestCreated = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:request:created",
    data: payload,
    notification: {
      title: "Attendance Request Submitted",
      message: `${payload.employeeName || "Employee"} submitted an attendance entry/correction request`,
      type: "info",
      category: "attendance",
    },
  });
};

export const emitAttendanceRequestApproved = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:request:approved",
    data: payload,
    notification: {
      title: "Attendance Request Accepted",
      message: `Attendance request has been accepted and updated`,
      type: "success",
      category: "attendance",
    },
  });
};

export const emitAttendanceRequestRefused = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:request:refused",
    data: payload,
    notification: {
      title: "Attendance Request Declined",
      message: `Attendance request has been declined${payload.correctionReason ? `: ${payload.correctionReason}` : ""}`,
      type: "warning",
      category: "attendance",
    },
  });
};

export const emitAttendanceUpdated = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: AttendanceEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "attendance:updated",
    data: payload,
    notification: {
      title: "Attendance Record Updated",
      message: `Attendance record has been updated by authorized staff`,
      type: "info",
      category: "attendance",
    },
  });
};
