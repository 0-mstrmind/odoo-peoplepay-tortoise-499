import { logger } from "../../core/config/logger.js";
import type { AppSocket } from "../socket.types.js";
import { registerModuleSocketHandlers } from "../modules/index.js";

// Register connection lifecycle and core socket events
export const registerSocketEvents = (socket: AppSocket): void => {
  const user = socket.data.user;

  if (user) {
    const joinedRooms: string[] = [];

    // 1. Join personal user rooms
    if (user.id) {
      socket.join(`user:${user.id}`);
      joinedRooms.push(`user:${user.id}`);
    }
    if (user.userId && user.userId !== user.id) {
      socket.join(`user:${user.userId}`);
      joinedRooms.push(`user:${user.userId}`);
    }
    if (user.clerkUserId) {
      socket.join(`user:${user.clerkUserId}`);
      joinedRooms.push(`user:${user.clerkUserId}`);
    }

    // 2. Join employee room if associated with an Employee profile
    if (user.employeeId) {
      socket.join(`employee:${user.employeeId}`);
      joinedRooms.push(`employee:${user.employeeId}`);
    }

    // 3. Join tenant/company room for organization-wide broadcasts
    if (user.companyId) {
      const companyRoom = `company:${user.companyId}`;
      socket.join(companyRoom);
      joinedRooms.push(companyRoom);

      // Join tenant-scoped role room: company:COMPANY_ID:role:ROLE
      if (user.role) {
        const tenantRoleRoom = `company:${user.companyId}:role:${user.role.toLowerCase()}`;
        socket.join(tenantRoleRoom);
        joinedRooms.push(tenantRoleRoom);
      }
    }

    // 4. Join role room for role-targeted notifications
    if (user.role) {
      const roleRoom = `role:${user.role.toLowerCase()}`;
      socket.join(roleRoom);
      joinedRooms.push(roleRoom);
    }

    logger.info(`[Socket] User ${user.email} joined rooms: ${joinedRooms.join(", ")}`);
  }

  // Register pluggable module-level socket listeners
  registerModuleSocketHandlers(socket);

  // Handle client-side heartbeat / check event
  socket.on("client:check", (data, callback) => {
    logger.debug(`[Socket] Received client:check from ${socket.id}`, data);
    const response = {
      status: "ok",
      serverTime: new Date().toISOString(),
      socketId: socket.id,
      user: user ? { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId } : null,
      echo: data,
    };

    if (typeof callback === "function") {
      callback(response);
    } else {
      socket.emit("server:check", {
        timestamp: new Date().toISOString(),
        message: "Socket connection healthy",
        payload: response,
      });
    }
  });

  // Handle socket error
  socket.on("error", (error) => {
    logger.error(`[Socket] Error on socket ${socket.id}:`, error);
  });

  // Handle socket disconnect
  socket.on("disconnect", (reason) => {
    logger.info(`[Socket] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
};
