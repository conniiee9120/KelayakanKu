// Second-pass audit that checks whether extracted values are supported by source text.
import { DEFAULT_GEMINI_MODEL, generateGeminiText, getConfiguredGeminiModel } from "./geminiClient.js";

const SEVERITIES = new Set(["low", "medium", "high"]);

function unavailableAudit(reason = "unknown", warning = "Audit unavailable. Do not approve without manual review.") {
  return {
    status: "unavailable",
    auditPassed: false,
    summary: "Gemini audit was unavailable. Admin must manually cross-check all extracted fields.",
    fieldIssues: [
      {
        field: "overall",
        severity: "high",
        issue: "Gemini audit was unavailable.",
        suggestion: "Admin must cross-check all fields manually against the official source."
      }
    ],
    warnings: warning ? [warning] : [],
    correctedWarnings: warning ? [warning] : [],
    needsManualReview: true,
    reason
  };
}

function completedAudit(parsed = {}) {
  const fieldIssues = Array.isArray(parsed.fieldIssues)
    ? parsed.fieldIssues.map((issue) => ({
      field: issue.field || "overall",
      severity: SEVERITIES.has(issue.severity) ? issue.severity : "medium",
      issue: issue.issue || "This field needs manual checking.",
      suggestion: issue.suggestion || "Admin should verify this field manually."
    }))
    : [];
  const auditPassed = Boolean(parsed.auditPassed) && fieldIssues.length === 0;
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean) : [];

  return {
    status: "completed",
    auditPassed,
    summary: parsed.summary || (auditPassed
      ? "Audit completed. Extracted fields are mostly supported by the source text."
      : "Audit found fields that need manual checking."),
    fieldIssues,
    warnings,
    correctedWarnings: warnings,
    needsManualReview: true
  };
}

function parseJson(text = "") {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function buildAuditPrompt({ rawText, extractedPolicy }) {
  return `
You are auditing extracted policy data against official source text.
Check whether each extracted value is directly supported by the source text.
Do not add new policy data.
Flag unsupported, uncertain, conflicting, or invented fields.
Return valid JSON only.

Expected JSON format:
{
  "auditPassed": false,
  "summary": "string",
  "fieldIssues": [
    {
      "field": "eligibilityRules.maxHouseholdIncome",
      "issue": "No supporting evidence found in source text.",
      "severity": "high",
      "suggestion": "Admin should verify this field manually."
    }
  ],
  "warnings": []
}

Return JSON only. Do not include markdown or explanation outside JSON.

Official source text:
${rawText.slice(0, 18000)}

Extracted policy draft:
${JSON.stringify(extractedPolicy, null, 2)}
`.trim();
}

export function auditResultFromGeminiResult(result, { missingApiKey = false } = {}) {
  if (missingApiKey) return unavailableAudit("missing_api_key", "Gemini API key is not configured. Admin must audit manually.");
  if (result.reason === "mock_gemini_enabled") return unavailableAudit("missing_api_key", "Mock Gemini mode is enabled. Admin must audit manually.");
  if (result.reason === "not_configured") return unavailableAudit("missing_api_key", "Gemini API key is not configured. Admin must audit manually.");
  if (result.reason === "quota_exceeded") return unavailableAudit("quota_exceeded", "Gemini audit quota is exhausted. Admin must cross-check all fields manually.");
  if (result.reason === "request_failed") return unavailableAudit("gemini_request_failed", "Gemini audit request failed. Admin must cross-check all fields manually.");
  if (!result.text) return unavailableAudit("unknown", "Gemini audit returned no text. Admin must cross-check all fields manually.");

  try {
    return completedAudit(parseJson(result.text));
  } catch (error) {
    console.error("Policy extraction audit parsing failed:", error?.message || error);
    return unavailableAudit("invalid_json", "Gemini audit response could not be parsed. Admin must cross-check all fields manually.");
  }
}

export async function auditExtractedPolicy({ rawText, extractedPolicy }) {
  const model = getConfiguredGeminiModel("GEMINI_AUDIT_MODEL");
  const missingApiKey = !process.env.GEMINI_API_KEY;

  const result = await generateGeminiText({
    task: "policy_extraction_audit",
    model,
    fallbackModel: DEFAULT_GEMINI_MODEL,
    contents: buildAuditPrompt({ rawText, extractedPolicy })
  });

  const audit = auditResultFromGeminiResult(result, { missingApiKey });
  if (result.fallbackModelUsed && audit.status === "completed") {
    audit.warnings.push("Selected Gemini audit model hit quota. Retried with fallback model.");
    audit.correctedWarnings.push("Selected Gemini audit model hit quota. Retried with fallback model.");
  }

  return audit;
}
