import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import sendResponse from "../../shared/utils/ApiResponse.js";
import CatchAsync from "../../shared/utils/CatchAsync.js";
import {
  addRuleToStructureService,
  createSalaryRuleService,
  createSalaryStructureService,
  deleteSalaryRuleService,
  getSalaryRuleByIdService,
  getSalaryStructureByIdService,
  listSalaryRulesService,
  listSalaryStructuresService,
  removeRuleFromStructureService,
  updateSalaryRuleService,
  updateSalaryStructureService,
  updateStructureRuleSequenceService,
} from "./salary.service.js";

// Salary Structures Controllers
export const listSalaryStructures = CatchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId || undefined;
  const structures = await listSalaryStructuresService(companyId);
  sendResponse(res, StatusCodes.OK, "Salary structures fetched successfully", { items: structures, structures });
});

export const getSalaryStructure = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const structure = await getSalaryStructureByIdService(id);
  sendResponse(res, StatusCodes.OK, "Salary structure fetched successfully", { item: structure, structure });
});

export const createSalaryStructure = CatchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId || undefined;
  const structure = await createSalaryStructureService({ ...req.body, companyId });
  sendResponse(res, StatusCodes.CREATED, "Salary structure created successfully", { item: structure, structure });
});

export const updateSalaryStructure = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const structure = await updateSalaryStructureService(id, req.body);
  sendResponse(res, StatusCodes.OK, "Salary structure updated successfully", { structure });
});

export const addStructureRule = CatchAsync(async (req: Request, res: Response) => {
  const structureId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { ruleId, sequence } = req.body;
  const companyId = req.user?.companyId || undefined;
  const link = await addRuleToStructureService(structureId, ruleId, sequence, companyId);
  sendResponse(res, StatusCodes.CREATED, "Rule linked to structure successfully", { structureRule: link });
});

export const updateStructureRule = CatchAsync(async (req: Request, res: Response) => {
  const structureId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
  const { sequence } = req.body;
  const link = await updateStructureRuleSequenceService(structureId, ruleId, sequence);
  sendResponse(res, StatusCodes.OK, "Structure rule sequence updated successfully", { structureRule: link });
});

export const removeStructureRule = CatchAsync(async (req: Request, res: Response) => {
  const structureId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
  await removeRuleFromStructureService(structureId, ruleId);
  sendResponse(res, StatusCodes.OK, "Rule removed from structure successfully");
});

// Salary Rules Controllers
export const listSalaryRules = CatchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId || undefined;
  const rules = await listSalaryRulesService(companyId);
  sendResponse(res, StatusCodes.OK, "Salary rules fetched successfully", { items: rules, rules });
});

export const getSalaryRule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rule = await getSalaryRuleByIdService(id);
  sendResponse(res, StatusCodes.OK, "Salary rule fetched successfully", { item: rule, rule });
});

export const createSalaryRule = CatchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId || undefined;
  const rule = await createSalaryRuleService({ ...req.body, companyId });
  sendResponse(res, StatusCodes.CREATED, "Salary rule created successfully", { item: rule, rule });
});

export const updateSalaryRule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rule = await updateSalaryRuleService(id, req.body);
  sendResponse(res, StatusCodes.OK, "Salary rule updated successfully", { item: rule, rule });
});

export const deleteSalaryRule = CatchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteSalaryRuleService(id);
  sendResponse(res, StatusCodes.OK, "Salary rule deleted successfully");
});
