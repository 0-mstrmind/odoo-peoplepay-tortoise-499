import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import * as contractService from "./contract.service.js";

export const createContractHandler = CatchAsync(async (req: Request, res: Response) => {
  const userRole = req.user?.role?.toLowerCase();
  const contract = await contractService.createContract(req.user!.companyId!, req.user!.id, req.body, userRole);
  sendResponse(res, StatusCodes.CREATED, "Contract created successfully", { item: contract, contract });
});

export const getContractsHandler = CatchAsync(async (req: Request, res: Response) => {
  const employeeId = req.query.employeeId as string | undefined;
  const status = req.query.status as string | undefined;
  const contracts = await contractService.getContracts(req.user!.companyId!, employeeId, status);
  sendResponse(res, StatusCodes.OK, "Contracts retrieved successfully", { items: contracts, contracts });
});

export const updateContractHandler = CatchAsync(async (req: Request, res: Response) => {
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userRole = req.user?.role?.toLowerCase();
  const contract = await contractService.updateContract(req.user!.companyId!, targetId, req.body, userRole);
  sendResponse(res, StatusCodes.OK, "Contract updated successfully", { item: contract, contract });
});
