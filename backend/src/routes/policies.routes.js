import { Router } from "express";
import { getPublicPolicies } from "../services/policyDatabaseService.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getPublicPolicies());
  } catch (error) {
    next(error);
  }
});

export default router;
