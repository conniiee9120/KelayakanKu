// Safe localStorage helpers for form progress and language selection.
import type { Language } from "../data/translations";
import type { EligibilityFormData } from "../types/eligibility";
import type { EligibilityResult } from "../types/program";

const FORM_KEY = "kelayakankuEligibilityForm";
const LANGUAGE_KEY = "kelayakankuLanguage";
const RESULT_KEY = "kelayakankuEligibilityResult";
const RESULT_ERROR_KEY = "kelayakankuEligibilityError";

export function saveEligibilityForm(data: EligibilityFormData) {
  try {
    window.localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

export function getEligibilityForm(): EligibilityFormData | null {
  try {
    const raw = window.localStorage.getItem(FORM_KEY);
    return raw ? (JSON.parse(raw) as EligibilityFormData) : null;
  } catch {
    return null;
  }
}

export function saveLanguage(language: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    return;
  }
}

export function getLanguage(): Language {
  try {
    const language = window.localStorage.getItem(LANGUAGE_KEY);
    return language === "bm" || language === "en" ? language : "en";
  } catch {
    return "en";
  }
}

export function saveEligibilityResult(result: EligibilityResult) {
  try {
    window.localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    window.localStorage.removeItem(RESULT_ERROR_KEY);
  } catch {
    return;
  }
}

export function getEligibilityResult(): EligibilityResult | null {
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as EligibilityResult) : null;
  } catch {
    return null;
  }
}

export function saveEligibilityError(message: string) {
  try {
    window.localStorage.setItem(RESULT_ERROR_KEY, message);
  } catch {
    return;
  }
}

export function getEligibilityError() {
  try {
    return window.localStorage.getItem(RESULT_ERROR_KEY);
  } catch {
    return null;
  }
}
