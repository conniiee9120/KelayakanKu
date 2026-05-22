// Frontend API client for the KelayakanKu Express backend.
import type { EligibilityFormData } from "../types/eligibility";
import type { EligibilityResult, ProgramRecommendation } from "../types/program";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface BackendUserProfile {
  age: number;
  state: string;
  citizenship: string;
  monthlyIncome: number;
  householdIncome: number;
  employmentStatus: string;
  maritalStatus: string;
  hasChildren: boolean;
  numberOfDependents: number;
  disabilityStatus: boolean;
  housingStatus: string;
  studentStatus: boolean;
  supportNeeds: string[];
}

function parseAgeGroup(ageGroup: string) {
  if (ageGroup.includes("Below")) return 17;
  if (ageGroup.includes("18")) return 19;
  if (ageGroup.includes("21")) return 25;
  if (ageGroup.includes("30")) return 35;
  if (ageGroup.includes("40")) return 45;
  if (ageGroup.includes("60")) return 60;
  return 30;
}

function parseIncomeRange(incomeRange: string) {
  if (incomeRange.includes("No income")) return 0;
  if (incomeRange.includes("Below")) return 900;
  if (incomeRange.includes("1,000")) return 1500;
  if (incomeRange.includes("2,000")) return 2500;
  if (incomeRange.includes("3,000")) return 4000;
  if (incomeRange.includes("5,000")) return 5000;
  return 2500;
}

function parseDependents(dependents: string) {
  if (dependents.includes("Only")) return 0;
  if (dependents.includes("1 - 2")) return 2;
  if (dependents.includes("3 - 4")) return 4;
  if (dependents.includes("5")) return 5;
  return 0;
}

function mapEmploymentStatus(workSituation: string) {
  const lower = workSituation.toLowerCase();
  if (lower.includes("gig") || lower.includes("e-hailing")) return "gig-worker";
  if (lower.includes("self")) return "self-employed";
  if (lower.includes("student")) return "student";
  if (lower.includes("unemployed")) return "unemployed";
  if (lower.includes("homemaker")) return "homemaker";
  if (lower.includes("retired")) return "retired";
  if (lower.includes("unable")) return "unable-to-work";
  if (lower.includes("full") || lower.includes("part")) return "employed";
  return "self-employed";
}

function mapMaritalStatus(householdSituation: string) {
  const lower = householdSituation.toLowerCase();
  if (lower.includes("married")) return "married";
  if (lower.includes("single parent")) return "single-parent";
  return "single";
}

export function mapFormToBackendProfile(form: EligibilityFormData): BackendUserProfile {
  const supportNeeds = form.supportNeeds ? form.supportNeeds.split("|").filter(Boolean) : ["Not sure - show me what I may qualify for"];
  const specialSituations = form.specialSituations ? form.specialSituations.split("|").filter(Boolean) : [];
  const employmentStatus = mapEmploymentStatus(form.workSituation);
  const numberOfDependents = parseDependents(form.dependents);

  return {
    age: parseAgeGroup(form.ageGroup),
    state: form.state || "Selangor",
    citizenship: form.citizenship === "Yes" ? "Malaysian" : form.citizenship || "Prefer not to say",
    monthlyIncome: parseIncomeRange(form.householdIncomeRange),
    householdIncome: parseIncomeRange(form.householdIncomeRange),
    employmentStatus,
    maritalStatus: mapMaritalStatus(form.householdSituation),
    hasChildren: form.householdSituation.includes("children") || specialSituations.includes("Has children in school"),
    numberOfDependents,
    disabilityStatus: specialSituations.includes("Has a person with disability"),
    housingStatus: supportNeeds.includes("Rental or housing support") ? "renting" : "not-specified",
    studentStatus: employmentStatus === "student" || form.householdSituation === "Student",
    supportNeeds
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.errors?.join(" ") || errorBody?.error || "Backend request failed.";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function checkEligibility(userProfile: BackendUserProfile) {
  return request<EligibilityResult>("/api/eligibility/check", {
    method: "POST",
    body: JSON.stringify(userProfile)
  });
}

export function getPolicies() {
  return request<unknown[]>("/api/policies");
}

export function getExplanation(userProfile: BackendUserProfile, recommendation: ProgramRecommendation) {
  return request<{ source: "gemini" | "fallback"; explanation: string }>("/api/explanation", {
    method: "POST",
    body: JSON.stringify({ userProfile, recommendation })
  });
}
