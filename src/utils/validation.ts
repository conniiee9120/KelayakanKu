// Step-based validation helpers for the guided eligibility form.
import type { Language } from "../data/translations";
import type { EligibilityFormData, EligibilityFormErrors } from "../types/eligibility";

const requiredMessage = {
  en: "This field is required.",
  bm: "Medan ini diperlukan."
};

function requireFields(data: EligibilityFormData, fields: Array<keyof EligibilityFormData>, language: Language) {
  const errors: EligibilityFormErrors = {};

  fields.forEach((field) => {
    if (!String(data[field] ?? "").trim()) {
      errors[field] = requiredMessage[language];
    }
  });

  return errors;
}

export function validateStep(step: number, data: EligibilityFormData, language: Language = "en"): EligibilityFormErrors {
  if (step === 1) {
    return requireFields(data, ["citizenship", "ageGroup", "state", "householdSituation", "dependents"], language);
  }

  if (step === 2) {
    return requireFields(data, ["workSituation", "householdIncomeRange", "incomeStability", "contributionStatus"], language);
  }

  return requireFields(data, ["supportNeeds"], language);
}
