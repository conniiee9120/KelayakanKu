import { normalizeSpecialSituation, normalizeSupportNeed, normalizeUserProfile } from "../utils/normalizeUserProfile.js";

const WEIGHTS = {
  citizenship: 10,
  income: 25,
  age: 10,
  state: 8,
  householdSituation: 8,
  dependents: 7,
  workSituation: 8,
  incomeStability: 6,
  contributionStatus: 6,
  supportNeeds: 8,
  specialSituations: 8,
  extraContext: 4
};

const RULE_KEYS = [
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

const RULE_LABELS = {
  citizenship: "Citizenship",
  income: "Estimated household income",
  ageGroup: "Age group",
  state: "State",
  householdSituation: "Household situation",
  dependents: "Dependents",
  workSituation: "Work situation",
  incomeStability: "Income stability",
  contributionStatus: "EPF/KWSP or SOCSO/PERKESO status",
  supportNeeds: "Support needs",
  specialSituations: "Special household situations",
  extraContext: "Optional extra context"
};

const SUPPORT_CATEGORY_MAP = {
  cash_aid: ["cash aid", "living cost aid", "welfare aid", "other"],
  food_aid: ["food aid", "essential goods", "sara", "mykasih"],
  education_aid: ["education aid", "student aid", "scholarship", "bkoku"],
  healthcare_aid: ["healthcare aid", "medical aid", "caregiver aid", "oku support"],
  housing_aid: ["housing aid", "rent aid", "home repair aid"],
  employment_support: ["employment aid", "perkeso", "upskilling", "jobseeker aid"],
  childcare_support: ["child aid", "family aid", "bantuan kanak-kanak", "other"],
  senior_support: ["senior aid", "warga emas", "other"],
  disability_support: ["oku aid", "disability aid", "bkoku", "healthcare aid", "education aid"]
};

const SPECIAL_CATEGORY_MAP = {
  oku_or_disability: ["disability", "oku", "bkoku", "healthcare aid", "education aid"],
  student: ["student", "education", "bkoku"],
  single_parent: ["family", "child", "cash aid", "other"],
  senior_citizen: ["senior", "warga emas", "cash aid", "other"],
  caregiver: ["caregiver", "healthcare aid"],
  chronic_illness: ["medical", "healthcare aid", "chronic"],
  no_fixed_income: ["cash aid", "food aid", "welfare"],
  recently_lost_job: ["employment", "cash aid", "welfare"],
  many_dependents: ["family", "child", "cash aid"],
  no_payslip: ["gig", "self-employed", "welfare"],
  no_bank_account: ["cash aid"]
};

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n|,|\|/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function lowerArray(value) {
  return asArray(value).map((item) => item.toLowerCase());
}

function hasKnownNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function uniquePush(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function addRule(ruleBreakdown, rule, result, scoreAwarded, maxScore, message, metadata = {}) {
  const canonicalRule = rule === "age" ? "ageGroup" : rule;
  ruleBreakdown.push({
    rule: canonicalRule,
    result,
    scoreAwarded,
    maxScore,
    message,
    points: scoreAwarded,
    matched: result === "matched" || result === "partial",
    reason: message,
    ...metadata
  });
}

function valueOrNotProvided(value) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Not provided";
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value);
}

function profileValueForRule(profile, rule) {
  const values = {
    citizenship: profile.citizenship,
    income: profile.householdIncome === null ? profile.householdIncomeRange || null : `RM${profile.householdIncome}`,
    ageGroup: profile.ageGroup,
    state: profile.state,
    householdSituation: profile.householdSituation,
    dependents: profile.dependents,
    workSituation: profile.workSituation,
    incomeStability: profile.incomeStability,
    contributionStatus: profile.contributionStatus,
    supportNeeds: profile.supportNeeds,
    specialSituations: profile.specialSituations,
    extraContext: profile.extraContext
  };
  return valueOrNotProvided(values[rule]);
}

function policyRuleForRule(rules, policy, rule) {
  switch (rule) {
    case "citizenship":
      return rules.citizenship && rules.citizenship !== "Any" ? rules.citizenship : "No restrictive citizenship rule stated";
    case "income": {
      const caps = [];
      if (hasKnownNumber(rules.maxHouseholdIncome)) caps.push(`Maximum household income RM${rules.maxHouseholdIncome}`);
      if (hasKnownNumber(rules.maxMonthlyIncome)) caps.push(`Maximum monthly income RM${rules.maxMonthlyIncome}`);
      return caps.length > 0 ? caps.join("; ") : "Income rule not clearly stated";
    }
    case "ageGroup": {
      const parts = [];
      if (rules.minAge !== null) parts.push(`Minimum age ${rules.minAge}`);
      if (rules.maxAge !== null) parts.push(`Maximum age ${rules.maxAge}`);
      if (rules.allowedAgeGroups.length > 0) parts.push(`Allowed groups: ${rules.allowedAgeGroups.join(", ")}`);
      if (rules.requiresSenior) parts.push("Senior status required");
      return parts.length > 0 ? parts.join("; ") : "No restrictive age rule stated";
    }
    case "state":
      return policyHasSpecificStates(rules.states) ? `Covered states: ${rules.states.join(", ")}` : "National/all-state or not state-specific";
    case "householdSituation":
      return rules.householdSituations.length > 0 || rules.requiresSingleParent
        ? [...rules.householdSituations, ...(rules.requiresSingleParent ? ["single_parent"] : [])].join(", ")
        : "No household situation rule stated";
    case "dependents": {
      const parts = [];
      if (rules.minDependents !== null) parts.push(`Minimum dependents ${rules.minDependents}`);
      if (rules.maxDependents !== null) parts.push(`Maximum dependents ${rules.maxDependents}`);
      if (rules.requiresChildren !== null) parts.push(rules.requiresChildren ? "Children required" : "Children not required");
      return parts.length > 0 ? parts.join("; ") : "No dependent rule stated";
    }
    case "workSituation": {
      const workRules = [...rules.workSituations, ...rules.employmentStatuses];
      return workRules.length > 0 ? workRules.join(", ") : "No work situation rule stated";
    }
    case "incomeStability":
      return rules.incomeStability.length > 0 || rules.acceptsUnstableIncome !== null
        ? [...rules.incomeStability, ...(rules.acceptsUnstableIncome ? ["accepts unstable income"] : [])].join(", ")
        : "No income stability rule stated";
    case "contributionStatus": {
      const req = rules.contributionRequirements || {};
      const parts = [];
      if (req.epf) parts.push(`EPF/KWSP: ${req.epf}`);
      if (req.socso) parts.push(`SOCSO/PERKESO: ${req.socso}`);
      return parts.length > 0 ? parts.join("; ") : "No contribution rule stated";
    }
    case "supportNeeds":
      return rules.supportNeeds.length > 0 ? rules.supportNeeds.join(", ") : `${policy.category || "Programme"} category and programme text`;
    case "specialSituations": {
      const explicit = [
        rules.requiresDisability ? "requires disability/OKU" : "",
        rules.requiresStudent ? "requires student status" : "",
        rules.requiresSenior ? "requires senior status" : "",
        rules.requiresSingleParent ? "requires single-parent status" : "",
        rules.requiresCaregiver ? "requires caregiver status" : ""
      ].filter(Boolean);
      return [...rules.specialSituations, ...explicit].length > 0 ? [...rules.specialSituations, ...explicit].join(", ") : "No special household situation requirement stated";
    }
    case "extraContext":
      return "Deterministic keyword scan only; cannot override explicit form answers";
    default:
      return "No rule summary available";
  }
}

function impactForRule(item) {
  if (item.result === "matched") return "Strengthened the match";
  if (item.result === "partial") return "Added limited context";
  if (item.result === "missing") return "Requires confirmation";
  if (item.result === "failed") return "Would exclude the programme";
  if (item.result === "unknown") return "Policy rule is unclear";
  return "Not used for this programme";
}

function enrichRuleBreakdown(ruleBreakdown, profile, rules, policy) {
  const byRule = new Map(ruleBreakdown.map((item) => [item.rule, item]));
  return RULE_KEYS.map((rule) => {
    const existing = byRule.get(rule) || {
      rule,
      result: "not_applicable",
      scoreAwarded: 0,
      maxScore: 0,
      message: "This field was not used for this programme.",
      points: 0,
      matched: false,
      reason: "This field was not used for this programme."
    };
    return {
      ...existing,
      label: RULE_LABELS[rule],
      userValue: profileValueForRule(profile, rule),
      policyRule: policyRuleForRule(rules, policy, rule),
      impact: impactForRule(existing)
    };
  });
}

function buildProfileFactors(ruleBreakdown) {
  return ruleBreakdown.reduce((factors, item) => {
    factors[item.rule] = {
      userValue: item.userValue,
      policyRule: item.policyRule,
      result: item.result,
      impact: item.impact
    };
    return factors;
  }, {});
}

function policyHasSpecificStates(states) {
  return Array.isArray(states) && states.length > 0 && !states.includes("All");
}

function stateMatches(profile, states) {
  return Array.isArray(states) && (states.includes("All") || states.includes(profile.state));
}

function employmentAliases(workSituation) {
  const aliases = new Set([workSituation]);
  if (workSituation === "gig_worker") aliases.add("gig-worker");
  if (workSituation === "self_employed") aliases.add("self-employed");
  if (workSituation === "small_business") aliases.add("self-employed");
  if (workSituation === "part_time") aliases.add("employed");
  if (workSituation === "unable_to_work") aliases.add("unable-to-work");
  return [...aliases].filter(Boolean);
}

function ruleListMatches(values, rules = []) {
  const normalizedRules = lowerArray(rules);
  return values.some((value) => normalizedRules.includes(String(value).toLowerCase()));
}

function normalizePolicyRules(policy) {
  const rules = policy.eligibilityRules || {};
  const hasIncomeCap = hasKnownNumber(rules.maxHouseholdIncome) || hasKnownNumber(rules.maxMonthlyIncome);
  return {
    citizenship: rules.citizenship || null,
    maxHouseholdIncome: hasKnownNumber(rules.maxHouseholdIncome) ? Number(rules.maxHouseholdIncome) : null,
    maxMonthlyIncome: hasKnownNumber(rules.maxMonthlyIncome) ? Number(rules.maxMonthlyIncome) : null,
    strictIncomeCap: rules.strictIncomeCap === undefined ? hasIncomeCap : Boolean(rules.strictIncomeCap),
    states: asArray(rules.states).length ? asArray(rules.states) : ["All"],
    minAge: hasKnownNumber(rules.minAge) ? Number(rules.minAge) : null,
    maxAge: hasKnownNumber(rules.maxAge) ? Number(rules.maxAge) : null,
    allowedAgeGroups: asArray(rules.allowedAgeGroups),
    householdSituations: asArray(rules.householdSituations),
    minDependents: hasKnownNumber(rules.minDependents) ? Number(rules.minDependents) : null,
    maxDependents: hasKnownNumber(rules.maxDependents) ? Number(rules.maxDependents) : null,
    requiresChildren: rules.requiresChildren === undefined ? null : Boolean(rules.requiresChildren),
    workSituations: asArray(rules.workSituations),
    employmentStatuses: asArray(rules.employmentStatuses),
    incomeStability: asArray(rules.incomeStability),
    acceptsUnstableIncome: rules.acceptsUnstableIncome === undefined ? null : Boolean(rules.acceptsUnstableIncome),
    contributionRequirements: rules.contributionRequirements || {},
    supportNeeds: asArray(rules.supportNeeds),
    specialSituations: asArray(rules.specialSituations),
    requiresDisability: rules.requiresDisability === undefined ? null : Boolean(rules.requiresDisability),
    requiresStudent: rules.requiresStudent === undefined ? null : Boolean(rules.requiresStudent),
    requiresSenior: rules.requiresSenior === undefined ? null : Boolean(rules.requiresSenior),
    requiresSingleParent: rules.requiresSingleParent === undefined ? null : Boolean(rules.requiresSingleParent),
    requiresCaregiver: rules.requiresCaregiver === undefined ? null : Boolean(rules.requiresCaregiver),
    requiresEkasih: rules.requiresEkasih === undefined ? null : Boolean(rules.requiresEkasih),
    requiresStrApproved: rules.requiresStrApproved === undefined ? null : Boolean(rules.requiresStrApproved),
    keywords: asArray(rules.keywords)
  };
}

function supportNeedMatches(profileNeeds, policy, rules) {
  if (!Array.isArray(profileNeeds) || profileNeeds.length === 0) return false;
  const policyNeeds = rules.supportNeeds.map(normalizeSupportNeed).filter(Boolean);
  const text = [
    policy.category,
    policy.title,
    policy.shortDescription,
    ...(policy.targetGroup || []),
    ...(policy.eligibilitySummary || []),
    ...rules.supportNeeds
  ].join(" ").toLowerCase();

  return profileNeeds.some((need) => {
    if (policyNeeds.includes(need)) return true;
    return (SUPPORT_CATEGORY_MAP[need] || []).some((keyword) => text.includes(keyword));
  });
}

function hasSpecialSituationRule(rules) {
  return (
    rules.specialSituations.length > 0 ||
    rules.requiresDisability === true ||
    rules.requiresStudent === true ||
    rules.requiresSenior === true ||
    rules.requiresSingleParent === true ||
    rules.requiresCaregiver === true ||
    rules.requiresChildren === true
  );
}

function specialSituationMatches(profileSituations, rules) {
  if (!Array.isArray(profileSituations) || profileSituations.length === 0) return false;
  const policySituations = rules.specialSituations.map(normalizeSpecialSituation).filter(Boolean);
  if (policySituations.length === 0) return false;

  return profileSituations.some((situation) => policySituations.includes(situation));
}

function explicitSpecialMatches(profile, rules) {
  const matches = [];
  if (rules.requiresDisability === true && profile.disabilityStatus) matches.push("oku_or_disability");
  if (rules.requiresStudent === true && profile.studentStatus) matches.push("student");
  if (rules.requiresSenior === true && profile.ageGroup === "60_above") matches.push("senior_citizen");
  if (rules.requiresSingleParent === true && profile.householdSituation === "single_parent") matches.push("single_parent");
  if (
    rules.requiresCaregiver === true &&
    (profile.specialSituations.includes("caregiver") || profile.specialSituations.includes("chronic_illness"))
  ) {
    matches.push("caregiver");
  }
  if (rules.requiresChildren === true && profile.hasChildren) matches.push("requires_children");
  return matches;
}

function normalizeContextText(extraContext) {
  return String(extraContext || "")
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}"'`~@#$%^&*_+=\\/<>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectExtraContextTags(extraContext) {
  const text = normalizeContextText(extraContext);
  const hits = [];
  const keywordMap = {
    many_dependents: [
      "many dependents",
      "dependents",
      "dependent",
      "all depends on me",
      "depend on me",
      "depends on me",
      "rely on me",
      "relies on me",
      "under my care",
      "tanggungan ramai",
      "ramai tanggungan",
      "semua bergantung pada saya",
      "bergantung kepada saya",
      "bawah jagaan saya",
      "saya tanggung",
      "tanggung keluarga",
      "sara keluarga"
    ],
    single_parent: ["single mother", "single father", "single parent", "ibu tunggal", "bapa tunggal"],
    no_payslip: ["no payslip", "no salary slip", "cash job", "informal work", "kerja cash", "tiada slip gaji", "kerja tidak formal"],
    recently_lost_job: ["lost job", "recently lost job", "unemployed", "jobless", "hilang kerja", "tidak bekerja"],
    oku_or_disability: ["oku", "disability", "disabled", "kurang upaya"],
    student: ["student", "university", "college", "ipt", "pelajar", "universiti", "kolej"],
    chronic_illness: [
      "chronic illness",
      "sick parent",
      "caregiver",
      "hospital",
      "pesakit kronik",
      "penjaga",
      "menjaga ibu",
      "menjaga ayah"
    ],
    no_bank_account: ["no bank account", "tiada akaun bank"]
  };
  for (const [label, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) hits.push(label);
  }
  return hits;
}

function finalizeScore(scoreAwarded, maxScore, criticalMissing) {
  const rawScore = maxScore > 0 ? Math.round((scoreAwarded / maxScore) * 100) : 0;
  return criticalMissing ? Math.min(rawScore, 74) : rawScore;
}

export function scorePolicy(inputProfile, policy) {
  const profile = normalizeUserProfile(inputProfile);
  const rules = normalizePolicyRules(policy);
  const matchReasons = [];
  const missingInfo = [];
  const needsMoreInfoReasons = [];
  const disqualificationReasons = [];
  const ruleBreakdown = [];
  let scoreAwarded = 0;
  let maxScore = 0;
  let criticalMissing = false;

  function award(rule, result, points, max, message, metadata = {}) {
    scoreAwarded += points;
    maxScore += max;
    addRule(ruleBreakdown, rule, result, points, max, message, metadata);
  }

  function markMissing(field, reason) {
    criticalMissing = true;
    uniquePush(missingInfo, field);
    uniquePush(needsMoreInfoReasons, reason);
  }

  if (rules.citizenship && rules.citizenship !== "Any") {
    if (profile.citizenship === "Unknown") {
      markMissing("citizenship", "Citizenship is needed to confirm this programme's requirement.");
      award("citizenship", "missing", 0, WEIGHTS.citizenship, "Citizenship was not confirmed.");
    } else if (profile.citizenship !== rules.citizenship) {
      disqualificationReasons.push("Citizenship does not match the policy requirement.");
      award("citizenship", "failed", 0, WEIGHTS.citizenship, "Citizenship mismatch.");
    } else {
      matchReasons.push("Citizenship matches this policy requirement.");
      award("citizenship", "matched", WEIGHTS.citizenship, WEIGHTS.citizenship, "Citizenship matches.");
    }
  } else {
    award("citizenship", "not_applicable", 0, 0, "Policy citizenship rule is not restrictive.");
  }

  const incomeMax = hasKnownNumber(rules.maxHouseholdIncome) || hasKnownNumber(rules.maxMonthlyIncome) ? WEIGHTS.income : 0;
  if (incomeMax === 0) {
    uniquePush(needsMoreInfoReasons, "Policy does not clearly state an income cap.");
    award("income", "unknown", 0, 0, "Policy income rule is not clearly stated.");
  } else {
    let incomeFailed = false;
    let incomeMissing = false;
    if (hasKnownNumber(rules.maxHouseholdIncome)) {
      if (!hasKnownNumber(profile.householdIncome)) {
        incomeMissing = true;
        uniquePush(missingInfo, "householdIncome");
        uniquePush(needsMoreInfoReasons, "Household income is needed to confirm this programme's income requirement.");
      } else if (rules.strictIncomeCap && Number(profile.householdIncome) > rules.maxHouseholdIncome) {
        incomeFailed = true;
        disqualificationReasons.push("Household income is above the policy limit.");
      }
    }
    if (hasKnownNumber(rules.maxMonthlyIncome)) {
      if (!hasKnownNumber(profile.monthlyIncome)) {
        incomeMissing = true;
        uniquePush(missingInfo, "monthlyIncome");
        uniquePush(needsMoreInfoReasons, "Monthly income is needed to confirm this programme's income requirement.");
      } else if (rules.strictIncomeCap && Number(profile.monthlyIncome) > rules.maxMonthlyIncome) {
        incomeFailed = true;
        disqualificationReasons.push("Monthly income is above the policy limit.");
      }
    }
    if (incomeFailed) {
      award("income", "failed", 0, incomeMax, "Income is above the strict policy cap.");
    } else if (incomeMissing) {
      criticalMissing = true;
      award("income", "missing", 0, incomeMax, "Income was not provided, so this income rule cannot be confirmed.");
    } else {
      matchReasons.push("Household income appears within the policy limit.");
      award("income", "matched", incomeMax, incomeMax, "Income is within the stated cap.");
    }
  }

  if (rules.minAge !== null || rules.maxAge !== null || rules.allowedAgeGroups.length > 0 || rules.requiresSenior) {
    if (!hasKnownNumber(profile.estimatedAge) && profile.ageGroup === "unknown") {
      markMissing("ageGroup", "Age group is needed to confirm this programme's age requirement.");
      award("age", "missing", 0, WEIGHTS.age, "Age group was not confirmed.");
    } else if (
      (rules.minAge !== null && Number(profile.estimatedAge) < rules.minAge) ||
      (rules.maxAge !== null && Number(profile.estimatedAge) > rules.maxAge) ||
      (rules.requiresSenior && profile.ageGroup !== "60_above") ||
      (rules.allowedAgeGroups.length > 0 && !rules.allowedAgeGroups.includes(profile.ageGroup))
    ) {
      disqualificationReasons.push("Age is outside the policy range.");
      award("age", "failed", 0, WEIGHTS.age, "Age is outside the allowed range.");
    } else {
      matchReasons.push("Age group appears within the supported range.");
      award("age", "matched", WEIGHTS.age, WEIGHTS.age, "Age group matches.");
      if (rules.minAge === null || rules.maxAge === null) {
        uniquePush(needsMoreInfoReasons, "Policy age range is only partially stated.");
      }
    }
  } else {
    award("age", "not_applicable", 0, 0, "Policy age rule is not restrictive.");
  }

  if (policyHasSpecificStates(rules.states)) {
    if (!profile.state) {
      markMissing("state", "State is needed to confirm this state-specific programme.");
      award("state", "missing", 0, WEIGHTS.state, "State was not provided.");
    } else if (!stateMatches(profile, rules.states)) {
      disqualificationReasons.push("State is not covered by this policy.");
      award("state", "failed", 0, WEIGHTS.state, "State is outside policy coverage.");
    } else {
      matchReasons.push("State matches the policy coverage.");
      award("state", "matched", WEIGHTS.state, WEIGHTS.state, "State is covered.");
    }
  } else {
    matchReasons.push("State matches the policy coverage.");
    award("state", "matched", WEIGHTS.state, WEIGHTS.state, "Policy is national or not state-specific.");
  }

  if (rules.householdSituations.length > 0 || rules.requiresSingleParent) {
    const requiredSituations = rules.requiresSingleParent ? [...rules.householdSituations, "single_parent"] : rules.householdSituations;
    if (!profile.householdSituation || profile.householdSituation === "unknown") {
      markMissing("householdSituation", "Household situation is needed to confirm this programme.");
      award("householdSituation", "missing", 0, WEIGHTS.householdSituation, "Household situation was not confirmed.");
    } else if (requiredSituations.includes(profile.householdSituation)) {
      matchReasons.push("Household situation appears relevant to this programme.");
      award("householdSituation", "matched", WEIGHTS.householdSituation, WEIGHTS.householdSituation, "Household situation matches.");
    } else {
      award("householdSituation", "partial", Math.round(WEIGHTS.householdSituation * 0.25), WEIGHTS.householdSituation, "Household situation is not a strong match.");
    }
  } else if (["family_with_children", "single_parent"].includes(profile.householdSituation) && (rules.requiresChildren || rules.minDependents > 0)) {
    matchReasons.push("Household situation supports a child or family-related programme.");
    award("householdSituation", "matched", WEIGHTS.householdSituation, WEIGHTS.householdSituation, "Household situation supports this policy.");
  } else {
    award("householdSituation", "not_applicable", 0, 0, "Policy does not define a household situation rule.");
  }

  if (rules.minDependents !== null || rules.maxDependents !== null || rules.requiresChildren !== null) {
    const hasDependents = hasKnownNumber(profile.dependents);
    if (!hasDependents) {
      markMissing("dependents", "Dependent count is needed to confirm this household requirement.");
      award("dependents", "missing", 0, WEIGHTS.dependents, "Dependent count was not confirmed.");
    } else if (
      (rules.minDependents !== null && profile.dependents < rules.minDependents) ||
      (rules.maxDependents !== null && profile.dependents > rules.maxDependents) ||
      (rules.requiresChildren === true && !profile.hasChildren)
    ) {
      disqualificationReasons.push("Required dependent or child condition does not match.");
      award("dependents", "failed", 0, WEIGHTS.dependents, "Dependent or child condition does not match.");
    } else {
      matchReasons.push("Dependents or household burden appear relevant.");
      award("dependents", "matched", WEIGHTS.dependents, WEIGHTS.dependents, "Dependent condition matches.");
    }
  } else {
    award("dependents", "not_applicable", 0, 0, "Policy does not define a dependent rule.");
  }

  const workRules = [...rules.workSituations, ...rules.employmentStatuses];
  if (workRules.length > 0) {
    const aliases = employmentAliases(profile.workSituation);
    if (!profile.workSituation) {
      markMissing("workSituation", "Work situation is needed to confirm this programme.");
      award("workSituation", "missing", 0, WEIGHTS.workSituation, "Work situation was not confirmed.");
    } else if (ruleListMatches(aliases, workRules)) {
      matchReasons.push("Work situation appears relevant.");
      award("workSituation", "matched", WEIGHTS.workSituation, WEIGHTS.workSituation, "Work situation matches.");
    } else {
      award("workSituation", "partial", Math.round(WEIGHTS.workSituation * 0.25), WEIGHTS.workSituation, "Work situation is not a strong match.");
    }
  } else {
    award("workSituation", "unknown", 0, 0, "Policy does not define a work situation rule.");
  }

  if (rules.incomeStability.length > 0 || rules.acceptsUnstableIncome !== null) {
    if (!profile.incomeStability || profile.incomeStability === "unknown") {
      uniquePush(missingInfo, "incomeStability");
      uniquePush(needsMoreInfoReasons, "Income stability may need confirmation for this programme.");
      award("incomeStability", "missing", 0, WEIGHTS.incomeStability, "Income stability was not confirmed.");
  } else if (
      rules.incomeStability.includes(profile.incomeStability) ||
      (rules.acceptsUnstableIncome === true && ["unstable", "seasonal"].includes(profile.incomeStability))
    ) {
      matchReasons.push("Your income stability appears compatible with this programme's checks.");
      award("incomeStability", "matched", WEIGHTS.incomeStability, WEIGHTS.incomeStability, "Income stability matches.");
    } else {
      uniquePush(needsMoreInfoReasons, "Income proof may need extra checking for this programme.");
      award("incomeStability", "partial", Math.round(WEIGHTS.incomeStability * 0.25), WEIGHTS.incomeStability, "Income stability needs extra checking.");
    }
  } else if (["unstable", "seasonal"].includes(profile.incomeStability)) {
    uniquePush(needsMoreInfoReasons, "You reported changing income, so income documents may need extra checking.");
    award("incomeStability", "partial", Math.round(WEIGHTS.incomeStability * 0.5), WEIGHTS.incomeStability, "Unstable income context is relevant for guidance.");
  } else {
    award("incomeStability", "not_applicable", 0, 0, "Policy does not define an income stability rule.");
  }

  const contributionRules = rules.contributionRequirements || {};
  const hasContributionRule = contributionRules.epf || contributionRules.socso;
  if (hasContributionRule) {
    const epfOk = contributionRules.epf !== "required" || profile.hasEpf === true;
    const socsoOk = contributionRules.socso !== "required" || profile.hasSocso === true;
    if (profile.hasEpf === null || profile.hasSocso === null || profile.contributionStatus === "unsure") {
      criticalMissing = true;
      uniquePush(missingInfo, "contributionStatus");
      uniquePush(needsMoreInfoReasons, "EPF/KWSP or SOCSO/PERKESO status is needed to confirm this programme.");
      award("contributionStatus", "missing", 0, WEIGHTS.contributionStatus, "Contribution status was not confirmed.");
    } else if (epfOk && socsoOk) {
      matchReasons.push("Your EPF/KWSP or SOCSO/PERKESO status appears compatible with this programme.");
      award("contributionStatus", "matched", WEIGHTS.contributionStatus, WEIGHTS.contributionStatus, "Contribution status matches.");
    } else {
      disqualificationReasons.push("Contribution status does not match the policy requirement.");
      award("contributionStatus", "failed", 0, WEIGHTS.contributionStatus, "Contribution requirement mismatch.");
    }
  } else if (profile.contributionStatus && profile.contributionStatus !== "unsure") {
    award("contributionStatus", "partial", Math.round(WEIGHTS.contributionStatus * 0.5), WEIGHTS.contributionStatus, "Contribution status provides useful context.");
  } else {
    award("contributionStatus", "unknown", 0, WEIGHTS.contributionStatus, "Contribution status is unknown or not required.");
  }

  const hasSupportMatch = supportNeedMatches(profile.supportNeeds, policy, rules);
  if (profile.supportNeeds.length === 0 || profile.supportNeeds.includes("unknown")) {
    uniquePush(missingInfo, "supportNeeds");
    uniquePush(needsMoreInfoReasons, "Support need may need confirmation to rank this programme better.");
    award("supportNeeds", "missing", 0, WEIGHTS.supportNeeds, "Support need was not confirmed.");
  } else if (hasSupportMatch) {
    matchReasons.push("Your selected support need matches this programme type.");
    award("supportNeeds", "matched", WEIGHTS.supportNeeds, WEIGHTS.supportNeeds, "Support need matches.");
  } else {
    award("supportNeeds", "partial", Math.round(WEIGHTS.supportNeeds * 0.25), WEIGHTS.supportNeeds, "Support need is not a strong category match.");
  }

  const explicitSpecialRequirements = [
    ["requiresDisability", rules.requiresDisability, profile.disabilityStatus, "disabilityStatus", "OKU or disability status is needed to confirm this programme."],
    ["requiresStudent", rules.requiresStudent, profile.studentStatus, "studentStatus", "Student status is needed to confirm this programme."],
    ["requiresSenior", rules.requiresSenior, profile.ageGroup === "60_above", "ageGroup", "Senior status is needed to confirm this programme."],
    ["requiresSingleParent", rules.requiresSingleParent, profile.householdSituation === "single_parent", "householdSituation", "Single-parent status is needed to confirm this programme."],
    ["requiresCaregiver", rules.requiresCaregiver, profile.specialSituations.includes("caregiver") || profile.specialSituations.includes("chronic_illness"), "specialSituations", "Caregiver status is needed to confirm this programme."]
  ];
  const failedSpecial = explicitSpecialRequirements.filter(([, required, matched]) => required === true && !matched);
  const hasExplicitSpecialRule = hasSpecialSituationRule(rules);
  const matchedExplicitSpecials = explicitSpecialMatches(profile, rules);
  if (!hasExplicitSpecialRule) {
    if (profile.specialSituations.length > 0) {
      uniquePush(needsMoreInfoReasons, "This policy does not clearly state whether your special household situation affects eligibility.");
      award(
        "specialSituations",
        "not_applicable",
        0,
        0,
        "You shared special household situations, but this policy does not state that those situations are part of its eligibility rules."
      );
    } else {
      award(
        "specialSituations",
        "not_applicable",
        0,
        0,
        "This policy does not state a special household situation requirement, so this field is not counted as a confirmed match."
      );
    }
  } else if (failedSpecial.length > 0) {
    failedSpecial.forEach(([, , , field]) => uniquePush(missingInfo, field));
    disqualificationReasons.push(`Required special condition does not match: ${failedSpecial.map(([name]) => name).join(", ")}.`);
    award("specialSituations", "failed", 0, WEIGHTS.specialSituations, "Required special situation does not match.");
  } else if (specialSituationMatches(profile.specialSituations, rules) || matchedExplicitSpecials.length > 0) {
    matchReasons.push("Your selected special household situation matches this programme's stated requirement.");
    award(
      "specialSituations",
      "matched",
      WEIGHTS.specialSituations,
      WEIGHTS.specialSituations,
      "Special household situation matches a stated policy requirement."
    );
  } else if (profile.specialSituations.length > 0) {
    award(
      "specialSituations",
      "partial",
      Math.round(WEIGHTS.specialSituations * 0.25),
      WEIGHTS.specialSituations,
      "You shared special household situations, but they do not clearly match this policy's stated special-condition rules."
    );
  } else {
    award("specialSituations", "missing", 0, WEIGHTS.specialSituations, "This policy has a special household situation rule, but no matching special situation was selected.");
  }

  const contextHits = detectExtraContextTags(profile.extraContext);
  if (contextHits.length > 0) {
    matchReasons.push("Your extra notes add a small relevant signal for this programme.");
    uniquePush(needsMoreInfoReasons, "Your extra notes may require manual checking against the official programme requirements.");
    const contextMessage = contextHits.includes("many_dependents")
      ? "Your extra note suggests many dependents or household responsibility. This is used only as a light contextual signal and does not override official eligibility rules."
      : `Your extra note matched deterministic context keywords (${contextHits.join(", ")}). This is used only as a light contextual signal and does not override official eligibility rules.`;
    const contextPoints = contextHits.includes("many_dependents") ? Math.max(2, contextHits.length) : Math.max(1, contextHits.length);
    award("extraContext", "partial", Math.min(WEIGHTS.extraContext, contextPoints), WEIGHTS.extraContext, contextMessage, {
      detectedTags: contextHits
    });
  } else if (profile.extraContext) {
    award("extraContext", "unknown", 0, WEIGHTS.extraContext, "Extra context was provided, but it did not match the system's deterministic context keywords.", {
      detectedTags: []
    });
  } else {
    award("extraContext", "not_applicable", 0, WEIGHTS.extraContext, "No optional extra context was provided.", {
      detectedTags: []
    });
  }

  const hasHardDisqualification = disqualificationReasons.length > 0;
  const eligibilityScore = finalizeScore(scoreAwarded, maxScore, criticalMissing);
  const enrichedRuleBreakdown = enrichRuleBreakdown(ruleBreakdown, profile, rules, policy);
  let status = "Excluded";
  if (!hasHardDisqualification) {
    if (criticalMissing) status = "Need More Info";
    else if (eligibilityScore >= 75) status = "Recommended";
    else if (eligibilityScore >= 45) status = "Need More Info";
  }

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
    ruleBreakdown: enrichedRuleBreakdown,
    profileFactors: buildProfileFactors(enrichedRuleBreakdown),
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

export const ruleEngineConfig = {
  weights: WEIGHTS,
  supportCategoryMap: SUPPORT_CATEGORY_MAP,
  specialCategoryMap: SPECIAL_CATEGORY_MAP
};
