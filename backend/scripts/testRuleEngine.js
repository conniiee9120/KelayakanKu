import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runEligibilityCheck } from "../src/services/ruleEngine.js";
import { formatEligibilityResponse } from "../src/utils/responseFormatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const policiesPath = join(__dirname, "../src/data/policies.json");
const policies = JSON.parse(await readFile(policiesPath, "utf8"));

const profiles = [
  {
    name: "B40 single adult",
    profile: {
      age: 35,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1500,
      householdIncome: 1500,
      employmentStatus: "employed",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "not-specified",
      studentStatus: false,
      supportNeeds: ["Cash aid"]
    }
  },
  {
    name: "B40 student",
    profile: {
      age: 22,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 900,
      householdIncome: 2800,
      employmentStatus: "student",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "not-specified",
      studentStatus: true,
      supportNeeds: ["Student or education support"]
    }
  },
  {
    name: "Single parent",
    profile: {
      age: 32,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1900,
      householdIncome: 3200,
      employmentStatus: "employed",
      maritalStatus: "single-parent",
      hasChildren: true,
      numberOfDependents: 2,
      disabilityStatus: false,
      housingStatus: "not-specified",
      studentStatus: false,
      supportNeeds: ["Child or family support", "Food or living cost support"]
    }
  },
  {
    name: "OKU user",
    profile: {
      age: 40,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1200,
      householdIncome: 2600,
      employmentStatus: "unable-to-work",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: true,
      housingStatus: "not-specified",
      studentStatus: false,
      supportNeeds: ["Medical or disability-related support"]
    }
  },
  {
    name: "Gig worker",
    profile: {
      age: 28,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 1800,
      householdIncome: 2800,
      employmentStatus: "gig-worker",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 1,
      disabilityStatus: false,
      housingStatus: "renting",
      studentStatus: false,
      supportNeeds: ["Gig worker / self-employed support", "Rental or housing support"]
    }
  },
  {
    name: "Higher-income user",
    profile: {
      age: 38,
      state: "Selangor",
      citizenship: "Malaysian",
      monthlyIncome: 9000,
      householdIncome: 12000,
      employmentStatus: "employed",
      maritalStatus: "single",
      hasChildren: false,
      numberOfDependents: 0,
      disabilityStatus: false,
      housingStatus: "not-specified",
      studentStatus: false,
      supportNeeds: ["Cash aid"]
    }
  }
];

for (const { name, profile } of profiles) {
  const response = formatEligibilityResponse(runEligibilityCheck(profile, policies));
  const totalPublicResults = response.recommended.length + response.needMoreInfo.length;

  if ("lessLikely" in response) {
    throw new Error(`${name}: response must not include lessLikely.`);
  }

  if (name === "Higher-income user" && totalPublicResults > 0) {
    throw new Error(`${name}: high-income user should not receive public recommendations.`);
  }

  if (name !== "Higher-income user" && totalPublicResults === 0) {
    throw new Error(`${name}: expected at least one Recommended or Need More Info result.`);
  }

  console.log(`\n${name}`);
  console.log(JSON.stringify(response, null, 2));
}

console.log("\nRule engine checks passed.");
