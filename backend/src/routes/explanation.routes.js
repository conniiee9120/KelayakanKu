import { Router } from "express";
import { generateRecommendationExplanation } from "../services/geminiService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { userProfile, recommendation } = req.body || {};

    if (!userProfile || !recommendation) {
      return res.status(400).json({
        errors: ["userProfile and recommendation are required."]
      });
    }

    const result = await generateRecommendationExplanation(userProfile, recommendation);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
