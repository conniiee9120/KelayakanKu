const requiredFields = [
  "age",
  "state",
  "citizenship",
  "monthlyIncome",
  "householdIncome",
  "employmentStatus",
  "maritalStatus",
  "hasChildren",
  "numberOfDependents",
  "disabilityStatus",
  "housingStatus",
  "studentStatus"
];

function numberValue(value) {
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

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      errors.push(`${field} is required.`);
    }
  }

  const numberFields = ["age", "monthlyIncome", "householdIncome", "numberOfDependents"];
  for (const field of numberFields) {
    if (body[field] !== undefined && Number.isNaN(Number(body[field]))) {
      errors.push(`${field} must be a number.`);
    }
  }

  if (body.age !== undefined && (Number(body.age) < 0 || Number(body.age) > 120)) {
    errors.push("age must be between 0 and 120.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    profile: {
      ...body,
      age: numberValue(body.age),
      monthlyIncome: numberValue(body.monthlyIncome),
      householdIncome: numberValue(body.householdIncome),
      numberOfDependents: numberValue(body.numberOfDependents),
      hasChildren: booleanValue(body.hasChildren),
      disabilityStatus: booleanValue(body.disabilityStatus),
      studentStatus: booleanValue(body.studentStatus),
      supportNeeds: stringArray(body.supportNeeds)
    }
  };
}
