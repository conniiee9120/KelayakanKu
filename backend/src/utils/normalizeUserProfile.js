const incomeValueMap = {
  no_income: 0,
  below_1000: 999,
  "1000_1999": 1999,
  "2000_2999": 2999,
  "3000_4999": 4999,
  exactly_5000: 5000,
  "5001_7999": 7999,
  "8000_above": 8000,
  unstable_unknown: null,
  prefer_not_say: null
};

const legacyIncomeLabelMap = {
  "no income currently": "no_income",
  "tiada pendapatan buat masa ini": "no_income",
  "below rm1,000": "below_1000",
  "bawah rm1,000": "below_1000",
  "rm1,000 - rm1,999": "1000_1999",
  "rm2,000 - rm2,999": "2000_2999",
  "rm3,000 - rm4,999": "3000_4999",
  "rm5,000 exactly": "exactly_5000",
  "rm5,000 tepat": "exactly_5000",
  "rm5,001 - rm7,999": "5001_7999",
  "rm8,000 and above": "8000_above",
  "rm8,000 dan ke atas": "8000_above",
  "not sure / income changes every month": "unstable_unknown",
  "tidak pasti / pendapatan berubah setiap bulan": "unstable_unknown",
  "prefer not to say": "prefer_not_say",
  "tidak mahu nyatakan": "prefer_not_say",
  "rm5,000 and above": "8000_above"
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function toArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeIncomeValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value in incomeValueMap) return incomeValueMap[value];
  if (typeof value === "string") {
    const normalizedLabel = normalizeText(value);
    if (normalizedLabel in legacyIncomeLabelMap) return incomeValueMap[legacyIncomeLabelMap[normalizedLabel]];
  }
  return numberOrNull(value);
}

export function normalizeAgeGroup(value, estimatedAge) {
  const text = normalizeText(value);
  if (text.includes("below") || text.includes("bawah") || text === "under_18") return "under_18";
  if (text.includes("18") || text === "18_20") return "18_20";
  if (text.includes("21") || text === "21_29") return "21_29";
  if (text.includes("30") || text === "30_39") return "30_39";
  if (text.includes("40") || text === "40_59") return "40_59";
  if (text.includes("60") || text.includes("senior") || text.includes("warga emas") || text === "60_above") return "60_above";
  const age = numberOrNull(estimatedAge);
  if (age === null) return "unknown";
  if (age < 18) return "under_18";
  if (age <= 20) return "18_20";
  if (age <= 29) return "21_29";
  if (age <= 39) return "30_39";
  if (age <= 59) return "40_59";
  return "60_above";
}

export function estimateAge(value, ageGroup) {
  const age = numberOrNull(value);
  if (age !== null) return age;
  const group = normalizeAgeGroup(ageGroup, null);
  const estimates = {
    under_18: 17,
    "18_20": 19,
    "21_29": 25,
    "30_39": 35,
    "40_59": 45,
    "60_above": 60
  };
  return estimates[group] ?? null;
}

function normalizeCitizenship(value) {
  const text = normalizeText(value);
  if (text === "malaysian" || text === "yes" || text === "ya") return "Malaysian";
  if (text === "non-malaysian" || text === "no" || text === "tidak") return "Non-Malaysian";
  return "Unknown";
}

function normalizeHouseholdSituation(value) {
  const text = normalizeText(value);
  if (text.includes("single_parent") || text.includes("single parent") || text.includes("tunggal")) return "single_parent";
  if (text.includes("parent with children") || text.includes("anak")) return "family_with_children";
  if (text.includes("married") || text.includes("berkahwin")) return "married";
  if (text.includes("senior_led") || text.includes("elderly") || text.includes("senior") || text.includes("warga emas")) return "senior_led";
  if (text.includes("student_led") || text.includes("student") || text.includes("pelajar")) return "student_led";
  if (text.includes("supporting_family") || text.includes("supporting family") || text.includes("menyara")) return "supporting_family";
  if (text.includes("single") || text.includes("bujang")) return "single";
  if (text.includes("prefer") || text.includes("tidak mahu")) return "unknown";
  return text ? text.replaceAll(" ", "_") : null;
}

function normalizeDependents(value, fallback) {
  const direct = numberOrNull(value);
  if (direct !== null) return direct;
  const fallbackNumber = numberOrNull(fallback);
  if (fallbackNumber !== null) return fallbackNumber;
  const text = normalizeText(value ?? fallback);
  if (text.includes("only") || text.includes("saya seorang")) return 0;
  if (text.includes("1 - 2") || text.includes("1-2")) return 2;
  if (text.includes("3 - 4") || text.includes("3-4")) return 4;
  if (text.includes("5")) return 5;
  return null;
}

function normalizeWorkSituation(value) {
  const text = normalizeText(value);
  if (text.includes("gig") || text.includes("e-hailing") || text.includes("rider")) return "gig_worker";
  if (text.includes("self") || text.includes("sendiri")) return "self_employed";
  if (text.includes("small business") || text.includes("perniagaan")) return "small_business";
  if (text.includes("part")) return "part_time";
  if (text.includes("full") || text.includes("employed")) return "employed";
  if (text.includes("unemployed") || text.includes("tidak bekerja")) return "unemployed";
  if (text.includes("homemaker") || text.includes("suri rumah")) return "homemaker";
  if (text.includes("student") || text.includes("pelajar")) return "student";
  if (text.includes("retired") || text.includes("bersara")) return "retired";
  if (text.includes("unable")) return "unable_to_work";
  return text ? text.replaceAll("-", "_").replaceAll(" ", "_") : null;
}

function normalizeIncomeStability(value) {
  const text = normalizeText(value);
  if (text.includes("fixed") || text.includes("tetap")) return "stable";
  if (text.includes("changes") || text.includes("berubah")) return "unstable";
  if (text.includes("sometimes") || text.includes("sekali")) return "seasonal";
  if (text.includes("not sure") || text.includes("tidak pasti")) return "unknown";
  return text ? text.replaceAll(" ", "_") : null;
}

function normalizeContributionStatus(value) {
  const text = normalizeText(value);
  if (text.includes("both") || text.includes("kedua")) return "has_both";
  if (text.includes("epf") || text.includes("kwsp")) return "has_epf";
  if (text.includes("socso") || text.includes("perkeso")) return "has_socso";
  if (text === "no" || text === "tidak" || text.includes("neither")) return "neither";
  if (text.includes("not sure") || text.includes("tidak pasti")) return "unsure";
  return text ? text.replaceAll(" ", "_") : null;
}

export function normalizeSupportNeed(value) {
  const text = normalizeText(value);
  if (text.includes("cash") || text.includes("tunai")) return "cash_aid";
  if (text.includes("food") || text.includes("living cost") || text.includes("makanan") || text.includes("sara hidup")) return "food_aid";
  if (text.includes("rental") || text.includes("housing") || text.includes("sewa") || text.includes("perumahan")) return "housing_aid";
  if (text.includes("student") || text.includes("education") || text.includes("pelajar") || text.includes("pendidikan")) return "education_aid";
  if (text.includes("gig") || text.includes("self-employed") || text.includes("bekerja sendiri")) return "employment_support";
  if (text.includes("business") || text.includes("perniagaan")) return "employment_support";
  if (text.includes("epf") || text.includes("retirement") || text.includes("persaraan")) return "employment_support";
  if (text.includes("medical") || text.includes("disability") || text.includes("oku") || text.includes("perubatan")) return "disability_support";
  if (text.includes("child") || text.includes("family") || text.includes("anak") || text.includes("keluarga")) return "childcare_support";
  if (text.includes("not sure") || text.includes("tidak pasti")) return "unknown";
  return text ? text.replaceAll(" ", "_") : null;
}

export function normalizeSpecialSituation(value) {
  const text = normalizeText(value);
  if (text.includes("single parent") || text.includes("tunggal")) return "single_parent";
  if (text.includes("school") || text.includes("children") || text.includes("anak")) return "student";
  if (text.includes("elderly") || text.includes("warga emas")) return "senior_citizen";
  if (text.includes("disability") || text.includes("oku")) return "oku_or_disability";
  if (text.includes("medical") || text.includes("chronic") || text.includes("perubatan")) return "chronic_illness";
  if (text.includes("lost job") || text.includes("kehilangan kerja")) return "recently_lost_job";
  if (text.includes("income changes") || text.includes("pendapatan berubah")) return "no_fixed_income";
  if (text.includes("no bank") || text.includes("tiada akaun")) return "no_bank_account";
  if (text.includes("no payslip") || text.includes("tiada slip")) return "no_payslip";
  if (text.includes("none") || text.includes("tiada yang")) return null;
  if (text.includes("prefer") || text.includes("tidak mahu")) return null;
  return text ? text.replaceAll(" ", "_") : null;
}

function employmentAlias(workSituation) {
  const aliases = {
    gig_worker: "gig-worker",
    self_employed: "self-employed",
    small_business: "self-employed",
    part_time: "employed",
    unable_to_work: "unable-to-work"
  };
  return aliases[workSituation] || workSituation || null;
}

export function normalizeUserProfile(input = {}) {
  const rawAgeGroup = input.ageGroup ?? input.age_group;
  const estimatedAge = estimateAge(input.estimatedAge ?? input.age, rawAgeGroup);
  const ageGroup = normalizeAgeGroup(rawAgeGroup, estimatedAge);
  const householdIncomeRange = input.householdIncomeRange ?? input.incomeRange ?? input.estimatedMonthlyHouseholdIncomeRange ?? null;
  const householdIncome = normalizeIncomeValue(input.householdIncomeRange ?? input.incomeRange ?? input.estimatedMonthlyHouseholdIncomeRange ?? input.householdIncome ?? input.monthlyIncome);
  const monthlyIncome = normalizeIncomeValue(input.monthlyIncome ?? input.householdIncomeRange ?? input.incomeRange ?? input.householdIncome);
  const householdSituation = normalizeHouseholdSituation(input.householdSituation ?? input.maritalStatus);
  const workSituation = normalizeWorkSituation(input.workSituation ?? input.employmentStatus);
  const contributionStatus = normalizeContributionStatus(input.contributionStatus ?? input.epfSocsoStatus ?? input.contributesEpfSocso);
  const supportNeeds = toArray(input.supportNeeds ?? input.supportNeed).map(normalizeSupportNeed).filter(Boolean);
  const specialSituations = toArray(input.specialSituations ?? input.specialSituation).map(normalizeSpecialSituation).filter(Boolean);
  const dependents = normalizeDependents(input.dependents, input.numberOfDependents);

  return {
    ...input,
    citizenship: normalizeCitizenship(input.citizenship),
    ageGroup,
    estimatedAge,
    age: estimatedAge,
    state: input.state || null,
    householdSituation,
    maritalStatus: input.maritalStatus || householdSituation,
    dependents,
    numberOfDependents: dependents ?? 0,
    workSituation,
    employmentStatus: employmentAlias(workSituation),
    householdIncomeRange,
    householdIncome,
    monthlyIncome,
    incomeStability: normalizeIncomeStability(input.incomeStability),
    contributionStatus,
    hasEpf: contributionStatus === "has_epf" || contributionStatus === "has_both" ? true : contributionStatus === "unsure" || !contributionStatus ? null : false,
    hasSocso: contributionStatus === "has_socso" || contributionStatus === "has_both" ? true : contributionStatus === "unsure" || !contributionStatus ? null : false,
    supportNeeds,
    specialSituations,
    extraContext: input.extraContext ?? input.extraInfo ?? null,
    hasChildren: Boolean(input.hasChildren) || householdSituation === "family_with_children" || householdSituation === "single_parent" || specialSituations.includes("student"),
    disabilityStatus: Boolean(input.disabilityStatus) || specialSituations.includes("oku_or_disability"),
    studentStatus: Boolean(input.studentStatus) || workSituation === "student" || householdSituation === "student_led" || specialSituations.includes("student"),
    housingStatus: input.housingStatus || (supportNeeds.includes("housing_aid") ? "renting" : "not-specified")
  };
}
