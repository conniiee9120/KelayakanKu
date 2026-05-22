// Second-pass audit that checks whether extracted values are supported by source text.
import { GoogleGenAI } from "@google/genai";

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
  if (!process.env.GEMINI_API_KEY) return fallbackAudit();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildAuditPrompt({ rawText, extractedPolicy })
    });
    const parsed = parseJson(response.text || "{}");

    return {
      auditPassed: Boolean(parsed.auditPassed),
      fieldIssues: Array.isArray(parsed.fieldIssues) ? parsed.fieldIssues : [],
      correctedWarnings: Array.isArray(parsed.correctedWarnings) ? parsed.correctedWarnings : []
    };
  } catch (error) {
    console.error("Policy extraction audit failed:", error?.message || error);
    return fallbackAudit();
  }
}
