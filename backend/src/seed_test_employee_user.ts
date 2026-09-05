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

  // 2. Resolve or create Departments (Engineering, Human Resources, Finance)
  let engDepartment = await prisma.department.findFirst({
    where: { name: "Engineering", companyId: company.id },
  });
  if (!engDepartment) {
    engDepartment = await prisma.department.create({
      data: {
        name: "Engineering",
        code: "ENG",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Department: Engineering`);
  }

  let hrDepartment = await prisma.department.findFirst({
    where: { name: "Human Resources", companyId: company.id },
  });
  if (!hrDepartment) {
    hrDepartment = await prisma.department.create({
      data: {
        name: "Human Resources",
        code: "HR",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Department: Human Resources`);
  }

  let finDepartment = await prisma.department.findFirst({
    where: { name: "Finance & Payroll", companyId: company.id },
  });
  if (!finDepartment) {
    finDepartment = await prisma.department.create({
      data: {
        name: "Finance & Payroll",
        code: "FIN",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Department: Finance & Payroll`);
  }

  // 3. Resolve or create Job Positions
  let sweJobPosition = await prisma.jobPosition.findFirst({
    where: { title: "Software Engineer", companyId: company.id },
  });
  if (!sweJobPosition) {
    sweJobPosition = await prisma.jobPosition.create({
      data: {
        title: "Software Engineer",
        code: "SWE",
        departmentId: engDepartment.id,
        companyId: company.id,
      },
    });
  }

  let hrManagerJobPosition = await prisma.jobPosition.findFirst({
    where: { title: "HR Manager", companyId: company.id },
  });
  if (!hrManagerJobPosition) {
    hrManagerJobPosition = await prisma.jobPosition.create({
      data: {
        title: "HR Manager",
        code: "HRM",
        departmentId: hrDepartment.id,
        companyId: company.id,
      },
    });
  }

  let payrollUserJobPosition = await prisma.jobPosition.findFirst({
    where: { title: "Payroll Specialist", companyId: company.id },
  });
  if (!payrollUserJobPosition) {
    payrollUserJobPosition = await prisma.jobPosition.create({
      data: {
        title: "Payroll Specialist",
        code: "PYS",
        departmentId: finDepartment.id,
        companyId: company.id,
      },
    });
  }

  let payrollManagerJobPosition = await prisma.jobPosition.findFirst({
    where: { title: "Payroll Manager", companyId: company.id },
  });
  if (!payrollManagerJobPosition) {
    payrollManagerJobPosition = await prisma.jobPosition.create({
      data: {
        title: "Payroll Manager",
        code: "PYM",
        departmentId: finDepartment.id,
        companyId: company.id,
      },
    });
  }

  // 4. Resolve or create Working Schedule (Standard 40-Hour Week)
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

  // 5. Seed HR Manager Employee Record & User Account (Maya Shah)
  const hrManagerEmail = "hr.manager@peoplepay360.com";
  let hrManagerEmp = await prisma.employee.findFirst({
    where: { email: hrManagerEmail, companyId: company.id },
  });

  if (!hrManagerEmp) {
    hrManagerEmp = await prisma.employee.create({
      data: {
        employeeCode: "EMP-HR-001",
        firstName: "Maya",
        lastName: "Shah",
        email: hrManagerEmail,
        phone: "+91 98202 34567",
        dateOfBirth: new Date("1990-03-20"),
        dateOfJoining: new Date("2023-01-10"),
        departmentId: hrDepartment.id,
        jobPositionId: hrManagerJobPosition.id,
        scheduleId: schedule.id,
        employeeType: "full_time",
        status: "active",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created HR Manager Employee record: Maya Shah (${hrManagerEmp.id})`);
  }

  let hrManagerUser = await prisma.user.findFirst({ where: { email: hrManagerEmail } });
  if (!hrManagerUser) {
    hrManagerUser = await prisma.user.create({
      data: {
        email: hrManagerEmail,
        passwordHash: hashedPassword,
        role: "HR_MANAGER",
        isActive: true,
        companyId: company.id,
        employeeId: hrManagerEmp.id,
        clerkUserId: `clerk_hrmanager_${Date.now()}`,
      },
    });
  } else {
    hrManagerUser = await prisma.user.update({
      where: { id: hrManagerUser.id },
      data: {
        passwordHash: hashedPassword,
        role: "HR_MANAGER",
        isActive: true,
        employeeId: hrManagerEmp.id,
      },
    });
  }
  await prisma.employee.update({
    where: { id: hrManagerEmp.id },
    data: { userId: hrManagerUser.id },
  });

  // Set Maya Shah as manager for HR and Engineering departments
  await prisma.department.update({
    where: { id: hrDepartment.id },
    data: { managerId: hrManagerEmp.id },
  });
  await prisma.department.update({
    where: { id: engDepartment.id },
    data: { managerId: hrManagerEmp.id },
  });

  // 6. Seed Primary Test Employee Record: Rahul Verma (reporting to Maya Shah)
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
        departmentId: engDepartment.id,
        jobPositionId: sweJobPosition.id,
        scheduleId: schedule.id,
        managerId: hrManagerEmp.id,
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
        departmentId: engDepartment.id,
        jobPositionId: sweJobPosition.id,
        scheduleId: schedule.id,
        managerId: hrManagerEmp.id,
      },
    });
  }

  let employeeUser = await prisma.user.findFirst({ where: { email: employeeEmail } });
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

  // 7. Seed HR Payroll User (Aarav Mehta)
  const payrollUserEmail = "payroll.user@peoplepay360.com";
  let payrollUserEmp = await prisma.employee.findFirst({
    where: { email: payrollUserEmail, companyId: company.id },
  });
  if (!payrollUserEmp) {
    payrollUserEmp = await prisma.employee.create({
      data: {
        employeeCode: "EMP-PAY-001",
        firstName: "Aarav",
        lastName: "Mehta",
        email: payrollUserEmail,
        phone: "+91 98201 11223",
        departmentId: finDepartment.id,
        jobPositionId: payrollUserJobPosition.id,
        scheduleId: schedule.id,
        managerId: hrManagerEmp.id,
        status: "active",
        companyId: company.id,
      },
    });
  }
  let payrollUserAcc = await prisma.user.findFirst({ where: { email: payrollUserEmail } });
  if (!payrollUserAcc) {
    payrollUserAcc = await prisma.user.create({
      data: {
        email: payrollUserEmail,
        passwordHash: hashedPassword,
        role: "HR_PAYROLL_USER",
        isActive: true,
        companyId: company.id,
        employeeId: payrollUserEmp.id,
        clerkUserId: `clerk_payuser_${Date.now()}`,
      },
    });
  } else {
    payrollUserAcc = await prisma.user.update({
      where: { id: payrollUserAcc.id },
      data: { passwordHash: hashedPassword, role: "HR_PAYROLL_USER", isActive: true, employeeId: payrollUserEmp.id },
    });
  }
  await prisma.employee.update({ where: { id: payrollUserEmp.id }, data: { userId: payrollUserAcc.id } });

  // 8. Seed HR Payroll Manager (Nisha Rao)
  const payrollManagerEmail = "payroll.manager@peoplepay360.com";
  let payrollManagerEmp = await prisma.employee.findFirst({
    where: { email: payrollManagerEmail, companyId: company.id },
  });
  if (!payrollManagerEmp) {
    payrollManagerEmp = await prisma.employee.create({
      data: {
        employeeCode: "EMP-PAY-002",
        firstName: "Nisha",
        lastName: "Rao",
        email: payrollManagerEmail,
        phone: "+91 98201 33445",
        departmentId: finDepartment.id,
        jobPositionId: payrollManagerJobPosition.id,
        scheduleId: schedule.id,
        managerId: hrManagerEmp.id,
        status: "active",
        companyId: company.id,
      },
    });
  }
  let payrollManagerAcc = await prisma.user.findFirst({ where: { email: payrollManagerEmail } });
  if (!payrollManagerAcc) {
    payrollManagerAcc = await prisma.user.create({
      data: {
        email: payrollManagerEmail,
        passwordHash: hashedPassword,
        role: "HR_PAYROLL_MANAGER",
        isActive: true,
        companyId: company.id,
        employeeId: payrollManagerEmp.id,
        clerkUserId: `clerk_paymgr_${Date.now()}`,
      },
    });
  } else {
    payrollManagerAcc = await prisma.user.update({
      where: { id: payrollManagerAcc.id },
      data: { passwordHash: hashedPassword, role: "HR_PAYROLL_MANAGER", isActive: true, employeeId: payrollManagerEmp.id },
    });
  }
  await prisma.employee.update({ where: { id: payrollManagerEmp.id }, data: { userId: payrollManagerAcc.id } });

  // 9. Seed System Admin User
  const adminEmail = "admin@peoplepay360.com";
  let adminAcc = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!adminAcc) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
        isActive: true,
        companyId: company.id,
        clerkUserId: `clerk_admin_${Date.now()}`,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: adminAcc.id },
      data: { passwordHash: hashedPassword, role: "ADMIN", isActive: true },
    });
  }

  // 10. Seed Employee Bank Account
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

  // 11. Seed Salary Structure & Rules
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
        sequence: 40,
        computationMethod: "percentage",
        percentageValue: 6,
        appearsOnPayslip: true,
      },
    });

    await prisma.structureRule.createMany({
      data: [
        { companyId: company.id, structureId: salaryStructure.id, ruleId: ruleBasic.id, sequence: 10 },
        { companyId: company.id, structureId: salaryStructure.id, ruleId: ruleHRA.id, sequence: 20 },
        { companyId: company.id, structureId: salaryStructure.id, ruleId: ruleSpecial.id, sequence: 30 },
        { companyId: company.id, structureId: salaryStructure.id, ruleId: rulePF.id, sequence: 40 },
      ],
      skipDuplicates: true,
    });
  }

  // 12. Seed Contract for Rahul Verma
  let contract = await prisma.contract.findFirst({
    where: { employeeId: employee.id, status: "active", companyId: company.id },
  });

  if (!contract) {
    contract = await prisma.contract.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        contractReference: "CNT-2026-0001",
        salaryStructureId: salaryStructure.id,
        scheduleId: schedule.id,
        departmentId: engDepartment.id,
        jobPositionId: sweJobPosition.id,
        startDate: new Date("2024-01-15"),
        wage: 75000.0,
        currency: "INR",
        status: "active",
      },
    });
    console.log(`[Seed] Created Active Contract: CNT-2026-0001 for Rahul Verma`);
  }

  // 13. Seed Time Off Types & Allocations for Rahul Verma
  let typeCasual = await prisma.timeOffType.findFirst({
    where: { code: "CL", companyId: company.id },
  });

  if (!typeCasual) {
    typeCasual = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Casual Leave",
        code: "CL",
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        color: "#714867",
        isActive: true,
      },
    });
  }

  let typeSick = await prisma.timeOffType.findFirst({
    where: { code: "SL", companyId: company.id },
  });

  if (!typeSick) {
    typeSick = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Sick Leave",
        code: "SL",
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        color: "#00C853",
        isActive: true,
      },
    });
  }

  let typePaid = await prisma.timeOffType.findFirst({
    where: { code: "PL", companyId: company.id },
  });

  if (!typePaid) {
    typePaid = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Paid Time Off",
        code: "PL",
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        color: "#FFAA00",
        isActive: true,
      },
    });
  }

  let typeUnpaid = await prisma.timeOffType.findFirst({
    where: { code: "UPL", companyId: company.id },
  });

  if (!typeUnpaid) {
    typeUnpaid = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Unpaid Leave",
        code: "UPL",
        unit: "days",
        requiresAllocation: false,
        approvalRequired: true,
        color: "#FF1744",
        isActive: true,
      },
    });
  }

  let typeComp = await prisma.timeOffType.findFirst({
    where: { code: "COMP", companyId: company.id },
  });

  if (!typeComp) {
    typeComp = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Compensatory Off",
        code: "COMP",
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        color: "#29B6F6",
        isActive: true,
      },
    });
  }

  let typeMatPat = await prisma.timeOffType.findFirst({
    where: { code: "MAT_PAT", companyId: company.id },
  });

  if (!typeMatPat) {
    typeMatPat = await prisma.timeOffType.create({
      data: {
        companyId: company.id,
        name: "Maternity / Paternity Leave",
        code: "MAT_PAT",
        unit: "days",
        requiresAllocation: true,
        approvalRequired: true,
        color: "#AB47BC",
        isActive: true,
      },
    });
  }

  // Seed Allocations
  let allocCL = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: typeCasual.id },
  });
  if (!allocCL) {
    await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: typeCasual.id,
        allocated: 12,
        taken: 2,
        remaining: 10,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  } else {
    await prisma.timeOffAllocation.update({
      where: { id: allocCL.id },
      data: { allocated: 12, taken: 2, remaining: 10, status: "approved" },
    });
  }

  let allocSL = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: typeSick.id },
  });
  if (!allocSL) {
    await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: typeSick.id,
        allocated: 10,
        taken: 1,
        remaining: 9,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  } else {
    await prisma.timeOffAllocation.update({
      where: { id: allocSL.id },
      data: { allocated: 10, taken: 1, remaining: 9, status: "approved" },
    });
  }

  let allocPL = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: typePaid.id },
  });
  if (!allocPL) {
    await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: typePaid.id,
        allocated: 15,
        taken: 0,
        remaining: 15,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  } else {
    await prisma.timeOffAllocation.update({
      where: { id: allocPL.id },
      data: { allocated: 15, taken: 0, remaining: 15, status: "approved" },
    });
  }

  let allocComp = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: typeComp.id },
  });
  if (!allocComp) {
    await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: typeComp.id,
        allocated: 5,
        taken: 0,
        remaining: 5,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  } else {
    await prisma.timeOffAllocation.update({
      where: { id: allocComp.id },
      data: { allocated: 5, taken: 0, remaining: 5, status: "approved" },
    });
  }

  let allocMatPat = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: typeMatPat.id },
  });
  if (!allocMatPat) {
    await prisma.timeOffAllocation.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        timeOffTypeId: typeMatPat.id,
        allocated: 90,
        taken: 0,
        remaining: 90,
        status: "approved",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  } else {
    await prisma.timeOffAllocation.update({
      where: { id: allocMatPat.id },
      data: { allocated: 90, taken: 0, remaining: 90, status: "approved" },
    });
  }

  console.log("\n=======================================================");
  console.log("FULL EMPLOYEE & HR SYSTEM ROLES SEEDED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("1. HR MANAGER ACCOUNT:");
  console.log("   Email:        hr.manager@peoplepay360.com");
  console.log("   Password:     Password123!");
  console.log("   Role:         HR_MANAGER");
  console.log("   Employee:     Maya Shah (EMP-HR-001)");
  console.log("   Access:       Employees, Contracts, Attendance, Time Off Approvals");
  console.log("-------------------------------------------------------");
  console.log("2. HR PAYROLL USER ACCOUNT:");
  console.log("   Email:        payroll.user@peoplepay360.com");
  console.log("   Password:     Password123!");
  console.log("   Role:         HR_PAYROLL_USER");
  console.log("   Employee:     Aarav Mehta (EMP-PAY-001)");
  console.log("   Access:       HR + Payruns & Payslips (Create/Read/Update)");
  console.log("-------------------------------------------------------");
  console.log("3. HR PAYROLL MANAGER ACCOUNT:");
  console.log("   Email:        payroll.manager@peoplepay360.com");
  console.log("   Password:     Password123!");
  console.log("   Role:         HR_PAYROLL_MANAGER");
  console.log("   Employee:     Nisha Rao (EMP-PAY-002)");
  console.log("   Access:       Full HR + Full Payroll & Salary Structures");
  console.log("-------------------------------------------------------");
  console.log("4. STANDARD EMPLOYEE ACCOUNT:");
  console.log("   Email:        rahul.employee@peoplepay360.com");
  console.log("   Password:     Password123!");
  console.log("   Role:         EMPLOYEE");
  console.log("   Employee:     Rahul Verma (EMP-2026-TEST)");
  console.log("   HR Manager:   Maya Shah (hr.manager@peoplepay360.com)");
  console.log("-------------------------------------------------------");
  console.log("5. ADMIN ACCOUNT:");
  console.log("   Email:        admin@peoplepay360.com");
  console.log("   Password:     Password123!");
  console.log("   Role:         ADMIN");
  console.log("=======================================================\n");

  process.exit(0);
}

seedEmployeeData().catch((err) => {
  console.error("[Seed Error]", err);
  process.exit(1);
});
