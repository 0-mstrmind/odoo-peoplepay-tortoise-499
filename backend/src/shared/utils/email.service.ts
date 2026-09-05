import { resend } from "../../core/config/resend.js";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/config/logger.js";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}

/**
 * Low-level email sending utility powered by Resend
 */
export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
  const fromEmail = options.from || env.RESEND_FROM_EMAIL;
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  if (!resend) {
    logger.info(`[MOCK EMAIL SENT] To: ${toAddresses.join(", ")} | Subject: "${options.subject}"`);
    return { success: true, mock: true };
  }

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    if (response.error) {
      logger.error(`Resend Email Error: ${response.error.message}`, { error: response.error });
      return { success: false, error: response.error.message };
    }

    logger.info(`Email sent successfully via Resend. ID: ${response.data?.id}`);
    return { success: true, messageId: response.data?.id };
  } catch (error: any) {
    logger.error(`Failed to dispatch email via Resend: ${error?.message || error}`);
    return { success: false, error: String(error) };
  }
};

/**
 * Domain Email Helpers for PeoplePay360
 */

export const sendWelcomeEmail = async (to: string, name: string): Promise<SendEmailResult> => {
  return sendEmail({
    to,
    subject: "Welcome to PeoplePay360 HR & Payroll",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Welcome to PeoplePay360, ${name}!</h2>
        <p>Your employee profile and account access have been set up successfully.</p>
        <p>You can now log in to view your profile, manage leave allocations, track attendance, and access payslips.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">This is an automated system email from PeoplePay360 Platform.</p>
      </div>
    `,
    text: `Welcome to PeoplePay360, ${name}! Your employee account has been created.`,
  });
};

export const sendLeaveStatusEmail = async (
  to: string,
  employeeName: string,
  leaveTypeName: string,
  status: "approved" | "refused",
  dates: string,
  refusalReason?: string,
): Promise<SendEmailResult> => {
  const isApproved = status === "approved";
  const badgeColor = isApproved ? "#16a34a" : "#dc2626";
  const statusTitle = isApproved ? "Leave Request Approved" : "Leave Request Refused";

  return sendEmail({
    to,
    subject: `[PeoplePay360] ${statusTitle}: ${leaveTypeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: ${badgeColor}; margin-top: 0;">${statusTitle}</h2>
        <p>Hello ${employeeName},</p>
        <p>Your request for <strong>${leaveTypeName}</strong> (${dates}) has been <span style="color: ${badgeColor}; font-weight: bold;">${status.toUpperCase()}</span>.</p>
        ${!isApproved && refusalReason ? `<p><strong>Reason:</strong> ${refusalReason}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">PeoplePay360 Leave & Time Off System.</p>
      </div>
    `,
    text: `Hello ${employeeName}, your ${leaveTypeName} request (${dates}) was ${status}.${refusalReason ? ` Reason: ${refusalReason}` : ""}`,
  });
};

export const sendPayslipNotificationEmail = async (
  to: string,
  employeeName: string,
  periodLabel: string,
  pdfUrl?: string,
): Promise<SendEmailResult> => {
  return sendEmail({
    to,
    subject: `[PeoplePay360] Payslip Available for ${periodLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Payslip Ready: ${periodLabel}</h2>
        <p>Hello ${employeeName},</p>
        <p>Your payslip for the payroll period <strong>${periodLabel}</strong> has been computed and processed.</p>
        ${pdfUrl ? `<p><a href="${pdfUrl}" style="background-color: #2563eb; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Payslip PDF</a></p>` : ""}
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">PeoplePay360 Automated Payroll Service.</p>
      </div>
    `,
    text: `Hello ${employeeName}, your payslip for ${periodLabel} is now available on PeoplePay360.`,
  });
};
