import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveStatusEmail,
  sendPayslipNotificationEmail,
} from "../src/shared/utils/email.service.js";

describe("Resend Email Service Unit Tests", () => {
  it("should send email or log mock email successfully", async () => {
    const result = await sendEmail({
      to: "delivered@resend.dev",
      subject: "Test Email Notification",
      html: "<p>Hello World</p>",
    });

    assert.equal(result.success, true);
    assert.ok(result.messageId || result.mock);
  });

  it("should dispatch welcome email helper without error", async () => {
    const result = await sendWelcomeEmail("delivered@resend.dev", "John Doe");
    assert.equal(result.success, true);
  });

  it("should dispatch leave status email helper for approved status", async () => {
    const result = await sendLeaveStatusEmail(
      "delivered@resend.dev",
      "John Doe",
      "Annual Leave",
      "approved",
      "2026-10-01 to 2026-10-05",
    );
    assert.equal(result.success, true);
  });

  it("should dispatch leave status email helper for refused status with reason", async () => {
    const result = await sendLeaveStatusEmail(
      "delivered@resend.dev",
      "John Doe",
      "Casual Leave",
      "refused",
      "2026-10-10",
      "High workload during sprint end",
    );
    assert.equal(result.success, true);
  });

  it("should dispatch payslip notification email helper", async () => {
    const result = await sendPayslipNotificationEmail(
      "delivered@resend.dev",
      "John Doe",
      "September 2026",
      "https://example.com/payslip-sept-2026.pdf",
    );
    assert.equal(result.success, true);
  });
});
