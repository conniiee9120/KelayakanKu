// Minimal schema validation for policy records managed by admins.
const STATUSES = new Set(["draft", "pending_review", "approved"]);

function nullableNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "no" || normalized === "") return false;
  }
  return Boolean(value);
}

function stringArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

export function normalizePolicy(input = {}) {
  const rules = input.eligibilityRules || {};

  return {
    id: input.id || "",
    title: input.title || "",
    category: input.category || "Other",
    shortDescription: input.shortDescription || "",
    eligibilityRules: {
      citizenship: rules.citizenship || "Malaysian",
      maxHouseholdIncome: nullableNumber(rules.maxHouseholdIncome),
      maxMonthlyIncome: nullableNumber(rules.maxMonthlyIncome),
      states: stringArray(rules.states, ["All"]).length ? stringArray(rules.states, ["All"]) : ["All"],
      minAge: nullableNumber(rules.minAge),
      maxAge: nullableNumber(rules.maxAge),
      employmentStatuses: stringArray(rules.employmentStatuses),
      requiresChildren: booleanValue(rules.requiresChildren),
      requiresDisability: booleanValue(rules.requiresDisability),
      requiresStudent: booleanValue(rules.requiresStudent),
      minDependents: Number.isFinite(Number(rules.minDependents)) ? Number(rules.minDependents) : 0,
      supportNeeds: stringArray(rules.supportNeeds),
      housingStatuses: rules.housingStatuses === undefined ? undefined : stringArray(rules.housingStatuses)
    },
    requiredDocuments: stringArray(input.requiredDocuments),
    nextSteps: stringArray(input.nextSteps),
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
