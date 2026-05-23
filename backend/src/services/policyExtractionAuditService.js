// Second-pass audit that checks whether extracted values are supported by source text.
import { DEFAULT_GEMINI_MODEL, generateGeminiText, getConfiguredGeminiModel } from "./geminiClient.js";

function fallbackAudit() {
  return {
    auditPassed: false,
    fieldIssues: [
      {
        field: "overall",
        issue: "Gemini audit was unavailable. Admin must cross-check all fields manually.",
        severity: "high"
      }
    ],
    correctedWarnings: ["Audit unavailable. Do not approve without manual review."]
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

Return shape:
{
  "auditPassed": true,
  "fieldIssues": [
    {
      "field": "eligibilityRules.maxHouseholdIncome",
      "issue": "No supporting evidence found in source text.",
      "severity": "high"
    }
  ],
  "correctedWarnings": []
}

Official source text:
${rawText.slice(0, 18000)}

Extracted policy draft:
${JSON.stringify(extractedPolicy, null, 2)}
`.trim();
}

export async function auditExtractedPolicy({ rawText, extractedPolicy }) {
  const model = getConfiguredGeminiModel("GEMINI_AUDIT_MODEL");

  const result = await generateGeminiText({
    task: "policy_extraction_audit",
    model,
    fallbackModel: DEFAULT_GEMINI_MODEL,
    contents: buildAuditPrompt({ rawText, extractedPolicy })
  });

  if (result.text) {
    try {
      const parsed = parseJson(result.text);
      const correctedWarnings = Array.isArray(parsed.correctedWarnings) ? parsed.correctedWarnings : [];
      if (result.fallbackModelUsed) correctedWarnings.push("Selected Gemini audit model hit quota. Retried with fallback model.");
      return {
        auditPassed: Boolean(parsed.auditPassed),
        fieldIssues: Array.isArray(parsed.fieldIssues) ? parsed.fieldIssues : [],
        correctedWarnings
      };
    } catch (error) {
      console.error("Policy extraction audit parsing failed:", error?.message || error);
    }
  }

  const audit = fallbackAudit();
  if (result.reason === "quota_exceeded") {
    audit.correctedWarnings = ["Gemini audit quota is exhausted. Admin must cross-check all fields manually."];
  }
  return audit;
}
