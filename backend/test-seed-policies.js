import { getPublicPolicies } from "./src/services/policyDatabaseService.js";
import { runEligibilityCheck } from "./src/services/ruleEngine.js";
import { formatEligibilityResponse } from "./src/utils/responseFormatter.js";

const profiles = [
  {
    label: "B40 household with dependents",
    profile: {
      age: 35,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1800,
      householdIncome: 3500,
      employmentStatus: "employed",
      maritalStatus: "married",
      hasChildren: true,
      numberOfDependents: 3,
      disabilityStatus: false,
      housingStatus: "renting",
      studentStatus: false,
      supportNeeds: ["Cash aid", "Food or living cost support", "Child or family support"]
    }
  },
  {
    label: "B40 single adult",
    profile: {
      age: 28,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1800,
      householdIncome: 1800,
      employmentStatus: "gig-worker",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "renting",
      studentStatus: false,
      supportNeeds: ["Cash aid", "Food or living cost support"]
    }
  },
  {
    label: "Senior citizen aged 60+",
    profile: {
      age: 68,
      state: "Perak",
      citizenship: "Malaysian",
      monthlyIncome: 1200,
      householdIncome: 1200,
      employmentStatus: "retired",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "owned",
      studentStatus: false,
      supportNeeds: ["Cash aid", "Food or living cost support"]
    }
  },
  {
    label: "Household with children",
    profile: {
      age: 32,
      state: "Johor",
      citizenship: "Malaysian",
      monthlyIncome: 1600,
      householdIncome: 2800,
      employmentStatus: "self-employed",
      maritalStatus: "married",
      hasChildren: true,
      numberOfDependents: 2,
      disabilityStatus: false,
      housingStatus: "renting",
      studentStatus: false,
      supportNeeds: ["Child or family support", "Cash aid"]
    }
  },
  {
    label: "OKU student",
    profile: {
      age: 22,
      state: "Kuala Lumpur",
      citizenship: "Malaysian",
      monthlyIncome: 0,
      householdIncome: 2400,
      employmentStatus: "student",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: true,
      housingStatus: "family",
      studentStatus: true,
      supportNeeds: ["Student or education support", "Medical or disability-related support"]
    }
  },
  {
    label: "High-income user",
    profile: {
      age: 40,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 12000,
      householdIncome: 18000,
      employmentStatus: "employed",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "owned",
      studentStatus: false,
      supportNeeds: ["Cash aid", "Food or living cost support"]
    }
  }
];

const policies = await getPublicPolicies();
console.log(`Loaded approved policies: ${policies.length}`);

for (const { label, profile } of profiles) {
  const response = formatEligibilityResponse(runEligibilityCheck(profile, policies));
  console.log(`\n${label}`);
  console.log(`Recommended: ${response.recommended.map((item) => item.title).join(" | ") || "None"}`);
  console.log(`Need More Info: ${response.needMoreInfo.map((item) => item.title).join(" | ") || "None"}`);

  if ("lessLikely" in response) {
    throw new Error("Response should not include lessLikely.");
  }
}
