import { Router } from "express";
import { getAllPolicies } from "../services/policyDatabaseService.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getAllPolicies());
  } catch (error) {
    next(error);
  }
});

export default router;
