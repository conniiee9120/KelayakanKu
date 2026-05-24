import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runEligibilityCheck, scorePolicy } from "../src/services/ruleEngine.js";
import { formatEligibilityResponse } from "../src/utils/responseFormatter.js";
import { validateUserProfile } from "../src/utils/validateUserProfile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const policiesPath = join(__dirname, "../src/data/policies.json");
const policies = JSON.parse(await readFile(policiesPath, "utf8")).filter((policy) => policy.verificationStatus === "approved");
const expectedRules = [
  "citizenship",
  "income",
  "ageGroup",
  "state",
  "householdSituation",
  "dependents",
  "workSituation",
  "incomeStability",
  "contributionStatus",
  "supportNeeds",
  "specialSituations",
  "extraContext"
];

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

const rm5000Policy = policies.find((policy) => policy.id === "str-2026-isi-rumah");
if (!rm5000Policy) {
  throw new Error("Boundary test requires str-2026-isi-rumah policy.");
}

const boundaryBaseProfile = {
  age: 35,
  state: "Selangor",
  citizenship: "Malaysian",
  employmentStatus: "employed",
  maritalStatus: "single-parent",
  hasChildren: true,
  numberOfDependents: 6,
  disabilityStatus: false,
  housingStatus: "not-specified",
  studentStatus: false,
  supportNeeds: ["Cash aid", "Child or family support"]
};

const normalized5000 = validateUserProfile({
  ...boundaryBaseProfile,
  monthlyIncome: "exactly_5000",
  householdIncome: "exactly_5000"
});
if (!normalized5000.valid || normalized5000.profile.householdIncome !== 5000) {
  throw new Error("exactly_5000 should normalize to 5000.");
}

const normalizedUnknown = validateUserProfile({
  ...boundaryBaseProfile,
  monthlyIncome: "unstable_unknown",
  householdIncome: "prefer_not_say"
});
if (!normalizedUnknown.valid || normalizedUnknown.profile.monthlyIncome !== null || normalizedUnknown.profile.householdIncome !== null) {
  throw new Error("unknown income values should normalize to null.");
}

const incomeBoundaryCases = [
  {
    selected: "prefer_not_say",
    monthlyIncome: "prefer_not_say",
    householdIncome: "prefer_not_say",
    expectedNormalized: null,
    expectedStatus: "Need More Info",
    maxScore: 74,
    expectedIncomeRule: "missing"
  },
  {
    selected: "unstable_unknown",
    monthlyIncome: "unstable_unknown",
    householdIncome: "unstable_unknown",
    expectedNormalized: null,
    expectedStatus: "Need More Info",
    maxScore: 74,
    expectedIncomeRule: "missing"
  },
  {
    selected: "no_income",
    monthlyIncome: "no_income",
    householdIncome: "no_income",
    expectedNormalized: 0,
    expectedStatus: "Recommended",
    expectedIncomeRule: "matched"
  },
  {
    selected: "exactly_5000",
    monthlyIncome: "exactly_5000",
    householdIncome: "exactly_5000",
    expectedNormalized: 5000,
    expectedStatus: "Recommended",
    expectedIncomeRule: "matched"
  },
  {
    selected: "5001_7999",
    monthlyIncome: "5001_7999",
    householdIncome: "5001_7999",
    expectedNormalized: 7999,
    expectedStatus: "Excluded",
    expectedIncomeRule: "failed"
  },
  {
    selected: "8000_above",
    monthlyIncome: "8000_above",
    householdIncome: "8000_above",
    expectedNormalized: 8000,
    expectedStatus: "Excluded",
    expectedIncomeRule: "failed"
  }
];

console.log("\nIncome boundary tests against STR household RM5,000 cap");
for (const testCase of incomeBoundaryCases) {
  const validation = validateUserProfile({
    ...boundaryBaseProfile,
    monthlyIncome: testCase.monthlyIncome,
    householdIncome: testCase.householdIncome
  });

  if (!validation.valid) {
    throw new Error(`${testCase.selected}: validation failed: ${validation.errors.join(" ")}`);
  }

  if (validation.profile.householdIncome !== testCase.expectedNormalized) {
    throw new Error(`${testCase.selected}: expected normalized householdIncome ${testCase.expectedNormalized}.`);
  }

  const result = scorePolicyLikePublic(validation.profile, rm5000Policy);
  const incomeRule = result.ruleBreakdown.find((rule) => rule.rule === "income");

  if (result.status !== testCase.expectedStatus) {
    throw new Error(`${testCase.selected}: expected status ${testCase.expectedStatus}, got ${result.status}.`);
  }

  if (testCase.maxScore !== undefined && result.eligibilityScore > testCase.maxScore) {
    throw new Error(`${testCase.selected}: expected score <= ${testCase.maxScore}, got ${result.eligibilityScore}.`);
  }

  if (incomeRule?.result !== testCase.expectedIncomeRule) {
    throw new Error(`${testCase.selected}: expected income rule ${testCase.expectedIncomeRule}.`);
  }

  if (testCase.expectedIncomeRule === "missing") {
    if (!result.missingInfo.includes("householdIncome")) {
      throw new Error(`${testCase.selected}: expected missingInfo to include householdIncome.`);
    }
    if (!result.needsMoreInfoReasons.some((reason) => reason.includes("Household income is needed"))) {
      throw new Error(`${testCase.selected}: expected income confirmation reason.`);
    }
    if (incomeRule.scoreAwarded !== 0) {
      throw new Error(`${testCase.selected}: missing income must not receive household income points.`);
    }
  }

  if (testCase.expectedStatus === "Excluded" && !result.disqualificationReasons.some((reason) => reason.includes("Household income"))) {
    throw new Error(`${testCase.selected}: above-cap household income should add a disqualification reason.`);
  }

  console.log(JSON.stringify({
    selectedHouseholdIncomeRange: testCase.selected,
    normalizedHouseholdIncome: validation.profile.householdIncome,
    status: result.status,
    eligibilityScore: result.eligibilityScore,
    matchReasons: result.matchReasons,
    missingInfo: result.missingInfo,
    needsMoreInfoReasons: result.needsMoreInfoReasons,
    disqualificationReasons: result.disqualificationReasons,
    incomeRuleBreakdown: incomeRule
  }, null, 2));
}

const enhancedProfiles = [
  {
    name: "Enhanced B40 household with children",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "family_with_children",
      dependents: 3,
      workSituation: "employed",
      householdIncomeRange: "3000_4999",
      incomeStability: "stable",
      contributionStatus: "has_epf",
      supportNeeds: ["cash_aid", "food_aid"],
      specialSituations: ["many_dependents"]
    },
    assert(response) {
      assertHasAnyResult(response, this.name);
      assertTopIncludes(response, ["str-2026-isi-rumah", "sara-2026"], this.name);
    }
  },
  {
    name: "Enhanced prefer-not-say income",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "family_with_children",
      dependents: 3,
      workSituation: "employed",
      householdIncomeRange: "prefer_not_say",
      incomeStability: "unknown",
      contributionStatus: "unsure",
      supportNeeds: ["cash_aid"],
      specialSituations: ["many_dependents"]
    },
    assert(response) {
      assertNoScore100(response, this.name);
      const publicResults = [...response.recommended, ...response.needMoreInfo];
      const cappedResults = publicResults.filter((item) => {
        const policy = policies.find((candidate) => candidate.id === item.id);
        return policy?.eligibilityRules?.maxHouseholdIncome != null || policy?.eligibilityRules?.maxMonthlyIncome != null;
      });
      if (
        cappedResults.some(
          (item) =>
            item.status === "Recommended" ||
            item.eligibilityScore > 74 ||
            (!item.missingInfo.includes("householdIncome") && !item.missingInfo.includes("monthlyIncome"))
        )
      ) {
        throw new Error(`${this.name}: income-capped policies with unknown income should be Need More Info under 75.`);
      }
    }
  },
  {
    name: "Enhanced unstable-income gig worker",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "21_29",
      state: "Selangor",
      householdSituation: "single",
      dependents: 0,
      workSituation: "gig_worker",
      householdIncomeRange: "2000_2999",
      incomeStability: "unstable",
      contributionStatus: "neither",
      supportNeeds: ["cash_aid", "food_aid"],
      specialSituations: ["no_payslip", "no_fixed_income"],
      extraContext: "I do gig work and have no payslip."
    },
    assert(response) {
      assertHasAnyResult(response, this.name);
      assertRulePresent(firstResult(response), "incomeStability", this.name);
      assertRulePresent(firstResult(response), "extraContext", this.name);
    }
  },
  {
    name: "Enhanced single parent",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "single_parent",
      dependents: 2,
      workSituation: "employed",
      householdIncomeRange: "2000_2999",
      incomeStability: "stable",
      contributionStatus: "has_epf",
      supportNeeds: ["cash_aid", "childcare_support"],
      specialSituations: ["single_parent"]
    },
    assert(response) {
      assertTopIncludes(response, ["str-2026-isi-rumah"], this.name);
    }
  },
  {
    name: "Enhanced OKU student",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "21_29",
      state: "Selangor",
      householdSituation: "student_led",
      dependents: 0,
      workSituation: "student",
      householdIncomeRange: "below_1000",
      incomeStability: "unstable",
      contributionStatus: "unsure",
      supportNeeds: ["education_aid", "disability_support"],
      specialSituations: ["student", "oku_or_disability"]
    },
    assert(response) {
      assertTopIncludes(response, ["jkm-btb", "jkm-epoku"], this.name);
    }
  },
  {
    name: "Enhanced senior citizen",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "60_above",
      state: "Selangor",
      householdSituation: "senior_led",
      dependents: 0,
      workSituation: "retired",
      householdIncomeRange: "below_1000",
      incomeStability: "stable",
      contributionStatus: "neither",
      supportNeeds: ["cash_aid", "senior_support"],
      specialSituations: ["senior_citizen"]
    },
    assert(response) {
      assertTopIncludes(response, ["str-2026-warga-emas-tiada-pasangan", "jkm-bwe"], this.name);
    }
  },
  {
    name: "Enhanced high income with many dependents",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "family_with_children",
      dependents: 5,
      workSituation: "employed",
      householdIncomeRange: "8000_above",
      incomeStability: "stable",
      contributionStatus: "has_both",
      supportNeeds: ["cash_aid", "childcare_support"],
      specialSituations: ["many_dependents"]
    },
    assert(response) {
      const publicIds = [...response.recommended, ...response.needMoreInfo].map((item) => item.id);
      if (publicIds.includes("str-2026-isi-rumah")) {
        throw new Error(`${this.name}: dependents must not override strict STR income cap.`);
      }
    }
  },
  {
    name: "Enhanced wrong state",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "single",
      dependents: 0,
      workSituation: "employed",
      householdIncomeRange: "below_1000",
      incomeStability: "stable",
      contributionStatus: "neither",
      supportNeeds: ["cash_aid"],
      specialSituations: []
    },
    assert() {
      const baPolicy = {
        id: "test-state-specific-policy",
        title: "Test State Specific Policy",
        category: "Cash Aid",
        shortDescription: "Synthetic state-specific rule-engine test policy.",
        eligibilityRules: {
          citizenship: "Malaysian",
          maxHouseholdIncome: 5000,
          states: ["Kuala Lumpur", "Putrajaya", "Labuan"],
          supportNeeds: ["Cash aid"]
        },
        requiredDocuments: [],
        nextSteps: []
      };
      const result = scorePolicyLikePublic(this.profile, baPolicy);
      if (result.status !== "Excluded" || !result.disqualificationReasons.some((reason) => reason.includes("State"))) {
        throw new Error(`${this.name}: state-specific policy should be excluded for wrong state.`);
      }
    }
  },
  {
    name: "Enhanced unsure contribution status",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "single",
      dependents: 0,
      workSituation: "gig_worker",
      householdIncomeRange: "below_1000",
      incomeStability: "unstable",
      contributionStatus: "unsure",
      supportNeeds: ["employment_support"],
      specialSituations: ["no_payslip"]
    },
    assert() {
      const socsoPolicy = {
        id: "test-socso",
        title: "Test SOCSO Support",
        category: "Employment Aid",
        shortDescription: "Synthetic rule-engine test policy.",
        eligibilityRules: {
          citizenship: "Malaysian",
          maxHouseholdIncome: 5000,
          states: ["All"],
          employmentStatuses: ["gig-worker", "self-employed"],
          contributionRequirements: { socso: "required" },
          supportNeeds: ["Gig worker / self-employed support"]
        },
        requiredDocuments: [],
        nextSteps: []
      };
      const result = scorePolicyLikePublic(this.profile, socsoPolicy);
      if (result.status !== "Need More Info" || !result.missingInfo.includes("contributionStatus")) {
        throw new Error(`${this.name}: unsure contribution status should become Need More Info for SOCSO-required policy.`);
      }
    }
  },
  {
    name: "Enhanced extra context only",
    profile: {
      citizenship: "Malaysian",
      ageGroup: "30_39",
      state: "Selangor",
      householdSituation: "single",
      dependents: 0,
      workSituation: "employed",
      householdIncomeRange: "2000_2999",
      incomeStability: "stable",
      contributionStatus: "neither",
      supportNeeds: ["unknown"],
      specialSituations: [],
      extraContext: "No payslip and recently lost job."
    },
    assert(response) {
      assertNoScore100(response, this.name);
      assertRulePresent(firstResult(response), "extraContext", this.name);
    }
  }
];

console.log("\nEnhanced full-form matching tests");
for (const testCase of enhancedProfiles) {
  const validation = validateUserProfile(testCase.profile);
  if (!validation.valid) {
    throw new Error(`${testCase.name}: validation failed: ${validation.errors.join(" ")}`);
  }
  const response = formatEligibilityResponse(runEligibilityCheck(validation.profile, policies));
  if ("lessLikely" in response) {
    throw new Error(`${testCase.name}: response must not include lessLikely.`);
  }
  assertCompleteExplainability(response, testCase.name);
  testCase.assert(response);
  const top = firstResult(response);
  console.log(JSON.stringify({
    profileName: testCase.name,
    normalizedProfile: validation.profile,
    recommended: response.recommended.map((item) => ({ id: item.id, score: item.eligibilityScore, status: item.status })),
    needMoreInfo: response.needMoreInfo.map((item) => ({ id: item.id, score: item.eligibilityScore, status: item.status })),
    topPolicyScore: top?.eligibilityScore ?? null,
    matchReasons: top?.matchReasons ?? [],
    missingInfo: top?.missingInfo ?? [],
    needsMoreInfoReasons: top?.needsMoreInfoReasons ?? [],
    ruleBreakdownSummary: (top?.ruleBreakdown || []).map((rule) => ({
      rule: rule.rule,
      result: rule.result,
      scoreAwarded: rule.scoreAwarded,
      maxScore: rule.maxScore
    })),
    anyResultReached100: [...response.recommended, ...response.needMoreInfo].some((item) => item.eligibilityScore === 100)
  }, null, 2));
}

console.log("\nSpecial situation and extra-context rule breakdown tests");
const syntheticBasePolicy = {
  id: "test-general-no-special-rule",
  title: "General Cash Aid Test",
  category: "Cash Aid",
  shortDescription: "Synthetic rule-engine test policy with no special situation requirement.",
  eligibilityRules: {
    citizenship: "Malaysian",
    maxHouseholdIncome: 5000,
    states: ["All"],
    supportNeeds: ["cash_aid"]
  },
  requiredDocuments: [],
  nextSteps: []
};

const syntheticManyDependentsPolicy = {
  ...syntheticBasePolicy,
  id: "test-many-dependents-rule",
  title: "Many Dependents Support Test",
  shortDescription: "Synthetic rule-engine test policy with a many-dependents requirement.",
  eligibilityRules: {
    ...syntheticBasePolicy.eligibilityRules,
    specialSituations: ["many_dependents"]
  }
};

const syntheticContextProfile = {
  citizenship: "Malaysian",
  ageGroup: "30_39",
  state: "Selangor",
  householdSituation: "family_with_children",
  dependents: 3,
  workSituation: "employed",
  householdIncomeRange: "3000_4999",
  incomeStability: "stable",
  contributionStatus: "has_epf",
  supportNeeds: ["cash_aid"],
  specialSituations: ["many_dependents"]
};

const ruleBreakdownTests = [
  {
    name: "No special situation policy rule should not match user special situations",
    profile: syntheticContextProfile,
    policy: syntheticBasePolicy,
    assert(result) {
      const specialRule = findRule(result, "specialSituations");
      if (!["not_applicable", "unknown"].includes(specialRule.result)) {
        throw new Error(`${this.name}: expected specialSituations not_applicable/unknown, got ${specialRule.result}.`);
      }
      if (specialRule.scoreAwarded !== 0 || specialRule.maxScore !== 0) {
        throw new Error(`${this.name}: unstated special situation rule must not award points.`);
      }
      if (result.matchReasons.some((reason) => reason.toLowerCase().includes("special household situation matches"))) {
        throw new Error(`${this.name}: must not add a false positive special-situation match reason.`);
      }
    }
  },
  {
    name: "Explicit many-dependents policy rule should match",
    profile: syntheticContextProfile,
    policy: syntheticManyDependentsPolicy,
    assert(result) {
      const specialRule = findRule(result, "specialSituations");
      if (specialRule.result !== "matched" || specialRule.scoreAwarded <= 0) {
        throw new Error(`${this.name}: expected specialSituations matched with points.`);
      }
      if (!result.matchReasons.some((reason) => reason.toLowerCase().includes("special household situation"))) {
        throw new Error(`${this.name}: expected special-situation match reason.`);
      }
    }
  },
  {
    name: "Extra context detects many dependents and household responsibility",
    profile: {
      ...syntheticContextProfile,
      specialSituations: [],
      extraContext: "The dependent is many and all depends on me"
    },
    policy: syntheticBasePolicy,
    assert(result) {
      const extraRule = findRule(result, "extraContext");
      if (!["partial", "contextual"].includes(extraRule.result)) {
        throw new Error(`${this.name}: expected extraContext partial/contextual, got ${extraRule.result}.`);
      }
      if (!extraRule.detectedTags?.includes("many_dependents")) {
        throw new Error(`${this.name}: expected many_dependents detected tag.`);
      }
      if (extraRule.scoreAwarded > 4) {
        throw new Error(`${this.name}: extraContext must remain a small signal.`);
      }
      if (!extraRule.message.includes("light contextual signal")) {
        throw new Error(`${this.name}: expected light contextual signal wording.`);
      }
    }
  },
  {
    name: "Extra context unknown phrase should not score",
    profile: {
      ...syntheticContextProfile,
      specialSituations: [],
      extraContext: "hello nothing special"
    },
    policy: syntheticBasePolicy,
    assert(result) {
      const extraRule = findRule(result, "extraContext");
      if (extraRule.result !== "unknown" || extraRule.scoreAwarded !== 0) {
        throw new Error(`${this.name}: unmatched extraContext should be unknown with zero points.`);
      }
      if (extraRule.detectedTags?.length) {
        throw new Error(`${this.name}: expected no detected tags.`);
      }
    }
  },
  {
    name: "High income is still excluded despite many-dependents extra context",
    profile: {
      ...syntheticContextProfile,
      householdIncomeRange: "8000_above",
      extraContext: "The dependent is many and all depends on me"
    },
    policy: syntheticBasePolicy,
    assert(result) {
      if (result.status !== "Excluded" || !result.disqualificationReasons.some((reason) => reason.includes("income"))) {
        throw new Error(`${this.name}: extraContext must not override strict income caps.`);
      }
    }
  },
  {
    name: "Non-Malaysian is still excluded despite many-dependents extra context",
    profile: {
      ...syntheticContextProfile,
      citizenship: "Non-Malaysian",
      extraContext: "The dependent is many and all depends on me"
    },
    policy: syntheticBasePolicy,
    assert(result) {
      if (result.status !== "Excluded" || !result.disqualificationReasons.some((reason) => reason.includes("Citizenship"))) {
        throw new Error(`${this.name}: extraContext must not override citizenship requirements.`);
      }
    }
  }
];

for (const testCase of ruleBreakdownTests) {
  const validation = validateUserProfile(testCase.profile);
  if (!validation.valid) {
    throw new Error(`${testCase.name}: validation failed: ${validation.errors.join(" ")}`);
  }
  const result = scorePolicyLikePublic(validation.profile, testCase.policy);
  testCase.assert(result);
  console.log(JSON.stringify({
    test: testCase.name,
    status: result.status,
    eligibilityScore: result.eligibilityScore,
    specialSituationsRule: findRule(result, "specialSituations"),
    extraContextRule: findRule(result, "extraContext"),
    disqualificationReasons: result.disqualificationReasons,
    matchReasons: result.matchReasons
  }, null, 2));
}

for (const { name, profile } of profiles) {
  const response = formatEligibilityResponse(runEligibilityCheck(profile, policies));
  const totalPublicResults = response.recommended.length + response.needMoreInfo.length;

  if ("lessLikely" in response) {
    throw new Error(`${name}: response must not include lessLikely.`);
  }

  if (name === "Higher-income user") {
    const strictCappedIds = new Set(
      policies
        .filter((policy) => policy.eligibilityRules?.strictIncomeCap)
        .map((policy) => policy.id)
    );
    const cappedResults = [...response.recommended, ...response.needMoreInfo].filter((item) => strictCappedIds.has(item.id));
    if (cappedResults.length > 0) {
      throw new Error(`${name}: high-income user should not receive strict income-capped aid.`);
    }
  }

  if (name !== "Higher-income user" && totalPublicResults === 0) {
    throw new Error(`${name}: expected at least one Recommended or Need More Info result.`);
  }

  console.log(`\n${name}`);
  console.log(JSON.stringify(response, null, 2));
}

console.log("\nRule engine checks passed.");

function scorePolicyLikePublic(profile, policy) {
  return scorePolicy(profile, policy);
}

function firstResult(response) {
  return response.recommended[0] || response.needMoreInfo[0] || null;
}

function assertHasAnyResult(response, name) {
  if (response.recommended.length + response.needMoreInfo.length === 0) {
    throw new Error(`${name}: expected at least one public result.`);
  }
}

function assertTopIncludes(response, ids, name) {
  const topIds = [...response.recommended, ...response.needMoreInfo].slice(0, 3).map((item) => item.id);
  if (!ids.some((id) => topIds.includes(id))) {
    throw new Error(`${name}: expected top results to include one of ${ids.join(", ")}. Got ${topIds.join(", ")}.`);
  }
}

function assertNoScore100(response, name) {
  const has100 = [...response.recommended, ...response.needMoreInfo].some((item) => item.eligibilityScore === 100);
  if (has100) {
    throw new Error(`${name}: no result should incorrectly reach 100.`);
  }
}

function assertRulePresent(result, rule, name) {
  if (!result?.ruleBreakdown?.some((item) => item.rule === rule)) {
    throw new Error(`${name}: expected ruleBreakdown to include ${rule}.`);
  }
}

function findRule(result, rule) {
  const item = result.ruleBreakdown?.find((candidate) => candidate.rule === rule);
  if (!item) throw new Error(`${result.id}: missing ruleBreakdown item ${rule}.`);
  return item;
}

function assertCompleteExplainability(response, name) {
  for (const result of [...response.recommended, ...response.needMoreInfo]) {
    const rules = result.ruleBreakdown || [];
    for (const rule of expectedRules) {
      const item = rules.find((candidate) => candidate.rule === rule);
      if (!item) throw new Error(`${name}: ${result.id} missing ruleBreakdown item ${rule}.`);
      if (!item.label || item.userValue === undefined || !item.policyRule || !item.impact) {
        throw new Error(`${name}: ${result.id} has incomplete ruleBreakdown metadata for ${rule}.`);
      }
      if (!result.profileFactors?.[rule]) {
        throw new Error(`${name}: ${result.id} missing profileFactors.${rule}.`);
      }
    }
    if (!result.matchReasons.length && !(result.needsMoreInfoReasons || []).length) {
      throw new Error(`${name}: ${result.id} should explain why it was returned.`);
    }
  }
}
