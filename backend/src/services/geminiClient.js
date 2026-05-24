// Shared Gemini model selection and quota-aware retry helper.
import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export function isMockGeminiEnabled() {
  return String(process.env.USE_MOCK_GEMINI || "false").toLowerCase() === "true";
}

export function getConfiguredGeminiModel(envName) {
  return process.env[envName] || DEFAULT_GEMINI_MODEL;
}

export function isGeminiQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const status = error?.status || error?.code || error?.response?.status;
  return status === 429 || message.includes("429") || message.includes("resource_exhausted") || message.includes("quota");
}

export async function generateGeminiText({ task, model, contents, fallbackModel = DEFAULT_GEMINI_MODEL }) {
  if (!process.env.GEMINI_API_KEY || isMockGeminiEnabled()) {
    return {
      text: "",
      source: "fallback",
      reason: isMockGeminiEnabled() ? "mock_gemini_enabled" : "not_configured",
      model,
      fallbackModelUsed: false,
      quotaExceeded: false
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({ model, contents });
    return {
      text: response.text?.trim() || "",
      source: "gemini",
      reason: "",
      model,
      fallbackModelUsed: false,
      quotaExceeded: false
    };
  } catch (error) {
    const quotaExceeded = isGeminiQuotaError(error);

    if (quotaExceeded && model !== fallbackModel) {
      try {
        const fallbackResponse = await ai.models.generateContent({ model: fallbackModel, contents });
        return {
          text: fallbackResponse.text?.trim() || "",
          source: "gemini",
          reason: "",
          model: fallbackModel,
          fallbackModelUsed: true,
          quotaExceeded: true
        };
      } catch (fallbackError) {
        console.error(`[Gemini] ${task} fallback failed:`, fallbackError?.message || fallbackError);
        return {
          text: "",
          source: "fallback",
          reason: isGeminiQuotaError(fallbackError) ? "quota_exceeded" : "request_failed",
          model: fallbackModel,
          fallbackModelUsed: true,
          quotaExceeded: isGeminiQuotaError(fallbackError)
        };
      }
    }

    console.error(`[Gemini] ${task} failed:`, error?.message || error);
    return {
      text: "",
      source: "fallback",
      reason: quotaExceeded ? "quota_exceeded" : "request_failed",
      model,
      fallbackModelUsed: false,
      quotaExceeded
    };
  }
}
