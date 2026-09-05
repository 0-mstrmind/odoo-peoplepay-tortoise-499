import { logger } from "../core/config/logger.js";
import { getIO, isSocketInitialized } from "./index.js";
import type { SocketNotificationPayload } from "./socket.types.js";

export interface EmitCheckParams {
  event?: string;
  message?: string;
  payload?: unknown;
  target?: {
    userId?: string;
    companyId?: string;
    role?: string;
  };
}

export interface NotifyEmployeeAndRolesParams<T = unknown> {
  companyId?: string | null;
  employeeId?: string | null;
  employeeUserId?: string | null;
  event: string;
  data: T;
  notification?: {
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    category?: "timeoff" | "attendance" | "payroll" | "employee" | "system";
  };
  authorizedRoles?: string[];
}

/**
 * Convenience helper to emit a check or notification event from any controller or service.
 */
export const emitCheck = (params?: EmitCheckParams): boolean => {
  try {
    if (!isSocketInitialized()) {
      logger.debug("[Socket:emitCheck] Socket server not initialized, skipping emit");
      return false;
    }

    const io = getIO();
    const event = params?.event || "server:check";
    const data = {
      timestamp: new Date().toISOString(),
      message: params?.message || "Socket check emitted from controller",
      payload: params?.payload ?? null,
    };

    if (params?.target?.userId) {
      io.to(`user:${params.target.userId}`).emit(event, data);
      logger.debug(`[Socket:emitCheck] Emitted '${event}' to user:${params.target.userId}`);
    } else if (params?.target?.companyId) {
      io.to(`company:${params.target.companyId}`).emit(event, data);
      logger.debug(`[Socket:emitCheck] Emitted '${event}' to company:${params.target.companyId}`);
    } else if (params?.target?.role) {
      io.to(`role:${params.target.role.toLowerCase()}`).emit(event, data);
      logger.debug(`[Socket:emitCheck] Emitted '${event}' to role:${params.target.role}`);
    } else {
      io.emit(event, data);
      logger.debug(`[Socket:emitCheck] Broadcasted '${event}' to all connected clients`);
    }

    return true;
  } catch (error) {
    logger.warn("[Socket:emitCheck] Failed to emit check event:", error);
    return false;
  }
};

/**
 * Emit an event to a specific user's private room.
 */
export const emitToUser = (userId: string, event: string, data: unknown): boolean => {
  return emitCheck({
    event,
    payload: data,
    target: { userId },
  });
};

/**
 * Emit an event to a tenant company room.
 */
export const emitToCompany = (companyId: string, event: string, data: unknown): boolean => {
  return emitCheck({
    event,
    payload: data,
    target: { companyId },
  });
};

/**
 * Emit an event to all users with a specific role.
 */
export const emitToRole = (role: string, event: string, data: unknown): boolean => {
  return emitCheck({
    event,
    payload: data,
    target: { role },
  });
};

/**
 * Broadcast an event to all connected clients.
 */
export const emitBroadcast = (event: string, data: unknown): boolean => {
  return emitCheck({
    event,
    payload: data,
  });
};

/**
 * Dispatches an event and notification to BOTH the individual employee and authorized managerial roles.
 * Authorised roles default to ['admin', 'hr_manager', 'hr_payroll_manager'].
 */
export const notifyEmployeeAndAuthorizedRoles = <T = unknown>(
  params: NotifyEmployeeAndRolesParams<T>,
): boolean => {
  try {
    if (!isSocketInitialized()) {
      logger.debug("[Socket:notify] Socket server not initialized, skipping emit");
      return false;
    }

    const io = getIO();
    const {
      companyId,
      employeeId,
      employeeUserId,
      event,
      data,
      notification,
      authorizedRoles = ["admin", "hr_manager", "hr_payroll_manager"],
    } = params;

    const notificationPayload: SocketNotificationPayload | undefined = notification
      ? {
          title: notification.title,
          message: notification.message,
          type: notification.type || "info",
          category: notification.category || "system",
          metadata: data,
          timestamp: new Date().toISOString(),
        }
      : undefined;

    // 1. Emit to Employee rooms (by userId and employeeId)
    if (employeeUserId) {
      const room = `user:${employeeUserId}`;
      io.to(room).emit(event, data);
      if (notificationPayload) io.to(room).emit("notification", notificationPayload);
      logger.debug(`[Socket:notify] Emitted '${event}' to employee room: ${room}`);
    }

    if (employeeId) {
      const room = `employee:${employeeId}`;
      io.to(room).emit(event, data);
      if (notificationPayload) io.to(room).emit("notification", notificationPayload);
      logger.debug(`[Socket:notify] Emitted '${event}' to employee room: ${room}`);
    }

    // 2. Emit to Authorized Role rooms (tenant-scoped and global role rooms)
    for (const role of authorizedRoles) {
      const normalizedRole = role.toLowerCase();

      // Scoped tenant role room
      if (companyId) {
        const tenantRoleRoom = `company:${companyId}:role:${normalizedRole}`;
        io.to(tenantRoleRoom).emit(event, data);
        if (notificationPayload) io.to(tenantRoleRoom).emit("notification", notificationPayload);
      }

      // Global role room
      const roleRoom = `role:${normalizedRole}`;
      io.to(roleRoom).emit(event, data);
      if (notificationPayload) io.to(roleRoom).emit("notification", notificationPayload);
    }

    logger.info(
      `[Socket:notify] Event '${event}' delivered to employee (${employeeId || employeeUserId}) and roles (${authorizedRoles.join(", ")})`,
    );
    return true;
  } catch (error) {
    logger.warn(`[Socket:notify] Error dispatching event '${params.event}':`, error);
    return false;
  }
};
