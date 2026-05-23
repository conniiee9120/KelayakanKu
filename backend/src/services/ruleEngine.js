function stateMatches(profile, rules) {
  return Array.isArray(rules.states) && (rules.states.includes("All") || rules.states.includes(profile.state));
}

function hasSpecificStateRestriction(rules) {
  return Array.isArray(rules.states) && rules.states.length > 0 && !rules.states.includes("All");
}

function listMatches(value, list = []) {
  return Array.isArray(list) && list.includes(value);
}

function supportNeedMatches(profileNeeds = [], policyNeeds = []) {
  if (!Array.isArray(profileNeeds) || profileNeeds.length === 0) return false;
  return profileNeeds.some((need) => policyNeeds.includes(need));
}

function addRule(ruleBreakdown, rule, points, matched, reason) {
  ruleBreakdown.push({ rule, points, matched, reason });
}

function classify(score, hasNeedsMoreInfo) {
  if (hasNeedsMoreInfo) return "Need More Info";
  if (score >= 75) return "Recommended";
  if (score >= 45) return "Need More Info";
  return "Excluded";
}

export function scorePolicy(profile, policy) {
  const rules = policy.eligibilityRules || {};
  const matchReasons = [];
  const missingInfo = [];
  const needsMoreInfoReasons = [];
  const disqualificationReasons = [];
  const ruleBreakdown = [];
  let categoryMismatch = false;
  let score = 0;

  if (rules.citizenship) {
    if (profile.citizenship === rules.citizenship) {
      score += 15;
      matchReasons.push("Citizenship matches this policy requirement.");
      addRule(ruleBreakdown, "citizenship", 15, true, "Citizenship matches.");
    } else {
      disqualificationReasons.push("Citizenship does not match the policy requirement.");
      addRule(ruleBreakdown, "citizenship", 0, false, "Citizenship mismatch.");
    }
  } else {
    needsMoreInfoReasons.push("Policy citizenship requirement is not clearly available.");
    addRule(ruleBreakdown, "citizenship", 0, false, "Policy citizenship rule is missing.");
  }

  if (rules.maxHouseholdIncome === null || rules.maxHouseholdIncome === undefined) {
    needsMoreInfoReasons.push("Policy does not clearly state a household income cap.");
    addRule(ruleBreakdown, "householdIncome", 0, false, "Household income cap is missing.");
  } else if (profile.householdIncome <= rules.maxHouseholdIncome) {
    score += 30;
    matchReasons.push("Household income appears within the policy limit.");
    addRule(ruleBreakdown, "householdIncome", 30, true, "Household income is within the cap.");
  } else {
    disqualificationReasons.push("Household income is above the policy limit.");
    addRule(ruleBreakdown, "householdIncome", 0, false, "Household income exceeds the cap.");
  }

  if (rules.maxMonthlyIncome === null || rules.maxMonthlyIncome === undefined) {
    needsMoreInfoReasons.push("Policy does not clearly state a separate monthly income cap.");
    addRule(ruleBreakdown, "monthlyIncome", 0, false, "Monthly income cap is missing.");
  } else if (profile.monthlyIncome <= rules.maxMonthlyIncome) {
    score += 15;
    matchReasons.push("Monthly income appears within the policy limit.");
    addRule(ruleBreakdown, "monthlyIncome", 15, true, "Monthly income is within the cap.");
  } else {
    disqualificationReasons.push("Monthly income is above the policy limit.");
    addRule(ruleBreakdown, "monthlyIncome", 0, false, "Monthly income exceeds the cap.");
  }

  if (Array.isArray(rules.states) && stateMatches(profile, rules)) {
    score += 10;
    matchReasons.push("State matches the policy coverage.");
    addRule(ruleBreakdown, "state", 10, true, "State is covered.");
  } else if (hasSpecificStateRestriction(rules)) {
    disqualificationReasons.push("State is not covered by this policy.");
    addRule(ruleBreakdown, "state", 0, false, "State is outside policy coverage.");
  } else {
    needsMoreInfoReasons.push("Policy state coverage is not clearly available.");
    addRule(ruleBreakdown, "state", 0, false, "State coverage is missing.");
  }

  const hasMinAge = rules.minAge !== null && rules.minAge !== undefined;
  const hasMaxAge = rules.maxAge !== null && rules.maxAge !== undefined;
  const minAge = hasMinAge ? rules.minAge : 0;
  const maxAge = hasMaxAge ? rules.maxAge : 999;
  if (profile.age >= minAge && profile.age <= maxAge) {
    score += 10;
    matchReasons.push("Age appears within the supported range.");
    addRule(ruleBreakdown, "age", 10, true, "Age is within range.");
    if (!hasMinAge || !hasMaxAge) {
      needsMoreInfoReasons.push("Policy age range is only partially stated.");
    }
  } else {
    disqualificationReasons.push("Age is outside the policy range.");
    addRule(ruleBreakdown, "age", 0, false, "Age is outside range.");
  }

  const employmentMatch = listMatches(profile.employmentStatus, rules.employmentStatuses);
  const supportMatch = supportNeedMatches(profile.supportNeeds, rules.supportNeeds);
  const studentMatch = rules.requiresStudent ? profile.studentStatus === true : false;
  if (employmentMatch || studentMatch || supportMatch) {
    score += 10;
    matchReasons.push("Work, student, or support need profile appears relevant.");
    addRule(ruleBreakdown, "category", 10, true, "Work, student, or support need matches.");
  } else {
    categoryMismatch = true;
    needsMoreInfoReasons.push("Work or support category does not strongly match this policy.");
    addRule(ruleBreakdown, "category", 0, false, "Work/support category mismatch.");
  }

  const specialConditions = [];
  if (rules.requiresChildren) specialConditions.push({ matched: profile.hasChildren, label: "children in household" });
  if (rules.requiresDisability) specialConditions.push({ matched: profile.disabilityStatus, label: "official disability or medical status" });
  if (rules.requiresStudent) specialConditions.push({ matched: profile.studentStatus, label: "student status" });
  if (rules.minDependents && rules.minDependents > 0) specialConditions.push({ matched: profile.numberOfDependents >= rules.minDependents, label: "minimum dependent count" });
  if (rules.housingStatuses) specialConditions.push({ matched: listMatches(profile.housingStatus, rules.housingStatuses), label: "housing status" });

  if (specialConditions.length === 0) {
    score += 10;
    matchReasons.push("No special household condition is required.");
    addRule(ruleBreakdown, "specialConditions", 10, true, "No special condition required.");
  } else if (specialConditions.every((condition) => condition.matched)) {
    score += 10;
    matchReasons.push("Special household conditions appear to match.");
    addRule(ruleBreakdown, "specialConditions", 10, true, "Special conditions match.");
  } else {
    const failed = specialConditions.filter((condition) => !condition.matched).map((condition) => condition.label);
    disqualificationReasons.push(`Required special condition does not match: ${failed.join(", ")}.`);
    addRule(ruleBreakdown, "specialConditions", 0, false, "Required special condition mismatch.");
  }

  let eligibilityScore = Math.min(score, 100);
  const hasHardDisqualification = disqualificationReasons.length > 0;
  if (categoryMismatch) eligibilityScore = Math.min(eligibilityScore, 74);

  const status = hasHardDisqualification
    ? "Excluded"
    : classify(eligibilityScore, needsMoreInfoReasons.length > 0 && eligibilityScore < 75);

  return {
    id: policy.id,
    title: policy.title,
    titleBm: policy.titleBm || "",
    category: policy.category,
    eligibilityScore,
    status,
    shortDescription: policy.shortDescription,
    shortDescriptionBm: policy.shortDescriptionBm || "",
    matchReasons,
    missingInfo,
    needsMoreInfoReasons,
    disqualificationReasons,
    ruleBreakdown,
    targetGroup: Array.isArray(policy.targetGroup) ? policy.targetGroup : [],
    targetGroupBm: Array.isArray(policy.targetGroupBm) ? policy.targetGroupBm : [],
    benefitSummary: policy.benefitSummary || "",
    benefitSummaryBm: policy.benefitSummaryBm || "",
    eligibilitySummary: Array.isArray(policy.eligibilitySummary) ? policy.eligibilitySummary : [],
    eligibilitySummaryBm: Array.isArray(policy.eligibilitySummaryBm) ? policy.eligibilitySummaryBm : [],
    applicationMethod: policy.applicationMethod || "",
    applicationMethodBm: policy.applicationMethodBm || "",
    importantNotes: Array.isArray(policy.importantNotes) ? policy.importantNotes : [],
    importantNotesBm: Array.isArray(policy.importantNotesBm) ? policy.importantNotesBm : [],
    requiredDocuments: policy.requiredDocuments || [],
    requiredDocumentsBm: Array.isArray(policy.requiredDocumentsBm) ? policy.requiredDocumentsBm : [],
    nextSteps: policy.nextSteps || [],
    nextStepsBm: Array.isArray(policy.nextStepsBm) ? policy.nextStepsBm : [],
    officialUrl: policy.officialUrl || "",
    sourceUrl: policy.sourceUrl || ""
  };
}

export function runEligibilityCheck(profile, policies) {
  return policies
    .map((policy) => scorePolicy(profile, policy))
    .filter((policy) => policy.status !== "Excluded")
    .sort((a, b) => b.eligibilityScore - a.eligibilityScore);
}
