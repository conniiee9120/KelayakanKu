// Gemini explanation service. The rule engine remains the source of truth.
import { DEFAULT_GEMINI_MODEL, generateGeminiText, getConfiguredGeminiModel, isMockGeminiEnabled } from "./geminiClient.js";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY) && !isMockGeminiEnabled();
}

const matchReasonBm = {
  "Citizenship matches this policy requirement.": "kewarganegaraan sepadan dengan syarat polisi ini.",
  "Household income appears within the policy limit.": "pendapatan isi rumah kelihatan berada dalam had polisi.",
  "Monthly income appears within the policy limit.": "pendapatan bulanan kelihatan berada dalam had polisi.",
  "State matches the policy coverage.": "negeri anda termasuk dalam liputan polisi.",
  "Age appears within the supported range.": "umur anda kelihatan berada dalam julat yang disokong.",
  "Work, student, or support need profile appears relevant.": "profil kerja, pelajar, atau keperluan sokongan kelihatan relevan.",
  "No special household condition is required.": "tiada syarat khas isi rumah diperlukan.",
  "Special household conditions appear to match.": "situasi khas isi rumah kelihatan sepadan."
};

function summarizeProfileContext(userProfile = {}, language = "en") {
  const parts = [];
  if (Array.isArray(userProfile.supportNeeds) && userProfile.supportNeeds.length > 0) {
    parts.push(language === "bm" ? `keperluan sokongan yang dipilih (${userProfile.supportNeeds.join(", ")})` : `selected support needs (${userProfile.supportNeeds.join(", ")})`);
  }
  if (Array.isArray(userProfile.specialSituations) && userProfile.specialSituations.length > 0) {
    parts.push(language === "bm" ? `situasi khas isi rumah (${userProfile.specialSituations.join(", ")})` : `special household situations (${userProfile.specialSituations.join(", ")})`);
  }
  if (userProfile.incomeStability) {
    parts.push(language === "bm" ? `kestabilan pendapatan (${userProfile.incomeStability})` : `income stability (${userProfile.incomeStability})`);
  }
  if (userProfile.contributionStatus) {
    parts.push(language === "bm" ? `status caruman (${userProfile.contributionStatus})` : `contribution status (${userProfile.contributionStatus})`);
  }
  return parts.slice(0, 3).join(language === "bm" ? ", " : ", ");
}

export function generateFallbackExplanation(userProfile = {}, recommendation = {}, language = "en") {
  const title = language === "bm" ? recommendation.titleBm || recommendation.title || "program sokongan ini" : recommendation.title || "this support program";
  const benefit = language === "bm"
    ? recommendation.benefitSummaryBm || recommendation.shortDescriptionBm || recommendation.benefitSummary || recommendation.shortDescription || ""
    : recommendation.benefitSummary || recommendation.shortDescription || "";
  const reasons =
    Array.isArray(recommendation.matchReasons) && recommendation.matchReasons.length > 0
      ? recommendation.matchReasons.slice(0, 2).join(" ")
      : "some parts of your profile appear to match the rule checks.";
  const needsMoreInfo =
    Array.isArray(recommendation.needsMoreInfoReasons) && recommendation.needsMoreInfoReasons.length > 0
      ? ` Some details may still need confirmation, such as ${recommendation.needsMoreInfoReasons.slice(0, 2).join(" ")}`
      : "";
  const profileContext = summarizeProfileContext(userProfile, language);
  const documents =
    Array.isArray(recommendation.requiredDocuments) && recommendation.requiredDocuments.length > 0
      ? ` You may need to prepare documents such as ${recommendation.requiredDocuments.slice(0, 3).join(", ")}.`
      : "";
  const nextStep =
    Array.isArray(recommendation.nextSteps) && recommendation.nextSteps.length > 0
      ? ` A good next step is to ${recommendation.nextSteps[0].charAt(0).toLowerCase()}${recommendation.nextSteps[0].slice(1)}.`
      : "";

  if (language === "bm") {
    const bmReasons =
      Array.isArray(recommendation.matchReasons) && recommendation.matchReasons.length > 0
        ? recommendation.matchReasons.slice(0, 2).map((reason) => matchReasonBm[reason] || reason).join(" ")
        : "beberapa maklumat profil anda sepadan dengan semakan peraturan.";
    const bmDocuments =
      Array.isArray(recommendation.requiredDocuments) && recommendation.requiredDocuments.length > 0
          ? ` Dokumen yang mungkin diperlukan termasuk ${(recommendation.requiredDocumentsBm || recommendation.requiredDocuments).slice(0, 3).join(", ")}.`
        : "";
    const bmNextStep =
      Array.isArray(recommendation.nextStepsBm || recommendation.nextSteps) && (recommendation.nextStepsBm || recommendation.nextSteps).length > 0
        ? ` Langkah seterusnya yang baik ialah: ${(recommendation.nextStepsBm || recommendation.nextSteps)[0]}.`
        : "";
    const bmContext = profileContext ? ` Faktor profil seperti ${profileContext} juga dipertimbangkan dalam semakan ini.` : "";
    return `${title} mungkin berkaitan dengan isi rumah anda. ${benefit ? `${benefit} ` : ""}Sokongan ini kelihatan sepadan dengan profil anda kerana ${bmReasons}${bmContext}${bmDocuments}${bmNextStep} Sila sahkan syarat akhir melalui portal rasmi atau agensi berkaitan sebelum memohon.`;
  }

  const context = profileContext ? ` Profile factors such as ${profileContext} were also considered in this rule check.` : "";
  return `${title} may be relevant to your household. ${benefit ? `${benefit} ` : ""}This support appears to match your profile because ${reasons}${context}${needsMoreInfo}${documents}${nextStep} Please verify the final criteria through the official portal or relevant agency before applying.`;
}

function buildExplanationPrompt(userProfile, recommendation, language = "en") {
  const outputLanguage = language === "bm" ? "Bahasa Melayu" : "English";
  return `
You are helping explain Malaysian financial aid eligibility to a B40 Malaysian household.
Write the final explanation in ${outputLanguage}.
The backend rule engine has already calculated the eligibility score.
You must not override the score.
You must not claim the user is definitely eligible.
Use simple, supportive language suitable for B40 users in Malaysia.
Use safer phrasing like "may be relevant" or "appears to match your profile".
Mention the most relevant user inputs that affected the match, such as support needs, special situations, income stability, contribution status, or extra notes when they matter.
Do not mention every field mechanically.
If income is missing, prefer not to say, or unstable/unknown, explain that income needs confirmation.
If contribution status is unsure and relevant, explain that it needs confirmation.
Write one short paragraph or two short paragraphs.
Do not use bullet points.
Do not use markdown.
Keep it concise and easy to read.
Mention that users should verify through the official portal or relevant agency.
Use only the data provided by the backend.
Do not invent new eligibility rules.
Do not invent official URLs.
Do not ask for sensitive personal data.

User profile:
${JSON.stringify(userProfile, null, 2)}

Recommendation:
${JSON.stringify({
    title: recommendation?.title,
    category: recommendation?.category,
    status: recommendation?.status,
    eligibilityScore: recommendation?.eligibilityScore,
    benefitSummary: recommendation?.benefitSummary,
    benefitSummaryBm: recommendation?.benefitSummaryBm,
    targetGroup: recommendation?.targetGroup,
    targetGroupBm: recommendation?.targetGroupBm,
    eligibilitySummary: recommendation?.eligibilitySummary,
    eligibilitySummaryBm: recommendation?.eligibilitySummaryBm,
    shortDescription: recommendation?.shortDescription,
    shortDescriptionBm: recommendation?.shortDescriptionBm,
    matchReasons: recommendation?.matchReasons,
    missingInfo: recommendation?.missingInfo,
    needsMoreInfoReasons: recommendation?.needsMoreInfoReasons,
    ruleBreakdown: recommendation?.ruleBreakdown,
    profileFactors: recommendation?.profileFactors,
    requiredDocuments: recommendation?.requiredDocuments,
    requiredDocumentsBm: recommendation?.requiredDocumentsBm,
    nextSteps: recommendation?.nextSteps,
    nextStepsBm: recommendation?.nextStepsBm,
    officialUrl: recommendation?.officialUrl
  }, null, 2)}

Return paragraph text only.
`.trim();
}

export async function generateRecommendationExplanation(userProfile, recommendation, language = "en") {
  const fallbackExplanation = generateFallbackExplanation(userProfile, recommendation, language);
  const model = getConfiguredGeminiModel("GEMINI_EXPLANATION_MODEL");

  const result = await generateGeminiText({
    task: "explanation",
    model,
    fallbackModel: DEFAULT_GEMINI_MODEL,
    contents: buildExplanationPrompt(userProfile, recommendation, language)
  });

  return {
    source: result.text ? "gemini" : "fallback",
    ...(result.reason ? { reason: result.reason } : {}),
    explanation: result.text || fallbackExplanation
  };
}
