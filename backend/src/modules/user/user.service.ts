import { StatusCodes } from "http-status-codes";
import { prisma } from "../../core/config/prisma.js";
import { logger } from "../../core/config/logger.js";
import ApiError from "../../shared/utils/ApiError.js";
import { resolveCompanyId } from "../employee/employee.service.js";
import type { CreateUserInput, UpdateUserInput, QueryUserInput } from "./user.validation.js";

// Optional Clerk SDK helper (graceful fallback if keys missing)
let createClerkUser: ((email: string) => Promise<string | null>) | null = null;
let deleteClerkUser: ((clerkUserId: string) => Promise<void>) | null = null;

try {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (clerkSecretKey) {
    // Dynamically import clerk if available
    const { createClerkClient } = await import("@clerk/express");
    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

    createClerkUser = async (email: string) => {
      try {
        const user = await clerkClient.users.createUser({
          emailAddress: [email],
          skipPasswordRequirement: true,
        });
        return user.id;
      } catch (err: any) {
        logger.warn(`[Clerk] Account creation failed for ${email}: ${err.message}`);
        return null;
      }
    };

    deleteClerkUser = async (clerkUserId: string) => {
      try {
        await clerkClient.users.deleteUser(clerkUserId);
        logger.info(`[Clerk] Rolled back created Clerk user: ${clerkUserId}`);
      } catch (err: any) {
        logger.error(`[Clerk] Failed to delete rollback Clerk user ${clerkUserId}: ${err.message}`);
      }
    };
  }
} catch {
  logger.info("[Clerk] Clerk SDK not loaded; using local authentication mock keys.");
}

/**
 * List all user accounts with search, role, status filtering and pagination
 */
export const listUsersService = async (query: QueryUserInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const { search, role, status, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  if (companyId) {
    where.companyId = companyId;
  }

  if (role && role !== "All" && role !== "all") {
    where.role = role.toUpperCase();
  }

  if (status && status !== "all") {
    if (status.toUpperCase() === "ACTIVE") {
      where.isActive = true;
    } else if (status.toUpperCase() === "INACTIVE") {
      where.isActive = false;
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { email: { contains: s, mode: "insensitive" } },
      { linkedEmployee: { firstName: { contains: s, mode: "insensitive" } } },
      { linkedEmployee: { lastName: { contains: s, mode: "insensitive" } } },
      { linkedEmployee: { employeeCode: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        linkedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { name: true } },
            jobPosition: { select: { title: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      employeeId: u.employeeId,
      clerkUserId: u.clerkUserId,
      employeeName: u.linkedEmployee
        ? `${u.linkedEmployee.firstName} ${u.linkedEmployee.lastName}`
        : "Unlinked Account",
      employeeCode: u.linkedEmployee?.employeeCode,
      department: u.linkedEmployee?.department?.name,
      jobPosition: u.linkedEmployee?.jobPosition?.title,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get user detail by ID along with canDeactivate flag
 */
export const getUserByIdService = async (userId: string, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      companyId,
    },
    include: {
      linkedEmployee: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User account not found");
  }

  // Calculate canDeactivate flag
  let canDeactivate = true;
  if (user.role.toUpperCase() === "ADMIN") {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: { in: ["ADMIN", "admin"] },
        isActive: true,
        deletedAt: null,
        id: { not: userId },
      },
    });
    canDeactivate = activeAdminCount > 0;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
      clerkUserId: user.clerkUserId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      employeeName: user.linkedEmployee
        ? `${user.linkedEmployee.firstName} ${user.linkedEmployee.lastName}`
        : null,
    },
    canDeactivate,
  };
};

/**
 * Create a new user account with Clerk sync & local DB rollback
 */
export const createUserService = async (input: CreateUserInput, callerCompanyId?: string | null) => {
  const companyId = await resolveCompanyId(callerCompanyId);
  const { employeeId, email, role, isActive = true } = input;

  // Step 2: Validate employee exists in company
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null, companyId },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Selected employee record not found", [{ field: "employeeId" }]);
  }

  // Step 3: Validate employee does not already have a linked user
  const existingEmployeeUser = await prisma.user.findFirst({
    where: { employeeId, deletedAt: null },
  });

  if (existingEmployeeUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "This employee already has an active user account",
      [{ field: "employeeId" }],
    );
  }

  // Step 4: Validate email is not already taken
  const existingEmailUser = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
  });

  if (existingEmailUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Email address is already registered to another user",
      [{ field: "email" }],
    );
  }

  // Normalize role to upper case
  const normalizedRole = role.toUpperCase();

  // Step 6: Clerk account creation
  let clerkUserId: string | null = null;
  if (createClerkUser) {
    clerkUserId = await createClerkUser(email);
  }
  if (!clerkUserId) {
    clerkUserId = `clerk_user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Step 7: DB Transaction insert & link
  try {
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          companyId,
          clerkUserId,
          email: email.toLowerCase().trim(),
          employeeId,
          role: normalizedRole,
          isActive,
        },
      });

      // Update employee record with userId
      await tx.employee.update({
        where: { id: employeeId },
        data: { userId: created.id },
      });

      return created;
    });

    return newUser;
  } catch (dbErr: any) {
    logger.error(`[User] Local DB insert failed: ${dbErr.message}`);

    // Step 8: Rollback Clerk user account if DB insert fails
    if (clerkUserId && deleteClerkUser && !clerkUserId.startsWith("clerk_user_")) {
      await deleteClerkUser(clerkUserId);
    }

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to create user account: ${dbErr.message}`,
    );
  }
};

/**
 * Update user account (role & status with Last Admin Protection guard)
 */
export const updateUserService = async (
  userId: string,
  input: UpdateUserInput,
  callerCompanyId?: string | null,
) => {
  const companyId = await resolveCompanyId(callerCompanyId);

  const existingUser = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, companyId },
  });

  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User account not found");
  }

  const newRole = input.role ? input.role.toUpperCase() : existingUser.role.toUpperCase();
  const newIsActive = input.isActive !== undefined ? input.isActive : existingUser.isActive;

  // Last Admin Protection Guard
  if (existingUser.role.toUpperCase() === "ADMIN" && (newRole !== "ADMIN" || newIsActive === false)) {
    const remainingActiveAdmins = await prisma.user.count({
      where: {
        role: { in: ["ADMIN", "admin"] },
        isActive: true,
        deletedAt: null,
        id: { not: userId },
      },
    });

    if (remainingActiveAdmins === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot remove or deactivate the last active Admin account",
        [{ field: "isActive" }],
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.role ? { role: newRole } : {}),
      ...(input.isActive !== undefined ? { isActive: newIsActive } : {}),
      ...(input.email ? { email: input.email.toLowerCase().trim() } : {}),
    },
  });

  return updatedUser;
};
