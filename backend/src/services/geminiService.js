// Gemini explanation service. The rule engine remains the source of truth.
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function generateFallbackExplanation(_userProfile, recommendation = {}) {
  const title = recommendation.title || "this support program";
  const reasons =
    Array.isArray(recommendation.matchReasons) && recommendation.matchReasons.length > 0
      ? recommendation.matchReasons.slice(0, 2).join(" ")
      : "some parts of your profile appear to match the rule checks.";
  const documents =
    Array.isArray(recommendation.requiredDocuments) && recommendation.requiredDocuments.length > 0
      ? ` You may need to prepare documents such as ${recommendation.requiredDocuments.slice(0, 3).join(", ")}.`
      : "";

  return `You may be eligible for ${title}. This support appears to match your profile because ${reasons}${documents} Please verify the final criteria through the official portal or relevant agency before applying.`;
}

function buildExplanationPrompt(userProfile, recommendation) {
  return `
You are helping explain Malaysian financial aid eligibility to a user.
The backend rule engine has already calculated the eligibility score.
You must not override the score.
You must not claim the user is definitely eligible.
Use simple, supportive language suitable for B40 users in Malaysia.
Use safer phrasing like "You may be eligible" or "This support appears to match your profile".
Keep the explanation short, around 3 to 5 sentences.
Mention that users should verify through the official portal or relevant agency.
Use only the data provided by the backend.
Do not invent new eligibility rules.
Do not invent official URLs.
Do not ask for sensitive personal data.

User profile:
${JSON.stringify(userProfile, null, 2)}

Recommendation:
${JSON.stringify(recommendation, null, 2)}

Write a short explanation with:
1. Why this support may match the user
2. What information/documents may be needed
3. What next step the user should take

Return plain text only.
`.trim();
}

export async function generateRecommendationExplanation(userProfile, recommendation) {
  if (!isGeminiConfigured()) {
    return {
      source: "fallback",
      explanation: generateFallbackExplanation(userProfile, recommendation)
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildExplanationPrompt(userProfile, recommendation)
    });

    const explanation = response.text?.trim();

    return {
      source: explanation ? "gemini" : "fallback",
      explanation: explanation || generateFallbackExplanation(userProfile, recommendation)
    };
  } catch (error) {
    console.error("Gemini explanation request failed:", error?.message || error);
    return {
      source: "fallback",
      explanation: generateFallbackExplanation(userProfile, recommendation)
    };
  }
}
