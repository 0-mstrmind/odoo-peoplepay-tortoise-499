import { logger } from "../../core/config/logger.js";
import type { AppSocket } from "../socket.types.js";
import { registerModuleSocketHandlers } from "../modules/index.js";

// Register connection lifecycle and core socket events
export const registerSocketEvents = (socket: AppSocket): void => {
  const user = socket.data.user;

  if (user) {
    // 1. Join personal user room for direct notifications
    const userRoom = `user:${user.id}`;
    socket.join(userRoom);

    // 2. Join tenant/company room for organization-wide broadcasts
    if (user.companyId) {
      const companyRoom = `company:${user.companyId}`;
      socket.join(companyRoom);
    }

    // 3. Join role room for role-targeted notifications (e.g. role:admin, role:hr_manager)
    if (user.role) {
      const roleRoom = `role:${user.role.toLowerCase()}`;
      socket.join(roleRoom);
    }

    logger.info(`[Socket] User ${user.email} joined rooms: user:${user.id}, role:${user.role}`);
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
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
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
