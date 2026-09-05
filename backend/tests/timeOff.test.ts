import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/core/config/prisma.js";
import {
  createTimeOffTypeService,
  createAllocationService,
  approveAllocationService,
  createRequestService,
  approveRequestService,
  refuseRequestService,
  getEmployeeLeaveBalancesService,
  calculateDuration,
} from "../src/modules/timeoff/timeoff.service.js";
import { computePayslipEngine } from "../src/modules/salary/salary.service.ts";

describe("Time Off Module & Payroll Integration Tests", () => {
  let testCompanyId: string;
  let testEmployeeId: string;
  let casualLeaveTypeId: string;
  let unpaidLeaveTypeId: string;
  let allocationId: string;

  before(async () => {
    // 1. Create test company
    const company = await prisma.company.create({
      data: {
        name: `TimeOff Test Corp ${Date.now()}`,
        slug: `timeoff-test-${Date.now()}`,
        currency: "INR",
      },
    });
    testCompanyId = company.id;

    // 2. Create test employee
    const employee = await prisma.employee.create({
      data: {
        companyId: testCompanyId,
        employeeCode: `EMP-TF-${Date.now()}`,
        firstName: "Rahul",
        lastName: "Test",
        email: `rahul.test.${Date.now()}@example.com`,
      },
    });
    testEmployeeId = employee.id;

    // 3. Create Casual Leave Type (requiresAllocation = true, approvalRequired = true)
    const casualLeave = await createTimeOffTypeService(
      {
        name: "Casual Leave",
        code: `CL_${Date.now()}`,
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        payrollIntegration: false,
      },
      testCompanyId,
    );
    casualLeaveTypeId = casualLeave.id;

    // 4. Create Unpaid Leave Type (requiresAllocation = false, approvalRequired = true, payrollIntegration = true)
    const unpaidLeave = await createTimeOffTypeService(
      {
        name: "Unpaid Leave",
        code: `UPL_${Date.now()}`,
        unit: "days",
        requiresAllocation: false,
        approvalRequired: true,
        payrollIntegration: true,
      },
      testCompanyId,
    );
    unpaidLeaveTypeId = unpaidLeave.id;

    // 5. Create and approve allocation of 10 days for Casual Leave
    const alloc = await createAllocationService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: casualLeaveTypeId,
        allocated: 10,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
      },
      testCompanyId,
    );
    const approvedAlloc = await approveAllocationService(alloc.id, null, testCompanyId);
    allocationId = approvedAlloc.id;
  });

  after(async () => {
    // Cleanup test data
    if (testCompanyId) {
      await prisma.timeOffRequest.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.timeOffAllocation.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.timeOffType.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.employee.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.company.delete({ where: { id: testCompanyId } });
    }
  });

  it("1. Unit test: requesting more days than remaining is rejected before creation", async () => {
    // Employee has 10 remaining. Requesting 15 days should fail.
    await assert.rejects(
      async () => {
        await createRequestService(
          {
            employeeId: testEmployeeId,
            timeOffTypeId: casualLeaveTypeId,
            startDate: "2026-06-01",
            endDate: "2026-06-15", // 15 days duration
            reason: "Vacation",
          },
          null,
          testCompanyId,
        );
      },
      (err: any) => {
        assert.ok(err.message.includes("Insufficient leave balance"));
        return true;
      },
    );
  });

  it("2. Unit test: approving a request correctly decrements taken and recomputes remaining", async () => {
    // Create a 3-day request: 2026-06-01 to 2026-06-03
    const request = await createRequestService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: casualLeaveTypeId,
        startDate: "2026-06-01",
        endDate: "2026-06-03", // 3 days
        reason: "Personal work",
      },
      null,
      testCompanyId,
    );

    assert.equal(request.status, "pending");
    assert.equal(Number(request.duration), 3);

    // Initial allocation state: allocated = 10, taken = 0, remaining = 10
    const allocBefore = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
    assert.equal(Number(allocBefore?.taken), 0);
    assert.equal(Number(allocBefore?.remaining), 10);

    // Approve the request
    const approvedReq = await approveRequestService(request.id, null, testCompanyId);
    assert.equal(approvedReq.status, "approved");

    // Check updated allocation state: taken = 3, remaining = 7
    const allocAfter = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
    assert.equal(Number(allocAfter?.taken), 3);
    assert.equal(Number(allocAfter?.remaining), 7);
  });

  it("3. Integration test: refusing a request leaves the allocation untouched", async () => {
    // Balance before test: taken = 3, remaining = 7
    const allocBefore = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });

    // Create a 2-day request: 2026-07-01 to 2026-07-02
    const request = await createRequestService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: casualLeaveTypeId,
        startDate: "2026-07-01",
        endDate: "2026-07-02",
        reason: "Dental appointment",
      },
      null,
      testCompanyId,
    );

    // Refuse the request
    const refusedReq = await refuseRequestService(request.id, "High workload period", testCompanyId);
    assert.equal(refusedReq.status, "refused");

    // Allocation should remain completely untouched
    const allocAfter = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
    assert.equal(Number(allocAfter?.taken), Number(allocBefore?.taken));
    assert.equal(Number(allocAfter?.remaining), Number(allocBefore?.remaining));
  });

  it("4. Concurrency test: two simultaneous approval calls against the same allocation don't both succeed if balance is insufficient", async () => {
    // Current allocation remaining = 7 days.
    // Create request A for 5 days (2026-08-01 to 2026-08-05)
    // Create request B for 5 days (2026-08-10 to 2026-08-14)
    // Total requested = 10 days, but remaining is only 7. Only one should succeed!

    const requestA = await createRequestService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: casualLeaveTypeId,
        startDate: "2026-08-01",
        endDate: "2026-08-05", // 5 days
      },
      null,
      testCompanyId,
    );

    const requestB = await createRequestService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: casualLeaveTypeId,
        startDate: "2026-08-10",
        endDate: "2026-08-14", // 5 days
      },
      null,
      testCompanyId,
    );

    // Attempt simultaneous approval calls
    const results = await Promise.allSettled([
      approveRequestService(requestA.id, null, testCompanyId),
      approveRequestService(requestB.id, null, testCompanyId),
    ]);

    const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;
    const rejectedCount = results.filter((r) => r.status === "rejected").length;

    // Exactly one should succeed and one should fail due to atomic transaction re-validation
    assert.equal(fulfilledCount, 1, "Only one approval should succeed when balance is 7 and 2x5 days are requested");
    assert.equal(rejectedCount, 1, "The second approval must be rejected due to insufficient balance");

    // Verify remaining balance: 7 - 5 = 2 (never negative)
    const finalAlloc = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
    assert.equal(Number(finalAlloc?.remaining), 2);
    assert.ok(Number(finalAlloc?.remaining) >= 0, "Allocation remaining balance must never go negative");
  });

  it("5. Integration test: a payrollIntegration = true leave type correctly reduces worked days passed into the salary computation engine", async () => {
    // 1. Create an approved Unpaid Leave request (payrollIntegration = true) for 5 days in Sept 2026
    const unpaidRequest = await createRequestService(
      {
        employeeId: testEmployeeId,
        timeOffTypeId: unpaidLeaveTypeId,
        startDate: "2026-09-01",
        endDate: "2026-09-05", // 5 days unpaid leave
        reason: "Unpaid Sabbatical",
      },
      null,
      testCompanyId,
    );

    await approveRequestService(unpaidRequest.id, null, testCompanyId);

    // 2. Setup a dummy salary structure for testing
    const structure = await prisma.salaryStructure.create({
      data: {
        companyId: testCompanyId,
        name: "Test Structure",
        code: `STRUCT_${Date.now()}`,
      },
    });

    const ruleBasic = await prisma.salaryRule.create({
      data: {
        companyId: testCompanyId,
        name: "Basic Pay",
        code: `BASIC_${Date.now()}`,
        category: "basic",
        computationMethod: "fixed",
        amount: 30000,
      },
    });

    await prisma.structureRule.create({
      data: {
        companyId: testCompanyId,
        structureId: structure.id,
        ruleId: ruleBasic.id,
        sequence: 1,
      },
    });

    const contract = await prisma.contract.create({
      data: {
        companyId: testCompanyId,
        employeeId: testEmployeeId,
        contractReference: `CON_${Date.now()}`,
        startDate: new Date("2026-01-01"),
        wage: 30000,
        salaryStructureId: structure.id,
      },
    });

    // 3. Compute payslip engine for Sept 1 to Sept 30 (30 total calendar days)
    const computed = await computePayslipEngine(testEmployeeId, contract.id, structure.id, {
      periodStart: new Date("2026-09-01"),
      periodEnd: new Date("2026-09-30"),
    });

    // Verify context metrics: TOTAL_DAYS = 30, UNPAID_LEAVE_DAYS = 5, WORKED_DAYS = 25
    assert.equal(computed.context.TOTAL_DAYS, 30);
    assert.equal(computed.context.UNPAID_LEAVE_DAYS, 5);
    assert.equal(computed.context.WORKED_DAYS, 25);
    assert.equal(computed.summary.workedDays, 25);
    assert.equal(computed.summary.unpaidLeaveDays, 5);
  });

  it("6. Aggregated Leave Balances View (GET /employees/:id/leave-balances)", async () => {
    const balances = await getEmployeeLeaveBalancesService(testEmployeeId, testCompanyId);

    assert.ok(Array.isArray(balances));
    const casualBalance = balances.find((b) => b.timeOffType.id === casualLeaveTypeId);
    assert.ok(casualBalance);
    assert.equal(casualBalance.allocated, 10);
    assert.equal(casualBalance.taken, 8); // 3 days + 5 days approved
    assert.equal(casualBalance.remaining, 2);
  });
});
