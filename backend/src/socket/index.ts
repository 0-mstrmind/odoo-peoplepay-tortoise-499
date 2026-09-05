import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { logger } from "../core/config/logger.js";
import { socketAuthMiddleware } from "./middlewares/socketAuth.middleware.js";
import { registerSocketEvents } from "./events/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  AppSocket,
} from "./socket.types.js";

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

// Initialize Socket.io server attached to the Node HTTP server
export const initSocket = (
  httpServer: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  if (io) {
    logger.warn("[Socket] Socket.io server already initialized");
    return io;
  }

  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // Apply Handshake & Identity Verification Middleware
  io.use((socket, next) => {
    socketAuthMiddleware(socket as AppSocket, next);
  });

  // Register Connection Handler
  io.on("connection", (socket) => {
    logger.info(`[Socket] New client connected: ${socket.id}`);
    registerSocketEvents(socket as AppSocket);
  });

  logger.info("[Socket] Socket.io initialized with handshake authentication middleware");
  return io;
};

// Singleton getter to retrieve IO instance anywhere across services & controllers
export const getIO = (): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  if (!io) {
    throw new Error("[Socket] Socket.io has not been initialized. Call initSocket(httpServer) first.");
  }
  return io;
};

// Check if socket is initialized without throwing
export const isSocketInitialized = (): boolean => {
  return io !== null;
};
