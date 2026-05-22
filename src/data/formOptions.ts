// Localized option lists for the household-focused eligibility form.
import type { Language } from "./translations";
import type { EligibilityFormData } from "../types/eligibility";

export interface FormOption {
  value: string;
  label: string;
}

interface LocalizedFormOption {
  value: string;
  en: string;
  bm: string;
}

type OptionField = Exclude<keyof EligibilityFormData, "extraContext">;

function option(value: string, bm: string, en = value): LocalizedFormOption {
  return { value, en, bm };
}

const optionSets: Record<OptionField, LocalizedFormOption[]> = {
  citizenship: [option("Yes", "Ya"), option("No", "Tidak"), option("Prefer not to say", "Tidak mahu nyatakan")],
  ageGroup: [
    option("Below 18", "Bawah 18"),
    option("18 - 20", "18 - 20"),
    option("21 - 29", "21 - 29"),
    option("30 - 39", "30 - 39"),
    option("40 - 59", "40 - 59"),
    option("60 and above", "60 dan ke atas"),
    option("Prefer not to say", "Tidak mahu nyatakan")
  ],
  state: [
    option("Johor", "Johor"),
    option("Kedah", "Kedah"),
    option("Kelantan", "Kelantan"),
    option("Melaka", "Melaka"),
    option("Negeri Sembilan", "Negeri Sembilan"),
    option("Pahang", "Pahang"),
    option("Penang", "Pulau Pinang"),
    option("Perak", "Perak"),
    option("Perlis", "Perlis"),
    option("Sabah", "Sabah"),
    option("Sarawak", "Sarawak"),
    option("Selangor", "Selangor"),
    option("Terengganu", "Terengganu"),
    option("Kuala Lumpur", "Kuala Lumpur"),
    option("Putrajaya", "Putrajaya"),
    option("Labuan", "Labuan")
  ],
  householdSituation: [
    option("Single", "Bujang"),
    option("Married", "Berkahwin"),
    option("Parent with children", "Ibu bapa dengan anak"),
    option("Single parent", "Ibu atau bapa tunggal"),
    option("Supporting elderly parents", "Menyara ibu bapa warga emas"),
    option("Supporting family members", "Menyara ahli keluarga"),
    option("Student", "Pelajar"),
    option("Senior citizen", "Warga emas"),
    option("Prefer not to say", "Tidak mahu nyatakan")
  ],
  dependents: [
    option("Only me", "Saya seorang sahaja"),
    option("1 - 2 people", "1 - 2 orang"),
    option("3 - 4 people", "3 - 4 orang"),
    option("5 or more people", "5 orang atau lebih"),
    option("Not sure", "Tidak pasti"),
    option("Prefer not to say", "Tidak mahu nyatakan")
  ],
  workSituation: [
    option("Gig worker / rider / e-hailing driver", "Pekerja gig / rider / pemandu e-hailing"),
    option("Self-employed", "Bekerja sendiri"),
    option("Small business owner", "Pemilik perniagaan kecil"),
    option("Part-time worker", "Pekerja sambilan"),
    option("Full-time employee", "Pekerja sepenuh masa"),
    option("Unemployed", "Tidak bekerja"),
    option("Homemaker", "Suri rumah / pengurus rumah tangga"),
    option("Student", "Pelajar"),
    option("Retired", "Bersara"),
    option("Unable to work", "Tidak mampu bekerja"),
    option("Other", "Lain-lain")
  ],
  householdIncomeRange: [
    option("No income currently", "Tiada pendapatan buat masa ini"),
    option("Below RM1,000", "Bawah RM1,000"),
    option("RM1,000 - RM1,999", "RM1,000 - RM1,999"),
    option("RM2,000 - RM2,999", "RM2,000 - RM2,999"),
    option("RM3,000 - RM4,999", "RM3,000 - RM4,999"),
    option("RM5,000 and above", "RM5,000 dan ke atas"),
    option("Not sure / income changes every month", "Tidak pasti / pendapatan berubah setiap bulan"),
    option("Prefer not to say", "Tidak mahu nyatakan")
  ],
  incomeStability: [
    option("Yes, fixed every month", "Ya, tetap setiap bulan"),
    option("No, it changes every month", "Tidak, berubah setiap bulan"),
    option("I only earn sometimes", "Saya hanya ada pendapatan sekali-sekala"),
    option("Not sure", "Tidak pasti")
  ],
  contributionStatus: [
    option("Yes, EPF/KWSP", "Ya, EPF/KWSP"),
    option("Yes, SOCSO/PERKESO", "Ya, SOCSO/PERKESO"),
    option("Yes, both", "Ya, kedua-duanya"),
    option("No", "Tidak"),
    option("Not sure", "Tidak pasti")
  ],
  supportNeeds: [
    option("Cash aid", "Bantuan tunai"),
    option("Food or living cost support", "Sokongan makanan atau kos sara hidup"),
    option("Rental or housing support", "Sokongan sewa atau perumahan"),
    option("Student or education support", "Sokongan pelajar atau pendidikan"),
    option("Gig worker / self-employed support", "Sokongan pekerja gig / bekerja sendiri"),
    option("Small business support", "Sokongan perniagaan kecil"),
    option("EPF / retirement contribution support", "Sokongan caruman EPF / persaraan"),
    option("Medical or disability-related support", "Sokongan perubatan atau berkaitan OKU"),
    option("Child or family support", "Sokongan anak atau keluarga"),
    option("Not sure - show me what I may qualify for", "Tidak pasti - tunjukkan sokongan yang mungkin layak")
  ],
  specialSituations: [
    option("Single parent household", "Isi rumah ibu atau bapa tunggal"),
    option("Has children in school", "Ada anak yang masih bersekolah"),
    option("Has elderly family members", "Ada ahli keluarga warga emas"),
    option("Has a person with disability", "Ada ahli isi rumah OKU"),
    option("Has serious medical needs", "Ada keperluan perubatan serius"),
    option("Recently lost job or income", "Baru kehilangan kerja atau pendapatan"),
    option("Income changes every month", "Pendapatan berubah setiap bulan"),
    option("No bank account", "Tiada akaun bank"),
    option("No payslip", "Tiada slip gaji"),
    option("None of these", "Tiada yang berkaitan"),
    option("Prefer not to say", "Tidak mahu nyatakan")
  ]
};

function localize(options: LocalizedFormOption[], language: Language): FormOption[] {
  return options.map((item) => ({ value: item.value, label: item[language] }));
}

export function getFormOptions(language: Language) {
  return {
    citizenshipOptions: localize(optionSets.citizenship, language),
    ageGroupOptions: localize(optionSets.ageGroup, language),
    malaysianStates: localize(optionSets.state, language),
    householdSituationOptions: localize(optionSets.householdSituation, language),
    dependentOptions: localize(optionSets.dependents, language),
    workSituations: localize(optionSets.workSituation, language),
    householdIncomeRanges: localize(optionSets.householdIncomeRange, language),
    incomeStabilityOptions: localize(optionSets.incomeStability, language),
    contributionStatusOptions: localize(optionSets.contributionStatus, language),
    supportNeedsOptions: localize(optionSets.supportNeeds, language),
    specialSituationOptions: localize(optionSets.specialSituations, language)
  };
}

export function formatEligibilityValue(field: keyof EligibilityFormData, value: string | undefined, language: Language) {
  if (!value) return "";
  if (field === "extraContext") return value;

  const labels = value.split("|").map((part) => {
    const match = optionSets[field].find((item) => item.value === part);
    return match ? match[language] : part;
  });

  return labels.join(", ");
}
