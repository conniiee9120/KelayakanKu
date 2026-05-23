import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePolicy } from "../src/utils/validatePolicy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POLICIES_PATH = path.resolve(__dirname, "../src/data/policies.json");

const raw = await readFile(POLICIES_PATH, "utf8");
const policies = JSON.parse(raw);
const errors = [];
const ids = new Set();

if (!Array.isArray(policies)) {
  throw new Error("policies.json must contain an array.");
}

for (const [index, policy] of policies.entries()) {
  const label = policy?.id || `policy at index ${index}`;
  const validation = validatePolicy(policy);

  if (!validation.valid) {
    errors.push(`${label}: ${validation.errors.join(" ")}`);
  }

  if (!validation.policy.id) {
    errors.push(`${label}: id is required for stored policies.`);
  }

  if (ids.has(validation.policy.id)) {
    errors.push(`${label}: duplicate id "${validation.policy.id}".`);
  }
  ids.add(validation.policy.id);

  const rules = validation.policy.eligibilityRules;
  const arrayFields = [
    ["eligibilityRules.states", rules.states],
    ["eligibilityRules.employmentStatuses", rules.employmentStatuses],
    ["eligibilityRules.supportNeeds", rules.supportNeeds],
    ["requiredDocuments", validation.policy.requiredDocuments],
    ["nextSteps", validation.policy.nextSteps]
  ];

  for (const [field, value] of arrayFields) {
    if (!Array.isArray(value)) errors.push(`${label}: ${field} must be an array.`);
  }

  const booleanFields = [
    ["eligibilityRules.requiresChildren", rules.requiresChildren],
    ["eligibilityRules.requiresDisability", rules.requiresDisability],
    ["eligibilityRules.requiresStudent", rules.requiresStudent]
  ];

  for (const [field, value] of booleanFields) {
    if (typeof value !== "boolean") errors.push(`${label}: ${field} must be boolean.`);
  }

  const nullableNumberFields = [
    ["eligibilityRules.maxHouseholdIncome", rules.maxHouseholdIncome],
    ["eligibilityRules.maxMonthlyIncome", rules.maxMonthlyIncome],
    ["eligibilityRules.minAge", rules.minAge],
    ["eligibilityRules.maxAge", rules.maxAge]
  ];

  for (const [field, value] of nullableNumberFields) {
    if (value !== null && typeof value !== "number") errors.push(`${label}: ${field} must be number or null.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Policy schema validation passed for ${policies.length} policies.`);
