import { Resend } from "resend";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export interface UserCredentialsEmailParams {
  email: string;
  name: string;
  password: string;
  role: string;
  companyName?: string;
  loginUrl?: string;
  isUpdate?: boolean;
}

/**
 * Lazily resolves the Resend client with validated API key
 */
function getResendClient(): { client: Resend | null; fromEmail: string } {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY || "";
  const fromEmail = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "PeoplePay <noreply@mstrmind.in>";

  if (apiKey && !apiKey.includes("123456789") && apiKey.startsWith("re_")) {
    try {
      return { client: new Resend(apiKey), fromEmail };
    } catch (err: any) {
      logger.warn(`[Email Service] Failed to initialize Resend client: ${err.message}`);
    }
  }

  return { client: null, fromEmail };
}

/**
 * Send newly generated user account credentials to the employee's work email
 */
export async function sendUserCredentialsEmail(params: UserCredentialsEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    email,
    name,
    password,
    role,
    companyName = "PeoplePay360",
    loginUrl = "http://localhost:5173/login",
    isUpdate = false,
  } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background-color: #714867; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.85; }
          .content { padding: 32px 24px; color: #1e293b; }
          .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .message { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin-bottom: 24px; }
          .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .credential-row:last-child { margin-bottom: 0; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; font-family: monospace; }
          .password-value { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #714867; font-weight: 700; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #714867; color: #ffffff !important; padding: 12px 28px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { background-color: #f8fafc; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
          .warning { font-size: 11px; color: #b45309; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 8px 12px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>HR &amp; Workforce Portal Access</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <p class="message">
              ${isUpdate
                ? `Your account password for the <strong>${companyName}</strong> portal has been updated. You can now sign in using the updated credentials provided below.`
                : `Your user account for the <strong>${companyName}</strong> portal has been created. You can now sign in using the credentials provided below.`}
            </p>

            <div class="card">
              <div class="credential-row">
                <span class="label">Work Email:</span>
                <span class="value">${email}</span>
              </div>
              <div class="credential-row">
                <span class="label">Assigned Role:</span>
                <span class="value">${role}</span>
              </div>
              <div class="credential-row">
                <span class="label">${isUpdate ? 'New Password:' : 'Temporary Password:'}</span>
                <span class="password-value">${password}</span>
              </div>
            </div>

            <div class="btn-container">
              <a href="${loginUrl}" class="btn" target="_blank">Log In to PeoplePay360 &rarr;</a>
            </div>

            <div class="warning">
              &bull; Please keep your credentials secure. We recommend updating your password upon your first sign in.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${companyName}. This is an automated email, please do not reply directly.
          </div>
        </div>
      </body>
    </html>
  `;

  const { client, fromEmail } = getResendClient();
  const subject = isUpdate
    ? `Your ${companyName} Portal Password Has Been Updated`
    : `Welcome to ${companyName} — Your Account Credentials`;

  if (client) {
    try {
      const response = await client.emails.send({
        from: fromEmail,
        to: [email],
        subject,
        html: htmlContent,
      });

      if (response.error) {
        logger.warn(`[Email Service] Resend returned an error for ${email}: ${response.error.message}`);
        logger.info(`[Email Service - Fallback Log] Credentials for ${email}: Password: [${password}], Role: [${role}]`);
        return { success: false, error: response.error.message };
      }

      logger.info(`[Email Service] Credentials email successfully dispatched to ${email} (Message ID: ${response.data?.id})`);
      return { success: true, messageId: response.data?.id };
    } catch (err: any) {
      logger.warn(`[Email Service] Error dispatching email via Resend to ${email}: ${err.message}`);
      logger.info(`[Email Service - Fallback Log] Credentials for ${email}: Password: [${password}], Role: [${role}]`);
      return { success: false, error: err.message };
    }
  } else {
    // Development / Offline mode: Cleanly log credentials to backend console
    logger.info(`=======================================================`);
    logger.info(`[EMAIL SERVICE DEV MOCK] Credentials Email Dispatched`);
    logger.info(`To: ${email} (${name})`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Role: ${role}`);
    logger.info(`Password: ${password}`);
    logger.info(`Login URL: ${loginUrl}`);
    logger.info(`=======================================================`);
    return { success: true };
  }
}
