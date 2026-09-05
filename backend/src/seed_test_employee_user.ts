import bcrypt from "bcryptjs";
import { prisma } from "./core/config/prisma.js";

async function seedEmployeeData() {
  console.log("[Seed] Starting comprehensive test employee & system user seeding...");

  // 1. Resolve or create default company
  let company = await prisma.company.findFirst({ where: { deletedAt: null } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "PeoplePay360 Inc.",
        slug: "peoplepay360",
        industry: "Software & Technology",
        currency: "INR",
        country: "India",
        timezone: "Asia/Kolkata",
      },
    });
    console.log(`[Seed] Created Company: ${company.name} (${company.id})`);
  }

  // 2. Resolve or create Engineering Department & Job Position
  let department = await prisma.department.findFirst({
    where: { name: "Engineering", companyId: company.id },
  });
  if (!department) {
    department = await prisma.department.create({
      data: {
        name: "Engineering",
        code: "ENG",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Department: Engineering`);
  }

  let jobPosition = await prisma.jobPosition.findFirst({
    where: { title: "Software Engineer", companyId: company.id },
  });
  if (!jobPosition) {
    jobPosition = await prisma.jobPosition.create({
      data: {
        title: "Software Engineer",
        code: "SWE",
        departmentId: department.id,
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Job Position: Software Engineer`);
  }

  // 3. Resolve or create Working Schedule (Standard 40-Hour Week)
  let schedule = await prisma.workingSchedule.findFirst({
    where: { name: "Standard 40-Hour Work Week", companyId: company.id },
  });
  if (!schedule) {
    schedule = await prisma.workingSchedule.create({
      data: {
        companyId: company.id,
        name: "Standard 40-Hour Work Week",
        code: "STD_40",
        scheduleType: "fixed",
        totalWeeklyHours: 40,
        timezone: "Asia/Kolkata",
        isActive: true,
      },
    });

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    for (const day of days) {
      await prisma.scheduleLine.create({
        data: {
          companyId: company.id,
          scheduleId: schedule.id,
          dayOfWeek: day,
          breakDurationMinutes: 60,
          workDurationMinutes: 480,
          isDayOff: false,
        },
      });
    }

    // Weekend days off
    for (const day of ["saturday", "sunday"]) {
      await prisma.scheduleLine.create({
        data: {
          companyId: company.id,
          scheduleId: schedule.id,
          dayOfWeek: day,
          breakDurationMinutes: 0,
          workDurationMinutes: 0,
          isDayOff: true,
        },
      });
    }
    console.log(`[Seed] Created Working Schedule & Lines`);
  }

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 4. Seed / Update Master Employee Record: Rahul Verma
  const employeeEmail = "rahul.employee@peoplepay360.com";
  let employee = await prisma.employee.findFirst({
    where: { email: employeeEmail, companyId: company.id },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        employeeCode: "EMP-2026-TEST",
        firstName: "Rahul",
        lastName: "Verma",
        email: employeeEmail,
        phone: "+91 9876543210",
        dateOfBirth: new Date("1995-06-15"),
        dateOfJoining: new Date("2024-01-15"),
        departmentId: department.id,
        jobPositionId: jobPosition.id,
        scheduleId: schedule.id,
        employeeType: "full_time",
        status: "active",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Employee master record: Rahul Verma (${employee.id})`);
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        departmentId: department.id,
        jobPositionId: jobPosition.id,
        scheduleId: schedule.id,
      },
    });
  }

  // 5. Seed / Update EMPLOYEE User Login Account
  let employeeUser = await prisma.user.findFirst({
    where: { email: employeeEmail },
  });

  if (!employeeUser) {
    employeeUser = await prisma.user.create({
      data: {
        email: employeeEmail,
        passwordHash: hashedPassword,
        role: "EMPLOYEE",
        isActive: true,
        companyId: company.id,
        employeeId: employee.id,
        clerkUserId: `clerk_emp_${Date.now()}`,
      },
    });
    console.log(`[Seed] Created EMPLOYEE User account: ${employeeUser.email}`);
  } else {
    employeeUser = await prisma.user.update({
      where: { id: employeeUser.id },
      data: {
        passwordHash: hashedPassword,
        role: "EMPLOYEE",
        isActive: true,
        employeeId: employee.id,
      },
    });
  }

  await prisma.employee.update({
    where: { id: employee.id },
    data: { userId: employeeUser.id },
  });

  // 6. Seed Employee Bank Account
  let bankAccount = await prisma.employeeBankAccount.findFirst({
    where: { employeeId: employee.id },
  });

  if (!bankAccount) {
    bankAccount = await prisma.employeeBankAccount.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        bankName: "HDFC Bank Ltd",
        accountNumber: "50100458923412",
        ifscCode: "HDFC0001234",
        accountHolderName: "Rahul Verma",
        isPrimary: true,
        isVerified: true,
      },
    });
    console.log(`[Seed] Created Employee Bank Account for Rahul Verma`);
  }

  // 7. Seed Salary Structure & Rules
  let salaryStructure = await prisma.salaryStructure.findFirst({
    where: { name: "Standard Software Engineer Salary Structure", companyId: company.id },
  });

  if (!salaryStructure) {
    salaryStructure = await prisma.salaryStructure.create({
      data: {
        companyId: company.id,
        name: "Standard Software Engineer Salary Structure",
        code: "SWE_STD_2026",
        description: "Standard monthly salary components including Basic, HRA, Special Allowance, and PF",
        isActive: true,
      },
    });

    const ruleBasic = await prisma.salaryRule.upsert({
      where: { code: "BASIC" },
      update: {},
      create: {
        companyId: company.id,
        name: "Basic Salary",
        code: "BASIC",
        category: "basic",
        sequence: 10,
        computationMethod: "percentage",
        percentageValue: 50,
        appearsOnPayslip: true,
      },
    });

    const ruleHRA = await prisma.salaryRule.upsert({
      where: { code: "HRA" },
      update: {},
      create: {
        companyId: company.id,
        name: "House Rent Allowance (HRA)",
        code: "HRA",
        category: "allowance",
        sequence: 20,
        computationMethod: "percentage",
        percentageValue: 25,
        appearsOnPayslip: true,
      },
    });

    const ruleSpecial = await prisma.salaryRule.upsert({
      where: { code: "SPEC_ALL" },
      update: {},
      create: {
        companyId: company.id,
        name: "Special Allowance",
        code: "SPEC_ALL",
        category: "allowance",
        sequence: 30,
        computationMethod: "percentage",
        percentageValue: 25,
        appearsOnPayslip: true,
      },
    });

    const rulePF = await prisma.salaryRule.upsert({
      where: { code: "PF" },
      update: {},
      create: {
        companyId: company.id,
        name: "Provident Fund (PF)",
        code: "PF",
        category: "deduction",
        sequence: 100,
        computationMethod: "percentage",
        percentageValue: 12,
        basedOnCode: "BASIC",
        appearsOnPayslip: true,
      },
    });

    // Link rules to structure
    const rulesToLink = [
      { ruleId: ruleBasic.id, seq: 10 },
      { ruleId: ruleHRA.id, seq: 20 },
      { ruleId: ruleSpecial.id, seq: 30 },
      { ruleId: rulePF.id, seq: 100 },
    ];

    for (const item of rulesToLink) {
      await prisma.structureRule.upsert({
        where: {
          structureId_ruleId: {
            structureId: salaryStructure.id,
            ruleId: item.ruleId,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          structureId: salaryStructure.id,
          ruleId: item.ruleId,
          sequence: item.seq,
          isEnabled: true,
        },
      });
    }
    console.log(`[Seed] Created Salary Structure & Rules`);
  }

  // 8. Seed Employment Contract for Rahul Verma
  let contract = await prisma.contract.findFirst({
    where: { employeeId: employee.id, status: "active" },
  });

  if (!contract) {
    contract = await prisma.contract.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        contractReference: "CNT-2026-0001",
        startDate: new Date("2024-01-15"),
        departmentId: department.id,
        jobPositionId: jobPosition.id,
        scheduleId: schedule.id,
        wage: 75000.0,
        currency: "INR",
        payFrequency: "monthly",
        salaryStructureId: salaryStructure.id,
        status: "active",
        notes: "Full-time employment agreement for Senior Software Engineer role.",
      },
    });
    console.log(`[Seed] Created Active Employment Contract for Rahul Verma (Ref: CNT-2026-0001)`);
  }

  // 9. Seed Time Off Types, Allocations & Requests
  let casualLeaveType = await prisma.timeOffType.findFirst({
    where: { code: "CL", companyId: company.id },
  });
  if (!casualLeaveType) {
    casualLeaveType = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Casual Leave",
        code: "CL",
        unit: "days",
        color: "#00C853",
        requiresAllocation: true,
        approvalRequired: true,
      },
    });
  }

  let sickLeaveType = await prisma.timeOffType.findFirst({
    where: { code: "SL", companyId: company.id },
  });
  if (!sickLeaveType) {
    sickLeaveType = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Sick Leave",
        code: "SL",
        unit: "days",
        color: "#FF9100",
        requiresAllocation: true,
        approvalRequired: true,
      },
    });
  }

  let paidLeaveType = await prisma.timeOffType.findFirst({
    where: { code: "PL", companyId: company.id },
  });
  if (!paidLeaveType) {
    paidLeaveType = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Earned / Paid Leave",
        code: "PL",
        unit: "days",
        color: "#29B6F6",
        requiresAllocation: true,
        approvalRequired: true,
      },
    });
  }

  // Allocations for Rahul Verma
  let clAllocation = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: casualLeaveType.id },
  });
  if (!clAllocation) {
    clAllocation = await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: casualLeaveType.id,
        allocated: 12,
        taken: 2,
        remaining: 10,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  }

  let slAllocation = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: sickLeaveType.id },
  });
  if (!slAllocation) {
    slAllocation = await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: sickLeaveType.id,
        allocated: 10,
        taken: 1,
        remaining: 9,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  }

  // Time Off Requests for Rahul Verma
  const existingReqs = await prisma.timeOffRequest.count({
    where: { employeeId: employee.id },
  });
  if (existingReqs === 0) {
    // Approved past request 1
    await prisma.timeOffRequest.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: casualLeaveType.id,
        allocationId: clAllocation.id,
        startDate: new Date("2026-08-10"),
        endDate: new Date("2026-08-11"),
        duration: 2,
        status: "approved",
        reason: "Personal work at home",
        approvedAt: new Date("2026-08-08"),
      },
    });

    // Approved past request 2
    await prisma.timeOffRequest.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: sickLeaveType.id,
        allocationId: slAllocation.id,
        startDate: new Date("2026-08-25"),
        endDate: new Date("2026-08-25"),
        duration: 1,
        status: "approved",
        reason: "Viral fever doctor visit",
        approvedAt: new Date("2026-08-25"),
      },
    });

    // Pending upcoming request 3
    await prisma.timeOffRequest.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: casualLeaveType.id,
        allocationId: clAllocation.id,
        startDate: new Date("2026-09-10"),
        endDate: new Date("2026-09-12"),
        duration: 3,
        status: "pending",
        reason: "Family event travel",
      },
    });
    console.log(`[Seed] Created Time Off Allocations & Sample Requests`);
  }

  // 10. Seed Daily Attendance Records (August 1 to September 5, 2026)
  const existingAttendances = await prisma.attendance.count({
    where: { employeeId: employee.id },
  });

  if (existingAttendances < 15) {
    console.log(`[Seed] Generating realistic daily attendance logs for August and September 2026...`);
    const startDate = new Date("2026-08-01");
    const endDate = new Date("2026-09-05");

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      // Skip leave days (10 Aug, 11 Aug, 25 Aug)
      const dateStr = d.toISOString().split("T")[0];
      if (dateStr === "2026-08-10" || dateStr === "2026-08-11" || dateStr === "2026-08-25") {
        continue;
      }

      // Check if record exists
      const existingAtt = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          attendanceDate: new Date(dateStr),
        },
      });

      if (!existingAtt) {
        // Randomize check in: 08:52 AM to 09:12 AM
        const checkIn = new Date(d);
        const checkInMinutes = Math.floor(Math.random() * 20) - 8;
        checkIn.setHours(9, Math.max(0, checkInMinutes), 0);

        // Randomize check out: 05:30 PM to 06:15 PM
        const checkOut = new Date(d);
        const checkOutMinutes = Math.floor(Math.random() * 45);
        checkOut.setHours(17, 30 + checkOutMinutes, 0);

        const workedMs = checkOut.getTime() - checkIn.getTime();
        const workedHours = Number((workedMs / (1000 * 60 * 60)).toFixed(2));
        const isLate = checkInMinutes > 10;

        await prisma.attendance.create({
          data: {
            companyId: company.id,
            employeeId: employee.id,
            attendanceDate: new Date(dateStr),
            checkIn: checkIn,
            checkOut: checkOut,
            workedHours: workedHours,
            expectedHours: 8.0,
            status: isLate ? "late" : "present",
            source: "system",
          },
        });
      }
    }
    console.log(`[Seed] Seeded attendance logs for Rahul Verma`);
  }

  // 11. Seed August 2026 Completed Payrun & Payslip
  let payrun = await prisma.payrun.findFirst({
    where: { name: "August 2026 Monthly Payrun", companyId: company.id },
  });

  if (!payrun) {
    payrun = await prisma.payrun.create({
      data: {
        companyId: company.id,
        name: "August 2026 Monthly Payrun",
        periodLabel: "2026-08",
        periodStart: new Date("2026-08-01"),
        periodEnd: new Date("2026-08-31"),
        salaryStructureId: salaryStructure.id,
        status: "validated",
        totalGross: 75000.0,
        totalDeductions: 4500.0,
        totalNet: 70500.0,
        totalEmployees: 1,
        computedAt: new Date("2026-08-31"),
        validatedAt: new Date("2026-08-31"),
        paidAt: new Date("2026-09-01"),
      },
    });

    await prisma.payrunEmployee.create({
      data: {
        companyId: company.id,
        payrunId: payrun.id,
        employeeId: employee.id,
        contractId: contract.id,
        inclusionStatus: "included",
      },
    });

    const payslip = await prisma.payslip.create({
      data: {
        companyId: company.id,
        payrunId: payrun.id,
        employeeId: employee.id,
        contractId: contract.id,
        structureId: salaryStructure.id,
        periodStart: new Date("2026-08-01"),
        periodEnd: new Date("2026-08-31"),
        workedDays: 20,
        leaveDays: 3,
        status: "paid",
        currency: "INR",
        basic: 37500.0,
        totalAllowances: 37500.0,
        gross: 75000.0,
        totalDeductions: 4500.0,
        net: 70500.0,
        computedAt: new Date("2026-08-31"),
      },
    });

    // Payslip Lines
    const lines = [
      { ruleCode: "BASIC", ruleName: "Basic Salary", category: "basic", amount: 37500.0 },
      { ruleCode: "HRA", ruleName: "House Rent Allowance (HRA)", category: "allowance", amount: 18750.0 },
      { ruleCode: "SPEC_ALL", ruleName: "Special Allowance", category: "allowance", amount: 18750.0 },
      { ruleCode: "PF", ruleName: "Provident Fund (PF)", category: "deduction", amount: 4500.0 },
    ];

    for (const l of lines) {
      await prisma.payslipLine.create({
        data: {
          companyId: company.id,
          payslipId: payslip.id,
          ruleCode: l.ruleCode,
          ruleName: l.ruleName,
          category: l.category,
          amount: l.amount,
          appearsOnPayslip: true,
        },
      });
    }
    console.log(`[Seed] Created August 2026 Payrun & Payslip for Rahul Verma`);
  }

  // 12. Seed / Update System Users for Other Roles
  const otherUsers = [
    { email: "employee@peoplepay360.com", role: "EMPLOYEE", name: "Standard Employee" },
    { email: "hr.manager@peoplepay360.com", role: "HR_MANAGER", name: "HR Manager" },
    { email: "payroll.user@peoplepay360.com", role: "HR_PAYROLL_USER", name: "HR Payroll User" },
    { email: "payroll.manager@peoplepay360.com", role: "HR_PAYROLL_MANAGER", name: "HR Payroll Manager" },
    { email: "admin@peoplepay360.com", role: "ADMIN", name: "System Admin" },
  ];

  for (const u of otherUsers) {
    const existing = await prisma.user.findFirst({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          role: u.role,
          isActive: true,
          companyId: company.id,
          clerkUserId: `clerk_${u.role.toLowerCase()}_${Date.now()}`,
        },
      });
      console.log(`[Seed] Created ${u.role} User account: ${u.email}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: hashedPassword,
          role: u.role,
          isActive: true,
        },
      });
    }
  }

  console.log("\n=======================================================");
  console.log("FULL EMPLOYEE & SYSTEM DATA SEEDED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("PRIMARY EMPLOYEE ACCOUNT (Rahul Verma):");
  console.log("  Email:        rahul.employee@peoplepay360.com");
  console.log("  Password:     Password123!");
  console.log("  Role:         EMPLOYEE");
  console.log("  Department:   Engineering (ENG)");
  console.log("  Job Position: Software Engineer (SWE)");
  console.log("  Contract:     CNT-2026-0001 (Active, ₹75,000 / month)");
  console.log("  Bank Account: HDFC Bank (A/C: 50100458923412)");
  console.log("  Leave Bal:    10 Days CL, 9 Days SL, 15 Days PL");
  console.log("  Attendance:   20+ Logged Days (Aug & Sep 2026)");
  console.log("  Payslips:     August 2026 Net ₹70,500 (Paid)");
  console.log("-------------------------------------------------------");
  console.log("ADMIN ACCOUNT:");
  console.log("  Email:        admin@peoplepay360.com");
  console.log("  Password:     Password123!");
  console.log("  Role:         ADMIN");
  console.log("=======================================================\n");

  process.exit(0);
}

seedEmployeeData().catch((err) => {
  console.error("[Seed Error]", err);
  process.exit(1);
});
