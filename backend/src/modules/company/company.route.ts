import { Router } from "express";
import { createCompany } from "./company.controller.js";

const router = Router();

router.post("/", createCompany);

export default router;
