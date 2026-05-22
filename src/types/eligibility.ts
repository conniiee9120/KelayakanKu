// Shared TypeScript shape for the eligibility form answers.
export interface EligibilityFormData {
  citizenship: string;
  ageGroup: string;
  state: string;
  householdSituation: string;
  dependents: string;
  workSituation: string;
  householdIncomeRange: string;
  incomeStability: string;
  contributionStatus: string;
  supportNeeds: string;
  specialSituations: string;
  extraContext?: string;
}

export type EligibilityFormErrors = Partial<Record<keyof EligibilityFormData, string>>;
