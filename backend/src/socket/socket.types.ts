import type { Socket } from "socket.io";
import type { AuthenticatedUser } from "../shared/types/express.d.js";

export interface SocketUser extends AuthenticatedUser {
  socketId: string;
}

export interface ServerToClientEvents {
  "server:check": (data: { timestamp: string; message: string; payload?: unknown }) => void;
  "notification": (data: { title: string; message: string; type?: string; metadata?: unknown }) => void;
  [event: string]: (...args: any[]) => void;
}

export interface ClientToServerEvents {
  "client:check": (data: { message?: string }, callback?: (response: unknown) => void) => void;
  [event: string]: (...args: any[]) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: AuthenticatedUser;
}

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
