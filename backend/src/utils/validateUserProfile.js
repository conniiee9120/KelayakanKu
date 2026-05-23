import { normalizeIncomeValue, normalizeUserProfile } from "./normalizeUserProfile.js";

const requiredFieldGroups = [
  ["age", "ageGroup", "estimatedAge"],
  ["state"],
  ["citizenship"],
  ["householdIncome", "monthlyIncome", "householdIncomeRange", "incomeRange", "estimatedMonthlyHouseholdIncomeRange"],
  ["employmentStatus", "workSituation"],
  ["maritalStatus", "householdSituation"],
  ["numberOfDependents", "dependents"],
  ["supportNeeds", "supportNeed"]
];

function numberValue(value) {
  if (value === null) return null;
  return Number(value);
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

function stringArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function validateUserProfile(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  for (const group of requiredFieldGroups) {
    const hasAnyField = group.some((field) => body[field] !== undefined && body[field] !== "");
    if (!hasAnyField) {
      errors.push(`${group.join(" or ")} is required.`);
    }
  }

  const numberFields = ["age", "numberOfDependents"];
  for (const field of numberFields) {
    if (body[field] !== undefined && Number.isNaN(Number(body[field]))) {
      errors.push(`${field} must be a number.`);
    }
  }

  for (const field of ["monthlyIncome", "householdIncome"]) {
    const value = normalizeIncomeValue(body[field]);
    if (value !== null && Number.isNaN(value)) {
      errors.push(`${field} must be a number, null, or supported income range value.`);
    }
  }

  if (body.age !== undefined && body.age !== null && body.age !== "" && (Number(body.age) < 0 || Number(body.age) > 120)) {
    errors.push("age must be between 0 and 120.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const profile = normalizeUserProfile({
    ...body,
    age: numberValue(body.age),
    numberOfDependents: numberValue(body.numberOfDependents),
    hasChildren: booleanValue(body.hasChildren),
    disabilityStatus: booleanValue(body.disabilityStatus),
    studentStatus: booleanValue(body.studentStatus),
    supportNeeds: body.supportNeeds ?? stringArray(body.supportNeeds)
  });

  return {
    valid: true,
    errors: [],
    profile
  };
}
