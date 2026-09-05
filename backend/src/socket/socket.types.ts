import type { Socket } from "socket.io";
import type { AuthenticatedUser } from "../shared/types/express.d.js";

export interface SocketUser extends AuthenticatedUser {
  socketId: string;
}

export interface SocketNotificationPayload {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  category?: "timeoff" | "attendance" | "payroll" | "employee" | "system";
  metadata?: unknown;
  timestamp?: string;
}

export interface TimeOffEventPayload {
  requestId: string;
  employeeId: string;
  employeeName?: string;
  timeOffTypeId: string;
  timeOffTypeName?: string;
  startDate: string | Date;
  endDate: string | Date;
  duration: number | string;
  status: "pending" | "approved" | "refused" | "cancelled" | "draft";
  actionBy?: {
    id?: string;
    email?: string;
    role?: string;
  } | null;
  refusalReason?: string | null;
  timestamp: string;
}

export interface AttendanceEventPayload {
  attendanceId: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  workedHours?: number | string | null;
  expectedHours?: number | string | null;
  overtimeHours?: number | string | null;
  status: string;
  isCorrected?: boolean;
  correctionReason?: string | null;
  correctedBy?: string | null;
  actionBy?: {
    id?: string;
    email?: string;
    role?: string;
  } | null;
  timestamp: string;
}

export interface ServerToClientEvents {
  // System / Check
  "server:check": (data: { timestamp: string; message: string; payload?: unknown }) => void;
  "notification": (data: SocketNotificationPayload) => void;

  // Time Off Events
  "timeoff:request:created": (data: TimeOffEventPayload) => void;
  "timeoff:request:approved": (data: TimeOffEventPayload) => void;
  "timeoff:request:refused": (data: TimeOffEventPayload) => void;
  "timeoff:request:cancelled": (data: TimeOffEventPayload) => void;
  "timeoff:request:updated": (data: TimeOffEventPayload) => void;

  // Attendance Events
  "attendance:checkin": (data: AttendanceEventPayload) => void;
  "attendance:checkout": (data: AttendanceEventPayload) => void;
  "attendance:request:created": (data: AttendanceEventPayload) => void;
  "attendance:request:approved": (data: AttendanceEventPayload) => void;
  "attendance:request:refused": (data: AttendanceEventPayload) => void;
  "attendance:updated": (data: AttendanceEventPayload) => void;

  // Catch-all
  [event: string]: (...args: any[]) => void;
}

export interface ClientToServerEvents {
  "client:check": (data: { message?: string }, callback?: (response: unknown) => void) => void;
  "timeoff:subscribe": (data: { employeeId?: string }, callback?: (response: unknown) => void) => void;
  "attendance:subscribe": (data: { employeeId?: string }, callback?: (response: unknown) => void) => void;
  [event: string]: (...args: any[]) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: AuthenticatedUser;
}

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
