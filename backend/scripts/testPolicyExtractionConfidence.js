import assert from "node:assert/strict";
import { calculateExtractionConfidence } from "../src/utils/policyConfidence.js";

const fullPolicy = {
  title: "Bantuan Tunai Rahmah",
  category: "Cash Aid",
  shortDescription: "Cash assistance for eligible households.",
  eligibilityRules: {
    citizenship: "Malaysian",
    maxHouseholdIncome: 5000,
    maxMonthlyIncome: 5000,
    states: ["All"],
    minAge: 18,
    maxAge: 60,
    employmentStatuses: ["Employed", "Self-employed"]
  },
  requiredDocuments: ["MyKad", "Income statement"],
  nextSteps: ["Apply online", "Submit supporting documents"],
  officialUrl: "https://bantuantunai.hasil.gov.my",
  sourceUrl: "https://bantuantunai.hasil.gov.my"
};

const fullEvidence = {
  title: { evidence: "Bantuan Tunai Rahmah", confidence: 0.95, status: "confirmed" },
  category: { evidence: "bantuan tunai", confidence: 0.9, status: "confirmed" },
  "eligibilityRules.citizenship": { evidence: "Warganegara Malaysia", confidence: 0.9, status: "confirmed" },
  "eligibilityRules.maxHouseholdIncome": { evidence: "pendapatan isi rumah RM5,000", confidence: 0.9, status: "confirmed" },
  "eligibilityRules.minAge": { evidence: "18 tahun", confidence: 0.85, status: "confirmed" },
  requiredDocuments: { evidence: "MyKad dan dokumen pendapatan", confidence: 0.9, status: "confirmed" },
  nextSteps: { evidence: "Permohonan secara dalam talian", confidence: 0.9, status: "confirmed" }
};

const passedAudit = { auditPassed: true, fieldIssues: [], correctedWarnings: [] };
const valid = { valid: true, errors: [] };

function confidence(payload) {
  return calculateExtractionConfidence({
    audit: passedAudit,
    validation: valid,
    warnings: [],
    ...payload
  });
}

const good = confidence({ policy: fullPolicy, evidenceByField: fullEvidence });
assert.ok(good.overallConfidence >= 80, `expected good confidence >= 80, got ${good.overallConfidence}`);
assert.equal(good.riskLevel, "low");

const partial = confidence({
  policy: {
    title: "Partial policy",
    category: "Other",
    shortDescription: "Partial details.",
    eligibilityRules: { citizenship: "Malaysian", states: ["All"] },
    requiredDocuments: [],
    nextSteps: [],
    officialUrl: ""
  },
  evidenceByField: {
    title: fullEvidence.title,
    category: fullEvidence.category,
    "eligibilityRules.citizenship": fullEvidence["eligibilityRules.citizenship"]
  }
});
assert.ok(partial.overallConfidence >= 50 && partial.overallConfidence <= 79, `expected partial confidence 50-79, got ${partial.overallConfidence}`);
assert.equal(partial.riskLevel, "medium");

const unavailableAudit = confidence({
  policy: {},
  evidenceByField: {},
  audit: {
    auditPassed: false,
    fieldIssues: [{ field: "overall", severity: "high", issue: "Gemini audit was unavailable." }],
    correctedWarnings: ["Audit unavailable. Do not approve without manual review."]
  },
  warnings: ["Extraction failed. Admin must review and complete the draft manually."]
});
assert.ok(unavailableAudit.overallConfidence < 50, `expected unavailable audit confidence < 50, got ${unavailableAudit.overallConfidence}`);
assert.equal(unavailableAudit.riskLevel, "high");

const validationFailed = confidence({
  policy: { ...fullPolicy, title: "" },
  evidenceByField: { ...fullEvidence, title: { evidence: "", confidence: 0, status: "missing" } },
  validation: { valid: false, errors: ["Policy title is required."] }
});
assert.ok(validationFailed.overallConfidence < good.overallConfidence, "expected validation failure to reduce confidence");
assert.ok(["medium", "high"].includes(validationFailed.riskLevel), `expected medium or high risk, got ${validationFailed.riskLevel}`);

console.log("Policy extraction confidence tests passed.");
