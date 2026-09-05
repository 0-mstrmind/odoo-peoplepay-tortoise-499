import bcrypt from "bcryptjs";
import { prisma } from "./core/config/prisma.js";

async function seedTestUsers() {
  console.log("[Seed] Starting test user & employee seeding...");

  // 1. Resolve or create default company
  let company = await prisma.company.findFirst({ where: { deletedAt: null } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "PeoplePay360 Inc.",
        slug: "peoplepay360",
        industry: "Software & Technology",
        currency: "INR",
      },
    });
    console.log(`[Seed] Created company: ${company.name} (${company.id})`);
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
  }

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 3. Seed / Update Test Employee Record for Rahul Verma
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
        departmentId: department.id,
        jobPositionId: jobPosition.id,
        employeeType: "full_time",
        status: "active",
        companyId: company.id,
      },
    });
    console.log(`[Seed] Created Employee master record: Rahul Verma (${employee.id})`);
  }

  // 4. Seed / Update Test EMPLOYEE User Account
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
    console.log(`[Seed] Updated EMPLOYEE User account credentials: ${employeeUser.email}`);
  }

  // Link employee.userId -> employeeUser.id
  await prisma.employee.update({
    where: { id: employee.id },
    data: { userId: employeeUser.id },
  });

  // 5. Seed / Update Test Users for Other Roles
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
      console.log(`[Seed] Updated ${u.role} User credentials: ${u.email}`);
    }
  }

  console.log("\n=======================================================");
  console.log("TEST USERS SEEDED SUCCESSFULLY IN DATABASE!");
  console.log("=======================================================");
  console.log("EMPLOYEE USER:");
  console.log("  Email:    rahul.employee@peoplepay360.com");
  console.log("  Password: Password123!");
  console.log("  Role:     EMPLOYEE");
  console.log("  Linked:   Rahul Verma (Software Engineer)");
  console.log("-------------------------------------------------------");
  console.log("ADMIN USER:");
  console.log("  Email:    admin@peoplepay360.com");
  console.log("  Password: Password123!");
  console.log("  Role:     ADMIN");
  console.log("=======================================================\n");

  process.exit(0);
}

seedTestUsers().catch((err) => {
  console.error("[Seed Error]", err);
  process.exit(1);
});
