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
      age: Number(body.age),
      monthlyIncome: Number(body.monthlyIncome),
      householdIncome: Number(body.householdIncome),
      numberOfDependents: Number(body.numberOfDependents),
      hasChildren: Boolean(body.hasChildren),
      disabilityStatus: Boolean(body.disabilityStatus),
      studentStatus: Boolean(body.studentStatus)
    }
  };
}
