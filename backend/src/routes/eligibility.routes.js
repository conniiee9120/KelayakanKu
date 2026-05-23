import { Router } from "express";
import { getPublicPolicies } from "../services/policyDatabaseService.js";
import { runEligibilityCheck } from "../services/ruleEngine.js";
import { formatEligibilityResponse } from "../utils/responseFormatter.js";
import { validateUserProfile } from "../utils/validateUserProfile.js";

const router = Router();

router.post("/check", async (req, res, next) => {
  const validation = validateUserProfile(req.body);

  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  try {
    const scoredPolicies = runEligibilityCheck(validation.profile, await getPublicPolicies());
    res.json(formatEligibilityResponse(scoredPolicies));
  } catch (error) {
    next(error);
  }
});

export default router;
