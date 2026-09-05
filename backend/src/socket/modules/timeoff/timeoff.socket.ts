import { logger } from "../../../core/config/logger.js";
import type { AppSocket, TimeOffEventPayload } from "../../socket.types.js";
import { notifyEmployeeAndAuthorizedRoles } from "../../emitter.js";

/**
 * Socket listener registration for Time Off module
 */
export const registerTimeOffSocket = (socket: AppSocket): void => {
  const user = socket.data.user;

  // Allow client to subscribe to specific employee's time-off updates (e.g. if manager is viewing that employee's tab)
  socket.on("timeoff:subscribe", (data, callback) => {
    try {
      if (data?.employeeId) {
        const room = `employee:${data.employeeId}`;
        socket.join(room);
        logger.debug(`[Socket:TimeOff] Socket ${socket.id} subscribed to ${room}`);
      }

      if (typeof callback === "function") {
        callback({ success: true, subscribed: data?.employeeId || user?.employeeId || null });
      }
    } catch (err) {
      logger.error("[Socket:TimeOff] Error in timeoff:subscribe:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Subscription failed" });
      }
    }
  });
};

/**
 * High-level socket emitter helpers for Time Off requests
 */
export const emitTimeOffRequestCreated = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: TimeOffEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "timeoff:request:created",
    data: payload,
    notification: {
      title: "New Time Off Request",
      message: `${payload.employeeName || "An employee"} requested ${payload.duration} ${payload.timeOffTypeName || "leave"} day(s)`,
      type: "info",
      category: "timeoff",
    },
  });
};

export const emitTimeOffRequestApproved = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: TimeOffEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "timeoff:request:approved",
    data: payload,
    notification: {
      title: "Time Off Request Approved",
      message: `Time off request for ${payload.duration} day(s) has been approved`,
      type: "success",
      category: "timeoff",
    },
  });
};

export const emitTimeOffRequestRefused = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: TimeOffEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "timeoff:request:refused",
    data: payload,
    notification: {
      title: "Time Off Request Declined",
      message: `Time off request was declined${payload.refusalReason ? `: ${payload.refusalReason}` : ""}`,
      type: "warning",
      category: "timeoff",
    },
  });
};

export const emitTimeOffRequestCancelled = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: TimeOffEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "timeoff:request:cancelled",
    data: payload,
    notification: {
      title: "Time Off Request Cancelled",
      message: `Time off request for ${payload.duration} day(s) was cancelled`,
      type: "info",
      category: "timeoff",
    },
  });
};

export const emitTimeOffRequestUpdated = (
  companyId: string,
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: TimeOffEventPayload,
): void => {
  notifyEmployeeAndAuthorizedRoles({
    companyId,
    employeeId,
    employeeUserId,
    event: "timeoff:request:updated",
    data: payload,
    notification: {
      title: "Time Off Request Updated",
      message: `Time off request details have been updated`,
      type: "info",
      category: "timeoff",
    },
  });
};
