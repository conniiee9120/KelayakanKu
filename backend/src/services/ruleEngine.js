function stateMatches(profile, rules) {
  return Array.isArray(rules.states) && (rules.states.includes("All") || rules.states.includes(profile.state));
}

function listMatches(value, list = []) {
  return Array.isArray(list) && list.includes(value);
}

function supportNeedMatches(profileNeeds = [], policyNeeds = []) {
  if (!Array.isArray(profileNeeds) || profileNeeds.length === 0) return false;
  return profileNeeds.some((need) => policyNeeds.includes(need));
}

function classify(score) {
  if (score >= 75) return "Recommended";
  if (score >= 45) return "Need More Info";
  return "Less Likely";
}

export function scorePolicy(profile, policy) {
  const rules = policy.eligibilityRules || {};
  const matchReasons = [];
  const missingInfo = [];
  let hardRequirementMissing = false;
  let categoryMismatch = false;
  let score = 0;

  if (rules.citizenship && profile.citizenship === rules.citizenship) {
    score += 15;
    matchReasons.push("Citizenship matches this policy requirement.");
  } else {
    missingInfo.push("Citizenship may need confirmation with the official agency.");
  }

  if (rules.maxHouseholdIncome === null || profile.householdIncome <= rules.maxHouseholdIncome) {
    score += 30;
    matchReasons.push("Household income appears within the demo policy limit.");
  } else {
    missingInfo.push("Household income may be above the demo policy limit.");
  }

  if (rules.maxMonthlyIncome === null) {
    matchReasons.push("This policy does not specify a separate monthly income limit in the demo data.");
  } else if (profile.monthlyIncome <= rules.maxMonthlyIncome) {
    score += 15;
    matchReasons.push("Monthly income appears within the demo policy limit.");
  } else {
    missingInfo.push("Monthly income may be above the demo policy limit.");
  }

  if (stateMatches(profile, rules)) {
    score += 10;
    matchReasons.push("State matches the policy coverage.");
  } else {
    missingInfo.push("This policy may be state-specific.");
  }

  const minAge = rules.minAge ?? 0;
  const maxAge = rules.maxAge ?? 999;
  if (profile.age >= minAge && profile.age <= maxAge) {
    score += 10;
    matchReasons.push("Age appears within the supported range.");
  } else {
    missingInfo.push("Age range may need confirmation.");
  }

  const employmentMatch = listMatches(profile.employmentStatus, rules.employmentStatuses);
  const studentMatch = rules.requiresStudent ? profile.studentStatus === true : false;
  if (employmentMatch || studentMatch || supportNeedMatches(profile.supportNeeds, rules.supportNeeds)) {
    score += 10;
    matchReasons.push("Work, student, or support need profile appears relevant.");
  } else {
    categoryMismatch = true;
    missingInfo.push("Work or support category may not directly match this policy.");
  }

  const specialConditions = [];
  if (rules.requiresChildren) specialConditions.push({ matched: profile.hasChildren, label: "children in household" });
  if (rules.requiresDisability) specialConditions.push({ matched: profile.disabilityStatus, label: "official disability or medical status" });
  if (rules.requiresStudent) specialConditions.push({ matched: profile.studentStatus, label: "student status" });
  if (rules.minDependents && rules.minDependents > 0) specialConditions.push({ matched: profile.numberOfDependents >= rules.minDependents, label: "minimum dependent count" });
  if (rules.housingStatuses) specialConditions.push({ matched: listMatches(profile.housingStatus, rules.housingStatuses), label: "housing status" });

  if (specialConditions.length === 0 || specialConditions.some((condition) => condition.matched)) {
    score += 10;
    matchReasons.push("Special household conditions appear relevant or are not required.");
  } else {
    hardRequirementMissing = true;
    missingInfo.push("Special condition may need official verification.");
  }

  let eligibilityScore = Math.min(score, 100);
  if (hardRequirementMissing) eligibilityScore = Math.min(eligibilityScore, 44);
  if (categoryMismatch) eligibilityScore = Math.min(eligibilityScore, 74);

  return {
    id: policy.id,
    title: policy.title,
    category: policy.category,
    eligibilityScore,
    status: classify(eligibilityScore),
    shortDescription: policy.shortDescription,
    matchReasons,
    missingInfo,
    requiredDocuments: policy.requiredDocuments || [],
    nextSteps: policy.nextSteps || [],
    officialUrl: policy.officialUrl || ""
  };
}

export function runEligibilityCheck(profile, policies) {
  return policies
    .map((policy) => scorePolicy(profile, policy))
    .sort((a, b) => b.eligibilityScore - a.eligibilityScore);
}
