import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createCompanyService,
  getCompanyService,
  updateCompanyService,
  getCompaniesListService,
} from "./company.service.js";

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  const result = await createCompanyService(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company and Admin account created successfully",
    data: result,
  });
};

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Company ID is missing from session" });
    return;
  }
  const company = await getCompanyService(companyId);
  res.status(StatusCodes.OK).json({ success: true, data: company });
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Company ID is missing from session" });
    return;
  }
  const company = await updateCompanyService(companyId, req.body);
  res.status(StatusCodes.OK).json({ success: true, message: "Company updated successfully", data: company });
};

export const listCompanies = async (_req: Request, res: Response): Promise<void> => {
  const companies = await getCompaniesListService();
  res.status(StatusCodes.OK).json({ success: true, data: companies });
};
