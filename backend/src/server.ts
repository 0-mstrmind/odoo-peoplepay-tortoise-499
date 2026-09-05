import http from "node:http";
import app from "./app.js";
import { connectDB } from "./core/config/db.js";
import { env } from "./core/config/env.js";
import { logger } from "./core/config/logger.js";
import { initSocket } from "./socket/index.js";

const startServer = async (): Promise<void> => {
  await connectDB();

  // Create HTTP server wrapping Express app
  const httpServer = http.createServer(app);

  // Initialize Socket.io with handshake verification middleware and events
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Socket.io ready on ws://localhost:${env.PORT}`);
  });
};

startServer().catch((error: unknown) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
