// Confidence scoring for evidence-based policy extraction drafts.
const IMPORTANT_FIELD_PATHS = [
  "title",
  "category",
  "shortDescription",
  "eligibilityRules.citizenship",
  "eligibilityRules.maxHouseholdIncome",
  "eligibilityRules.maxMonthlyIncome",
  "eligibilityRules.states",
  "eligibilityRules.minAge",
  "eligibilityRules.maxAge",
  "eligibilityRules.employmentStatuses",
  "eligibilityRules.requiresChildren",
  "eligibilityRules.requiresDisability",
  "eligibilityRules.requiresStudent",
  "requiredDocuments",
  "nextSteps",
  "officialUrl",
  "sourceUrl",
  "applicationDeadline"
];

function getField(draft, path) {
  return path.split(".").reduce((value, key) => value?.[key], draft);
}

function hasValue(field) {
  const value = field?.value;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

export function calculateOverallConfidence(policyDraft, auditResult) {
  const fields = IMPORTANT_FIELD_PATHS.map((path) => getField(policyDraft, path)).filter(Boolean);
  const average = fields.length
    ? fields.reduce((sum, field) => sum + Number(field.confidence || 0), 0) / fields.length
    : 0;
  const highIssues = (auditResult?.fieldIssues || []).filter((issue) => issue.severity === "high").length;

  let score = average;
  if (highIssues) score -= Math.min(0.35, highIssues * 0.08);
  if (!hasValue(getField(policyDraft, "title"))) score -= 0.15;
  if (!hasValue(getField(policyDraft, "officialUrl"))) score -= 0.08;
  if (!hasValue(getField(policyDraft, "eligibilityRules.maxHouseholdIncome"))) score -= 0.05;

  const ruleFields = [
    "eligibilityRules.citizenship",
    "eligibilityRules.maxHouseholdIncome",
    "eligibilityRules.maxMonthlyIncome",
    "eligibilityRules.states",
    "eligibilityRules.minAge",
    "eligibilityRules.maxAge",
    "eligibilityRules.employmentStatuses"
  ];
  const presentRules = ruleFields.filter((path) => hasValue(getField(policyDraft, path))).length;
  if (presentRules <= 2) score -= 0.12;

  const overallConfidence = Math.max(0, Math.min(1, Number(score.toFixed(2))));
  const riskLevel = overallConfidence >= 0.78 && highIssues === 0 ? "low" : overallConfidence >= 0.5 ? "medium" : "high";

  return {
    overallConfidence,
    riskLevel,
    needsAdminReview: true,
    autoApprovalEligible: false
  };
}
