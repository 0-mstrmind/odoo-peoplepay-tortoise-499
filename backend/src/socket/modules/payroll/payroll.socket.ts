import { logger } from "../../../core/config/logger.js";
import { getIO, isSocketInitialized } from "../../index.js";
import type {
  AppSocket,
  PayrunEventPayload,
  PayslipAvailablePayload,
} from "../../socket.types.js";

/**
 * Register client-side socket subscriptions for Payroll
 */
export const registerPayrollSocket = (socket: AppSocket): void => {
  socket.on("payroll:subscribe", (data, callback) => {
    try {
      if (data?.payrunId) {
        const room = `payrun:${data.payrunId}`;
        socket.join(room);
        logger.debug(`[Socket:Payroll] Socket ${socket.id} subscribed to ${room}`);
      }

      if (typeof callback === "function") {
        callback({ success: true, subscribed: data?.payrunId || null });
      }
    } catch (err) {
      logger.error("[Socket:Payroll] Error in payroll:subscribe:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Subscription failed" });
      }
    }
  });
};

/**
 * Emits dashboard invalidation event so live KPI cards refresh immediately
 */
export const emitDashboardMetricsInvalidated = (
  companyId: string,
  reason: string,
  metadata?: unknown,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();
  const payload = {
    reason,
    timestamp: new Date().toISOString(),
    metadata,
  };

  io.to(`company:${companyId}`).emit("dashboard:metrics:invalidated", payload);
  logger.debug(`[Socket:Dashboard] Invalidation emitted for company:${companyId} (Reason: ${reason})`);
};

/**
 * Emits general payrun status change event to company and authorized payroll roles
 */
export const emitPayrunStatusChanged = (
  companyId: string,
  payload: PayrunEventPayload,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();

  const roles = ["admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"];
  for (const role of roles) {
    io.to(`company:${companyId}:role:${role}`).emit("payroll:payrun:status_changed", payload);
    io.to(`role:${role}`).emit("payroll:payrun:status_changed", payload);
  }
  io.to(`payrun:${payload.payrunId}`).emit("payroll:payrun:status_changed", payload);

  emitDashboardMetricsInvalidated(companyId, `Payrun status changed to ${payload.status}`, {
    payrunId: payload.payrunId,
    status: payload.status,
  });
};

/**
 * Emits payrun computed event with totals and warnings summary
 */
export const emitPayrunComputed = (
  companyId: string,
  payload: PayrunEventPayload,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();

  const roles = ["admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"];
  for (const role of roles) {
    const targetRoom = `company:${companyId}:role:${role}`;
    io.to(targetRoom).emit("payroll:payrun:computed", payload);
    io.to(`role:${role}`).emit("payroll:payrun:computed", payload);

    io.to(targetRoom).emit("notification", {
      title: "Payrun Computation Complete",
      message: `Batch '${payload.name}' computed for ${payload.totalEmployees || 0} employees (Net: ${payload.totalNet || 0})`,
      type: "info",
      category: "payroll",
      metadata: payload,
      timestamp: new Date().toISOString(),
    });
  }

  emitPayrunStatusChanged(companyId, payload);
};

/**
 * Emits payrun validated event when approved by authorized personnel
 */
export const emitPayrunValidated = (
  companyId: string,
  payload: PayrunEventPayload,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();

  const roles = ["admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"];
  for (const role of roles) {
    const targetRoom = `company:${companyId}:role:${role}`;
    io.to(targetRoom).emit("payroll:payrun:validated", payload);
    io.to(`role:${role}`).emit("payroll:payrun:validated", payload);

    io.to(targetRoom).emit("notification", {
      title: "Payrun Validated",
      message: `Batch '${payload.name}' has been validated and finalized for payout.`,
      type: "success",
      category: "payroll",
      metadata: payload,
      timestamp: new Date().toISOString(),
    });
  }

  emitPayrunStatusChanged(companyId, payload);
};

/**
 * Emits payrun paid event when disbursements are completed.
 * Simultaneously sends targeted notifications to ALL affected employees!
 */
export const emitPayrunPaid = (
  companyId: string,
  payload: PayrunEventPayload,
  employeePayslips?: Array<{
    employeeId: string;
    employeeUserId?: string | null;
    payslipId: string;
    netSalary: number | string;
    periodLabel?: string | null;
    periodStart: string | Date;
    periodEnd: string | Date;
  }>,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();

  // 1. Notify authorized payroll roles
  const roles = ["admin", "hr_payroll_manager", "hr_payroll_user", "hr_manager"];
  for (const role of roles) {
    const targetRoom = `company:${companyId}:role:${role}`;
    io.to(targetRoom).emit("payroll:payrun:paid", payload);
    io.to(`role:${role}`).emit("payroll:payrun:paid", payload);

    io.to(targetRoom).emit("notification", {
      title: "Payrun Marked as Paid",
      message: `Payrun '${payload.name}' marked as paid. Total payout: ${payload.totalNet || 0}.`,
      type: "success",
      category: "payroll",
      metadata: payload,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Notify every individual employee that their payslip is available
  if (employeePayslips && employeePayslips.length > 0) {
    for (const item of employeePayslips) {
      const payslipPayload: PayslipAvailablePayload = {
        payslipId: item.payslipId,
        payrunId: payload.payrunId,
        employeeId: item.employeeId,
        periodLabel: item.periodLabel || payload.periodLabel,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        netSalary: item.netSalary,
        status: "paid",
        timestamp: new Date().toISOString(),
      };

      const notif = {
        title: "Payslip Ready",
        message: `Your payslip for ${item.periodLabel || "the current period"} is now available.`,
        type: "success" as const,
        category: "payroll" as const,
        metadata: payslipPayload,
        timestamp: new Date().toISOString(),
      };

      if (item.employeeUserId) {
        io.to(`user:${item.employeeUserId}`).emit("payroll:payslip:available", payslipPayload);
        io.to(`user:${item.employeeUserId}`).emit("notification", notif);
      }
      io.to(`employee:${item.employeeId}`).emit("payroll:payslip:available", payslipPayload);
      io.to(`employee:${item.employeeId}`).emit("notification", notif);
    }
    logger.info(
      `[Socket:Payroll] Dispatched payslip availability notices to ${employeePayslips.length} employees`,
    );
  }

  emitPayrunStatusChanged(companyId, payload);
};

/**
 * Emits payslip available event to a single employee
 */
export const emitPayslipAvailable = (
  employeeId: string,
  employeeUserId: string | null | undefined,
  payload: PayslipAvailablePayload,
): void => {
  if (!isSocketInitialized()) return;
  const io = getIO();

  const notif = {
    title: "New Payslip Published",
    message: `Your payslip for ${payload.periodLabel || "this period"} is available.`,
    type: "info" as const,
    category: "payroll" as const,
    metadata: payload,
    timestamp: new Date().toISOString(),
  };

  if (employeeUserId) {
    io.to(`user:${employeeUserId}`).emit("payroll:payslip:available", payload);
    io.to(`user:${employeeUserId}`).emit("notification", notif);
  }
  io.to(`employee:${employeeId}`).emit("payroll:payslip:available", payload);
  io.to(`employee:${employeeId}`).emit("notification", notif);
};
