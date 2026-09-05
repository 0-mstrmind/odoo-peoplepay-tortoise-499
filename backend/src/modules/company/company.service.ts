import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/config/prisma.js";
import ApiError from "../../shared/utils/ApiError.js";
import { createAccessToken } from "../../shared/utils/Token.js";

export const createCompanyService = async (input: {
  name: string;
  slug?: string;
  industry?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  address?: string;
  phone?: string;
  adminEmail: string;
  adminPassword?: string;
  adminName?: string;
}) => {
  const rawSlug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const slug = rawSlug.replace(/^-|-$/g, "") || `company-${Date.now()}`;

  const existingCompany = await prisma.company.findFirst({
    where: { OR: [{ slug }, { name: input.name }], deletedAt: null },
  });

  if (existingCompany) {
    throw new ApiError(StatusCodes.CONFLICT, `Company with name '${input.name}' already exists`);
  }

  const passwordHash = input.adminPassword ? await bcrypt.hash(input.adminPassword, 10) : undefined;

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: input.name,
        slug,
        industry: input.industry || "Information Technology",
        country: input.country || "India",
        currency: input.currency || "INR",
        timezone: input.timezone || "Asia/Kolkata",
        address: input.address || null,
        phone: input.phone || null,
        email: input.adminEmail,
      },
    });

    let adminUser = await tx.user.findFirst({
      where: { email: input.adminEmail, deletedAt: null },
    });

    if (adminUser) {
      adminUser = await tx.user.update({
        where: { id: adminUser.id },
        data: {
          companyId: company.id,
          role: "admin",
          passwordHash: passwordHash || adminUser.passwordHash,
          isActive: true,
        },
      });
    } else {
      adminUser = await tx.user.create({
        data: {
          companyId: company.id,
          email: input.adminEmail,
          role: "admin",
          passwordHash,
          isActive: true,
        },
      });
    }

    const accessToken = createAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      type: "access",
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        country: company.country,
        currency: company.currency,
        timezone: company.timezone,
        address: company.address,
        phone: company.phone,
        email: company.email,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        companyId: company.id,
      },
      accessToken,
    };
  });
};

export const getCompanyService = async (companyId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  if (!company || company.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
  }
  return company;
};

export const updateCompanyService = async (
  companyId: string,
  input: {
    name?: string;
    industry?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  }
) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  if (!company || company.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
  }

  return prisma.company.update({
    where: { id: companyId },
    data: input,
  });
};

export const getCompaniesListService = async () => {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      country: true,
      currency: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });
};
