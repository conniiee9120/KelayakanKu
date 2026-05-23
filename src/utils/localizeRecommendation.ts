// Presentation helpers for bilingual recommendation content returned by the backend.
import type { Language } from "../data/translations";
import type { ProgramRecommendation } from "../types/program";

const ruleReasonBm: Record<string, string> = {
  "Citizenship matches this policy requirement.": "Kewarganegaraan sepadan dengan syarat polisi ini.",
  "Household income appears within the policy limit.": "Pendapatan isi rumah kelihatan berada dalam had polisi.",
  "Monthly income appears within the policy limit.": "Pendapatan bulanan kelihatan berada dalam had polisi.",
  "State matches the policy coverage.": "Negeri anda termasuk dalam liputan polisi.",
  "Age appears within the supported range.": "Umur anda kelihatan berada dalam julat yang disokong.",
  "Work, student, or support need profile appears relevant.": "Profil kerja, pelajar, atau keperluan sokongan anda kelihatan relevan.",
  "No special household condition is required.": "Tiada syarat khas isi rumah diperlukan.",
  "Special household conditions appear to match.": "Situasi khas isi rumah kelihatan sepadan."
};

const needInfoBm: Record<string, string> = {
  "Policy does not clearly state a household income cap.": "Polisi tidak menyatakan had pendapatan isi rumah dengan jelas.",
  "Policy does not clearly state a separate monthly income cap.": "Polisi tidak menyatakan had pendapatan bulanan berasingan dengan jelas.",
  "Policy age range is only partially stated.": "Julat umur polisi hanya dinyatakan sebahagian.",
  "Work or support category does not strongly match this policy.": "Kategori kerja atau sokongan tidak begitu kuat sepadan dengan polisi ini."
};

function pick(language: Language, bmValue: string | undefined, enValue: string) {
  return language === "bm" && bmValue ? bmValue : enValue;
}

function pickList(language: Language, bmValue: string[] | undefined, enValue: string[]) {
  return language === "bm" && bmValue && bmValue.length > 0 ? bmValue : enValue;
}

function translateList(items: string[], language: Language, dictionary: Record<string, string>) {
  return language === "bm" ? items.map((item) => dictionary[item] || item) : items;
}

export function getLocalizedRecommendation(recommendation: ProgramRecommendation, language: Language) {
  return {
    title: pick(language, recommendation.titleBm, recommendation.title),
    shortDescription: pick(language, recommendation.shortDescriptionBm, recommendation.shortDescription),
    benefitSummary: pick(language, recommendation.benefitSummaryBm, recommendation.benefitSummary || recommendation.shortDescription),
    targetGroup: pickList(language, recommendation.targetGroupBm, recommendation.targetGroup || []),
    eligibilitySummary: pickList(language, recommendation.eligibilitySummaryBm, recommendation.eligibilitySummary || []),
    applicationMethod: pick(language, recommendation.applicationMethodBm, recommendation.applicationMethod || ""),
    importantNotes: pickList(language, recommendation.importantNotesBm, recommendation.importantNotes || []),
    requiredDocuments: pickList(language, recommendation.requiredDocumentsBm, recommendation.requiredDocuments),
    nextSteps: pickList(language, recommendation.nextStepsBm, recommendation.nextSteps),
    matchReasons: translateList(recommendation.matchReasons, language, ruleReasonBm),
    missingInfo: translateList(recommendation.missingInfo, language, needInfoBm),
    needsMoreInfoReasons: translateList(recommendation.needsMoreInfoReasons || [], language, needInfoBm)
  };
}
