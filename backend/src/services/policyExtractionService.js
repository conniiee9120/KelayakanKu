// Gemini extraction with field-level evidence. Nothing here saves policies automatically.
import { normalizePolicy } from "../utils/validatePolicy.js";
import { DEFAULT_GEMINI_MODEL, generateGeminiText, getConfiguredGeminiModel } from "./geminiClient.js";

const FIELD_STATUSES = new Set(["confirmed", "uncertain", "missing", "conflicting"]);

function field(value, evidence = "", confidence = 0, status = "missing") {
  return {
    value,
    evidence,
    confidence: Math.max(0, Math.min(1, Number(confidence || 0))),
    status: FIELD_STATUSES.has(status) ? status : "missing"
  };
}

function fallbackPolicyDraft({ sourceUrl = "", rawText = "" }) {
  const text = rawText.slice(0, 260);
  return {
    id: field("", "", 0, "missing"),
    title: field("Draft policy for review", text, text ? 0.25 : 0, text ? "uncertain" : "missing"),
    category: field("Other", "", 0, "missing"),
    shortDescription: field(text || "Review the source and complete missing policy details.", text, text ? 0.25 : 0, text ? "uncertain" : "missing"),
    eligibilityRules: {
      citizenship: field("Malaysian", "", 0, "missing"),
      maxHouseholdIncome: field(null),
      maxMonthlyIncome: field(null),
      states: field(["All"], "", 0, "missing"),
      minAge: field(null),
      maxAge: field(null),
      employmentStatuses: field([]),
      requiresChildren: field(false),
      requiresDisability: field(false),
      requiresStudent: field(false)
    },
    requiredDocuments: field([]),
    nextSteps: field(["Review official source", "Complete missing criteria", "Approve only after verification"], "", 0.2, "uncertain"),
    officialUrl: field(sourceUrl || "", sourceUrl ? "source URL provided by admin" : "", sourceUrl ? 0.4 : 0, sourceUrl ? "uncertain" : "missing"),
    sourceUrl: field(sourceUrl, sourceUrl ? "source URL provided by admin" : "", sourceUrl ? 1 : 0, sourceUrl ? "confirmed" : "missing"),
    applicationDeadline: field(null)
  };
}

export function createEmptyEditablePolicy({ sourceUrl = "" } = {}) {
  return normalizePolicy({
    id: "",
    title: "",
    category: "Other",
    shortDescription: "",
    eligibilityRules: {
      citizenship: "Malaysian",
      maxHouseholdIncome: null,
      maxMonthlyIncome: null,
      states: ["All"],
      minAge: null,
      maxAge: null,
      employmentStatuses: [],
      requiresChildren: false,
      requiresDisability: false,
      requiresStudent: false
    },
    requiredDocuments: [],
    nextSteps: [],
    officialUrl: sourceUrl || "",
    sourceUrl: sourceUrl || "",
    lastUpdated: new Date().toISOString().slice(0, 10),
    verificationStatus: "pending_review"
  });
}

function parseJson(text = "") {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function buildExtractionPrompt({ rawText = "", sourceUrl = "" }) {
  return `
You are extracting structured data for a Malaysian financial aid eligibility system.
Use only the provided official source text.
Do not invent missing eligibility rules, income limits, deadlines, documents, or URLs.
For every extracted field, provide:
1. value
2. short evidence quote from the source text
3. confidence from 0 to 1
4. status: confirmed, uncertain, missing, or conflicting

If a field is not clearly stated, use:
value: null or []
evidence: ""
confidence: 0
status: "missing"

Return valid JSON only.
Do not include markdown.
Do not include explanation outside JSON.

Required output shape:
{
  "policyDraft": {
    "id": { "value": "string", "evidence": "", "confidence": 0.9, "status": "confirmed" },
    "title": { "value": "string", "evidence": "short source quote", "confidence": 0.9, "status": "confirmed" },
    "category": { "value": "Cash Aid | Food Aid | Education Aid | Housing Aid | Employment Aid | Healthcare Aid | Other", "evidence": "short source quote", "confidence": 0.9, "status": "confirmed" },
    "shortDescription": { "value": "string", "evidence": "short source quote", "confidence": 0.9, "status": "confirmed" },
    "eligibilityRules": {
      "citizenship": { "value": "Malaysian", "evidence": "short source quote", "confidence": 0.9, "status": "confirmed" },
      "maxHouseholdIncome": { "value": null, "evidence": "", "confidence": 0, "status": "missing" },
      "maxMonthlyIncome": { "value": null, "evidence": "", "confidence": 0, "status": "missing" },
      "states": { "value": ["All"], "evidence": "short source quote", "confidence": 0.9, "status": "confirmed" },
      "minAge": { "value": null, "evidence": "", "confidence": 0, "status": "missing" },
      "maxAge": { "value": null, "evidence": "", "confidence": 0, "status": "missing" },
      "employmentStatuses": { "value": [], "evidence": "", "confidence": 0, "status": "missing" },
      "requiresChildren": { "value": false, "evidence": "", "confidence": 0, "status": "missing" },
      "requiresDisability": { "value": false, "evidence": "", "confidence": 0, "status": "missing" },
      "requiresStudent": { "value": false, "evidence": "", "confidence": 0, "status": "missing" }
    },
    "requiredDocuments": { "value": [], "evidence": "", "confidence": 0, "status": "missing" },
    "nextSteps": { "value": [], "evidence": "", "confidence": 0, "status": "missing" },
    "officialUrl": { "value": "", "evidence": "", "confidence": 0, "status": "missing" },
    "sourceUrl": { "value": "string", "evidence": "source URL provided by admin", "confidence": 1, "status": "confirmed" },
    "applicationDeadline": { "value": null, "evidence": "", "confidence": 0, "status": "missing" }
  },
  "warnings": []
}

Source URL:
${sourceUrl}

Official source text:
${rawText.slice(0, 18000)}
`.trim();
}

function normalizeDraft(draft = {}, sourceUrl = "") {
  const rules = draft.eligibilityRules || {};
  return {
    id: draft.id || field(""),
    title: draft.title || field(""),
    category: draft.category || field("Other"),
    shortDescription: draft.shortDescription || field(""),
    eligibilityRules: {
      citizenship: rules.citizenship || field("Malaysian"),
      maxHouseholdIncome: rules.maxHouseholdIncome || field(null),
      maxMonthlyIncome: rules.maxMonthlyIncome || field(null),
      states: rules.states || field(["All"]),
      minAge: rules.minAge || field(null),
      maxAge: rules.maxAge || field(null),
      employmentStatuses: rules.employmentStatuses || field([]),
      requiresChildren: rules.requiresChildren || field(false),
      requiresDisability: rules.requiresDisability || field(false),
      requiresStudent: rules.requiresStudent || field(false)
    },
    requiredDocuments: draft.requiredDocuments || field([]),
    nextSteps: draft.nextSteps || field([]),
    officialUrl: draft.officialUrl || field(""),
    sourceUrl: draft.sourceUrl || field(sourceUrl, sourceUrl ? "source URL provided by admin" : "", sourceUrl ? 1 : 0, sourceUrl ? "confirmed" : "missing"),
    applicationDeadline: draft.applicationDeadline || field(null)
  };
}

function fieldMeta(fieldDraft) {
  return {
    evidence: fieldDraft?.evidence || "",
    confidence: Number(fieldDraft?.confidence || 0),
    status: fieldDraft?.status || "missing"
  };
}

function collectEvidence(policyDraft) {
  return {
    id: fieldMeta(policyDraft.id),
    title: fieldMeta(policyDraft.title),
    category: fieldMeta(policyDraft.category),
    shortDescription: fieldMeta(policyDraft.shortDescription),
    "eligibilityRules.citizenship": fieldMeta(policyDraft.eligibilityRules.citizenship),
    "eligibilityRules.maxHouseholdIncome": fieldMeta(policyDraft.eligibilityRules.maxHouseholdIncome),
    "eligibilityRules.maxMonthlyIncome": fieldMeta(policyDraft.eligibilityRules.maxMonthlyIncome),
    "eligibilityRules.states": fieldMeta(policyDraft.eligibilityRules.states),
    "eligibilityRules.minAge": fieldMeta(policyDraft.eligibilityRules.minAge),
    "eligibilityRules.maxAge": fieldMeta(policyDraft.eligibilityRules.maxAge),
    "eligibilityRules.employmentStatuses": fieldMeta(policyDraft.eligibilityRules.employmentStatuses),
    "eligibilityRules.requiresChildren": fieldMeta(policyDraft.eligibilityRules.requiresChildren),
    "eligibilityRules.requiresDisability": fieldMeta(policyDraft.eligibilityRules.requiresDisability),
    "eligibilityRules.requiresStudent": fieldMeta(policyDraft.eligibilityRules.requiresStudent),
    requiredDocuments: fieldMeta(policyDraft.requiredDocuments),
    nextSteps: fieldMeta(policyDraft.nextSteps),
    officialUrl: fieldMeta(policyDraft.officialUrl),
    sourceUrl: fieldMeta(policyDraft.sourceUrl),
    applicationDeadline: fieldMeta(policyDraft.applicationDeadline)
  };
}

export function flattenPolicyDraft(policyDraft, { confidence, audit, warnings = [] } = {}) {
  const flat = normalizePolicy({
    id: policyDraft.id?.value || "",
    title: policyDraft.title?.value || "",
    category: policyDraft.category?.value || "Other",
    shortDescription: policyDraft.shortDescription?.value || "",
    eligibilityRules: {
      citizenship: policyDraft.eligibilityRules?.citizenship?.value || "Malaysian",
      maxHouseholdIncome: policyDraft.eligibilityRules?.maxHouseholdIncome?.value ?? null,
      maxMonthlyIncome: policyDraft.eligibilityRules?.maxMonthlyIncome?.value ?? null,
      states: policyDraft.eligibilityRules?.states?.value || ["All"],
      minAge: policyDraft.eligibilityRules?.minAge?.value ?? null,
      maxAge: policyDraft.eligibilityRules?.maxAge?.value ?? null,
      employmentStatuses: policyDraft.eligibilityRules?.employmentStatuses?.value || [],
      requiresChildren: policyDraft.eligibilityRules?.requiresChildren?.value || false,
      requiresDisability: policyDraft.eligibilityRules?.requiresDisability?.value || false,
      requiresStudent: policyDraft.eligibilityRules?.requiresStudent?.value || false
    },
    requiredDocuments: policyDraft.requiredDocuments?.value || [],
    nextSteps: policyDraft.nextSteps?.value || [],
    officialUrl: policyDraft.officialUrl?.value || "",
    sourceUrl: policyDraft.sourceUrl?.value || "",
    verificationStatus: "pending_review"
  });

  return {
    ...flat,
    applicationDeadline: policyDraft.applicationDeadline?.value ?? null,
    extractionMeta: {
      overallConfidence: confidence?.overallConfidence ?? 0,
      riskLevel: confidence?.riskLevel || "high",
      evidenceByField: collectEvidence(policyDraft),
      auditStatus: audit?.status || "completed",
      auditSummary: audit?.summary || "",
      auditReason: audit?.reason || "",
      auditIssues: audit?.fieldIssues || [],
      warnings
    }
  };
}

export async function extractPolicyWithEvidence({ rawText = "", sourceUrl = "" }) {
  const model = getConfiguredGeminiModel("GEMINI_EXTRACTION_MODEL");

  const result = await generateGeminiText({
    task: "policy_extraction",
    model,
    fallbackModel: DEFAULT_GEMINI_MODEL,
    contents: buildExtractionPrompt({ rawText, sourceUrl })
  });

  if (result.text) {
    try {
      const parsed = parseJson(result.text);
      const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
      if (result.fallbackModelUsed) warnings.push("Selected Gemini extraction model hit quota. Retried with fallback model.");
      return {
        policyDraft: normalizeDraft(parsed.policyDraft, sourceUrl),
        warnings
      };
    } catch (error) {
      console.error("Policy extraction JSON parsing failed:", error?.message || error);
    }
  }

  return {
    policyDraft: fallbackPolicyDraft({ sourceUrl, rawText }),
    warnings: [
      result.reason === "quota_exceeded"
        ? "Gemini quota is exhausted. Admin must review and complete the draft manually."
        : result.reason === "mock_gemini_enabled"
          ? "Mock Gemini mode is enabled. Admin must review manually."
        : result.reason === "not_configured"
          ? "Gemini extraction is not configured. Admin must review manually."
        : "Extraction failed. Admin must review and complete the draft manually."
    ]
  };
}

// Backward-compatible wrapper for older callers.
export async function extractPolicy(payload) {
  const result = await extractPolicyWithEvidence(payload);
  return {
    extractedPolicy: flattenPolicyDraft(result.policyDraft, { warnings: result.warnings }),
    warnings: result.warnings
  };
}
