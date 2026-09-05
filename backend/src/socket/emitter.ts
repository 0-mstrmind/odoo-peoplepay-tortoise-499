import { logger } from "../core/config/logger.js";
import { getIO, isSocketInitialized } from "./index.js";

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

/**
 * Convenience helper to emit a check or notification event from any controller or service.
 * Usage in controller:
 *   emitCheck({ message: "Employee updated", payload: { id: employee.id } });
 * or simply:
 *   emitCheck();
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
