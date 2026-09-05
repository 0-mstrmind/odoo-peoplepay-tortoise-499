import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createCompanyService } from "./company.service.js";

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  const result = await createCompanyService(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company and Admin account created successfully",
    data: result,
  });
};
