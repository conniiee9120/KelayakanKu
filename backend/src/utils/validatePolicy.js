// Minimal schema validation for policy records managed by admins.
const STATUSES = new Set(["draft", "pending_review", "approved"]);

export function normalizePolicy(input = {}) {
  const rules = input.eligibilityRules || {};

  return {
    id: input.id || "",
    title: input.title || "",
    category: input.category || "Other",
    shortDescription: input.shortDescription || "",
    eligibilityRules: {
      citizenship: rules.citizenship || "Malaysian",
      maxHouseholdIncome: rules.maxHouseholdIncome === "" || rules.maxHouseholdIncome === undefined ? null : rules.maxHouseholdIncome,
      maxMonthlyIncome: rules.maxMonthlyIncome === "" || rules.maxMonthlyIncome === undefined ? null : rules.maxMonthlyIncome,
      states: Array.isArray(rules.states) && rules.states.length ? rules.states : ["All"],
      minAge: rules.minAge === "" || rules.minAge === undefined ? null : rules.minAge,
      maxAge: rules.maxAge === "" || rules.maxAge === undefined ? null : rules.maxAge,
      employmentStatuses: Array.isArray(rules.employmentStatuses) ? rules.employmentStatuses : [],
      requiresChildren: Boolean(rules.requiresChildren),
      requiresDisability: Boolean(rules.requiresDisability),
      requiresStudent: Boolean(rules.requiresStudent),
      minDependents: Number(rules.minDependents || 0),
      supportNeeds: Array.isArray(rules.supportNeeds) ? rules.supportNeeds : [],
      housingStatuses: Array.isArray(rules.housingStatuses) ? rules.housingStatuses : undefined
    },
    requiredDocuments: Array.isArray(input.requiredDocuments) ? input.requiredDocuments.filter(Boolean) : [],
    nextSteps: Array.isArray(input.nextSteps) ? input.nextSteps.filter(Boolean) : [],
    officialUrl: input.officialUrl || "",
    sourceUrl: input.sourceUrl || "",
    lastUpdated: input.lastUpdated || new Date().toISOString().slice(0, 10),
    verificationStatus: STATUSES.has(input.verificationStatus) ? input.verificationStatus : "draft",
    ...(input.applicationDeadline !== undefined ? { applicationDeadline: input.applicationDeadline } : {}),
    ...(input.extractionMeta ? { extractionMeta: input.extractionMeta } : {})
  };
}

export function validatePolicy(input) {
  const policy = normalizePolicy(input);
  const errors = [];

  if (!policy.title.trim()) errors.push("Policy title is required.");
  if (!policy.category.trim()) errors.push("Policy category is required.");
  if (!policy.shortDescription.trim()) errors.push("Short description is required.");
  if (!Array.isArray(policy.eligibilityRules.states)) errors.push("Eligibility states must be an array.");
  if (!Array.isArray(policy.eligibilityRules.employmentStatuses)) errors.push("Employment statuses must be an array.");
  if (!Array.isArray(policy.requiredDocuments)) errors.push("Required documents must be an array.");
  if (!Array.isArray(policy.nextSteps)) errors.push("Next steps must be an array.");

  return {
    valid: errors.length === 0,
    errors,
    policy
  };
}
