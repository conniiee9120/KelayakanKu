// Confidence scoring for evidence-based policy extraction drafts.
const COMPLETENESS_FIELDS = [
  "title",
  "category",
  "shortDescription",
  "eligibilityRules",
  "requiredDocuments",
  "nextSteps",
  "officialOrSourceUrl"
];

const EVIDENCE_GROUPS = [
  ["title"],
  ["category"],
  ["eligibilityRules.citizenship", "eligibilityRules.states", "eligibilityRules.employmentStatuses"],
  ["eligibilityRules.maxHouseholdIncome", "eligibilityRules.maxMonthlyIncome"],
  ["eligibilityRules.minAge", "eligibilityRules.maxAge"],
  ["requiredDocuments"],
  ["nextSteps"]
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getPathValue(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulValue(item));
  }
  return value !== null && value !== undefined && value !== "";
}

function hasPolicyField(policy = {}, field) {
  if (field === "officialOrSourceUrl") {
    return hasMeaningfulValue(policy.officialUrl) || hasMeaningfulValue(policy.sourceUrl);
  }
  return hasMeaningfulValue(getPathValue(policy, field));
}

function hasFieldEvidence(evidenceByField = {}, path) {
  const evidence = evidenceByField[path];
  if (!evidence) return false;
  const status = evidence.status || "missing";
  return Boolean(
    evidence.evidence?.trim()
    && status !== "missing"
    && status !== "conflicting"
    && Number(evidence.confidence || 0) > 0
  );
}

function countIssues(audit = {}) {
  return (audit.fieldIssues || []).reduce((counts, issue) => {
    const severity = issue.severity || "medium";
    counts[severity] = (counts[severity] || 0) + 1;
    return counts;
  }, { low: 0, medium: 0, high: 0 });
}

function isAuditUnavailable(audit = {}, warnings = []) {
  if (audit.status === "unavailable") return true;
  const auditText = [
    ...(audit.fieldIssues || []).map((issue) => `${issue.field || ""} ${issue.issue || ""}`),
    ...(audit.correctedWarnings || []),
    ...warnings
  ].join(" ").toLowerCase();

  return auditText.includes("audit unavailable")
    || auditText.includes("audit was unavailable")
    || auditText.includes("audit quota")
    || auditText.includes("audit could not");
}

function calculateFieldCompleteness(policy = {}) {
  const present = COMPLETENESS_FIELDS.filter((field) => hasPolicyField(policy, field)).length;
  return (present / COMPLETENESS_FIELDS.length) * 35;
}

function calculateEvidenceCoverage(evidenceByField = {}) {
  const covered = EVIDENCE_GROUPS.filter((paths) => paths.some((path) => hasFieldEvidence(evidenceByField, path))).length;
  return (covered / EVIDENCE_GROUPS.length) * 25;
}

function calculateAuditScore(audit = {}, warnings = []) {
  if (isAuditUnavailable(audit, warnings)) return 0;

  const issues = countIssues(audit);
  if (audit.auditPassed && issues.high === 0 && issues.medium === 0) return 25;

  const issuePenalty = (issues.high * 9) + (issues.medium * 5) + (issues.low * 2);
  const failedAuditPenalty = audit.auditPassed ? 0 : 7;
  return clamp(25 - issuePenalty - failedAuditPenalty, 0, 25);
}

function calculateValidationScore(validation = {}) {
  const errors = validation.errors || [];
  if (validation.valid) return 15;
  if (errors.some((error) => /title|category|description/i.test(error))) return 0;
  return clamp(15 - (errors.length * 5), 0, 15);
}

function calculateWarningPenalty({ policy = {}, audit = {}, warnings = [] }) {
  const warningText = warnings.join(" ").toLowerCase();
  let penalty = 0;

  if (warningText.includes("low source text quality") || warningText.includes("not enough readable")) penalty += 8;
  if (warningText.includes("missing required") || warningText.includes("manual completion")) penalty += 8;
  if (warningText.includes("unsupported") || warningText.includes("conflicting")) penalty += 8;
  if (warningText.includes("fallback") || warningText.includes("mock gemini") || warningText.includes("extraction failed")) penalty += 12;
  if (isAuditUnavailable(audit, warnings)) penalty += 10;

  if (!hasPolicyField(policy, "title")) penalty += 8;
  if (!hasPolicyField(policy, "shortDescription")) penalty += 6;
  if (!hasPolicyField(policy, "requiredDocuments")) penalty += 4;
  if (!hasPolicyField(policy, "nextSteps")) penalty += 4;

  return clamp(penalty, 0, 35);
}

export function calculateExtractionConfidence({
  policy,
  evidenceByField = {},
  audit = {},
  validation = {},
  warnings = []
} = {}) {
  const fieldCompleteness = calculateFieldCompleteness(policy);
  const evidenceCoverage = calculateEvidenceCoverage(evidenceByField);
  const auditScore = calculateAuditScore(audit, warnings);
  const validationScore = calculateValidationScore(validation);
  const warningPenalty = calculateWarningPenalty({ policy, audit, warnings });
  const overallConfidence = Math.round(clamp(
    fieldCompleteness + evidenceCoverage + auditScore + validationScore - warningPenalty
  ));
  const riskLevel = overallConfidence >= 80 ? "low" : overallConfidence >= 50 ? "medium" : "high";

  return {
    overallConfidence,
    riskLevel,
    needsAdminReview: true,
    autoApprovalEligible: false,
    confidenceBreakdown: {
      fieldCompleteness: Math.round(fieldCompleteness),
      evidenceCoverage: Math.round(evidenceCoverage),
      auditScore: Math.round(auditScore),
      validationScore: Math.round(validationScore),
      warningPenalty: Math.round(warningPenalty)
    }
  };
}

export function calculateOverallConfidence(policyDraft, auditResult) {
  const evidenceByField = {};
  const policy = {};

  function visitDraft(node, prefix = "") {
    Object.entries(node || {}).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && "value" in value) {
        evidenceByField[path] = {
          evidence: value.evidence || "",
          confidence: Number(value.confidence || 0),
          status: value.status || "missing"
        };
        policy[path] = value.value;
      } else if (value && typeof value === "object") {
        visitDraft(value, path);
      }
    });
  }

  visitDraft(policyDraft);

  return calculateExtractionConfidence({
    policy: {
      title: policy.title,
      category: policy.category,
      shortDescription: policy.shortDescription,
      eligibilityRules: {
        citizenship: policy["eligibilityRules.citizenship"],
        maxHouseholdIncome: policy["eligibilityRules.maxHouseholdIncome"],
        maxMonthlyIncome: policy["eligibilityRules.maxMonthlyIncome"],
        states: policy["eligibilityRules.states"],
        minAge: policy["eligibilityRules.minAge"],
        maxAge: policy["eligibilityRules.maxAge"],
        employmentStatuses: policy["eligibilityRules.employmentStatuses"]
      },
      requiredDocuments: policy.requiredDocuments,
      nextSteps: policy.nextSteps,
      officialUrl: policy.officialUrl,
      sourceUrl: policy.sourceUrl
    },
    evidenceByField,
    audit: auditResult,
    validation: { valid: true, errors: [] },
    warnings: auditResult?.correctedWarnings || []
  });
}
