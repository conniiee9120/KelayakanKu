// Detailed checklist for one backend recommendation.
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ChecklistCard } from "../components/results/ChecklistCard";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";
import { useLanguage } from "../context/LanguageContext";
import { getExplanation, mapFormToBackendProfile } from "../services/api";
import type { ProgramRecommendation } from "../types/program";
import { navigate } from "../utils/navigation";
import { getLocalizedRecommendation } from "../utils/localizeRecommendation";
import { getEligibilityForm, getEligibilityResult } from "../utils/storage";

function getProgramId() {
  const parts = window.location.pathname.split("/");
  return parts[2];
}

function findRecommendation(id: string | undefined): ProgramRecommendation | null {
  const result = getEligibilityResult();
  if (!result) return null;
  return [...result.recommended, ...result.needMoreInfo].find((item) => item.id === id) ?? null;
}

function getSafeExternalUrl(url?: string) {
  if (!url) return "";
  const trimmedUrl = url.trim();
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : "";
}

type StructuredExplanationFallback = {
  whyItMayMatch?: string[];
  needsConfirmation?: string[];
  documents?: string[];
  nextSteps?: string[];
};

function structuredExplanationToParagraph(explanation: StructuredExplanationFallback, language: "bm" | "en") {
  const parts = [
    ...(explanation.whyItMayMatch || []),
    ...(explanation.needsConfirmation || []),
    ...(explanation.documents || []),
    ...(explanation.nextSteps || [])
  ].filter(Boolean);

  if (parts.length === 0) {
    return language === "bm"
      ? "Program ini mungkin berkaitan dengan profil anda. Sila semak dokumen yang diperlukan dan sahkan butiran terkini melalui sumber rasmi sebelum memohon."
      : "This programme may be relevant to your profile. Please review the required documents and verify the latest details through the official source before applying.";
  }

  return parts.join(" ");
}

function normalizeExplanationToParagraph(value: string | StructuredExplanationFallback, language: "bm" | "en") {
  return typeof value === "string" ? value : structuredExplanationToParagraph(value, language);
}

function buildLocalExplanationFallback(language: "bm" | "en", recommendation: ProgramRecommendation) {
  const localized = getLocalizedRecommendation(recommendation, language);
  const benefit = localized.benefitSummary || localized.shortDescription;
  const reasons = localized.matchReasons.length ? localized.matchReasons.slice(0, 2).join(" ") : "";
  const documents = localized.requiredDocuments.length ? localized.requiredDocuments.slice(0, 3).join(", ") : "";

  if (language === "bm") {
    return `${localized.title} mungkin berkaitan dengan isi rumah anda. ${benefit} ${reasons ? `Sebab padanan: ${reasons}` : "Beberapa maklumat profil anda sepadan dengan semakan peraturan."}${documents ? ` Dokumen yang mungkin diperlukan termasuk ${documents}.` : ""} Sila sahkan syarat akhir melalui portal rasmi atau agensi berkaitan sebelum memohon.`;
  }

  return `${localized.title} may be relevant to your household. ${benefit} ${reasons ? `Match reasons: ${reasons}` : "Some profile details match the rule checks."}${documents ? ` Documents you may need include ${documents}.` : ""} Please verify the final criteria through the official portal or relevant agency before applying.`;
}

export function ChecklistDetail() {
  const { language, text } = useLanguage();
  const programId = useMemo(() => getProgramId(), []);
  const recommendation = useMemo(() => findRecommendation(programId), [programId]);
  const [explanation, setExplanation] = useState("");
  const [explanationSource, setExplanationSource] = useState<"gemini" | "fallback" | "">("");
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");
  const localizedRecommendation = useMemo(() => recommendation ? getLocalizedRecommendation(recommendation, language) : null, [recommendation, language]);

  const userProfile = useMemo(() => {
    const form = getEligibilityForm();
    return form ? mapFormToBackendProfile(form) : null;
  }, []);

  useEffect(() => {
    if (!recommendation) return;
    if (!userProfile) {
      setExplanation(buildLocalExplanationFallback(language, recommendation));
      setExplanationSource("fallback");
      return;
    }

    let isActive = true;
    setIsExplanationLoading(true);
    setExplanationError("");

    getExplanation(userProfile, recommendation, language)
      .then((result) => {
        if (!isActive) return;
        setExplanation(normalizeExplanationToParagraph(result.explanation, language));
        setExplanationSource(result.source);
      })
      .catch(() => {
        if (!isActive) return;
        setExplanation(buildLocalExplanationFallback(language, recommendation));
        setExplanationSource("fallback");
        setExplanationError(text.checklist.explanationError);
      })
      .finally(() => {
        if (isActive) setIsExplanationLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [language, recommendation, userProfile]);

  if (!recommendation) {
    return (
      <main className="section-shell page-section">
        <Card className="empty-state">
          <h1>{text.checklist.notFoundTitle}</h1>
          <p>{text.checklist.notFoundDesc}</p>
          <Button onClick={() => navigate("/results")}>{text.buttons.backResults}</Button>
        </Card>
      </main>
    );
  }

  const sourceUrl = getSafeExternalUrl(recommendation.officialUrl || recommendation.sourceUrl);
  const sourceUnavailableMessage =
    language === "bm"
      ? text.checklist.sourceUnavailable
      : text.checklist.sourceUnavailable;
  const sourceAvailableMessage =
    text.checklist.sourceAvailable;

  return (
    <main className="section-shell page-section">
      <div className="page-title">
        <span>{text.checklist.eyebrow}</span>
        <h1>{text.checklist.title}</h1>
      </div>

      <div className="checklist-layout">
        <Card className="program-summary">
          <Badge tone={recommendation.status === "Recommended" ? "success" : recommendation.status === "Need More Info" ? "warning" : "neutral"}>{recommendation.status === "Recommended" ? text.common.recommended : text.common.needMoreInfo}</Badge>
          <h2>{localizedRecommendation?.title || recommendation.title}</h2>
          <div className="match-pill inline">
            <strong>{recommendation.eligibilityScore}%</strong>
            <span>{text.checklist.match}</span>
          </div>
          <p>{localizedRecommendation?.benefitSummary || localizedRecommendation?.shortDescription || recommendation.shortDescription}</p>
        </Card>

        <Card className="checklist-actions">
          <h2>{text.checklist.actions}</h2>
          {sourceUrl ? (
            <a className="btn btn-outline" href={sourceUrl} target="_blank" rel="noopener noreferrer">{text.buttons.official}</a>
          ) : (
            <button className="btn btn-outline" type="button" disabled>{text.buttons.official}</button>
          )}
          <Button variant="secondary" onClick={() => navigate("/results")}>{text.buttons.backResults}</Button>
        </Card>

        <div className="checklist-detail-grid">
          <Card className="checklist-card">
            <h2>{text.checklist.simpleExplanation}</h2>
            {isExplanationLoading ? (
              <p>{text.checklist.preparingExplanation}</p>
            ) : explanationError ? (
              <p>{explanationError}</p>
            ) : (
              <>
                <p>{explanation}</p>
                {explanationSource === "fallback" && (
                  <p className="helper-text">
                    {text.checklist.explanationFallbackNote}
                  </p>
                )}
              </>
            )}
          </Card>
          {localizedRecommendation && localizedRecommendation.eligibilitySummary.length > 0 && (
            <ChecklistCard title={text.checklist.eligibilitySummary} items={localizedRecommendation.eligibilitySummary} />
          )}
          <ChecklistCard title={text.checklist.why} items={localizedRecommendation?.matchReasons.length ? localizedRecommendation.matchReasons : [text.checklist.fallbackMatch]} />
          <ChecklistCard title={text.checklist.confirm} items={localizedRecommendation?.missingInfo.length ? localizedRecommendation.missingInfo : localizedRecommendation?.needsMoreInfoReasons.length ? localizedRecommendation.needsMoreInfoReasons : [text.checklist.fallbackConfirm]} />
          <Card className="checklist-card">
            <h2>{text.checklist.source}</h2>
            <p>
              <strong>{text.checklist.sourceLabel}</strong>{" "}
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceUrl}</a>
              ) : (
                text.checklist.portal
              )}
            </p>
            <p>{sourceUrl ? sourceAvailableMessage : sourceUnavailableMessage}</p>
            {sourceUrl && (
              <a className="btn btn-outline" href={sourceUrl} target="_blank" rel="noopener noreferrer">{text.buttons.official}</a>
            )}
          </Card>
          <ChecklistCard title={text.checklist.documents} items={localizedRecommendation?.requiredDocuments || recommendation.requiredDocuments} />
          <ChecklistCard title={text.checklist.next} items={localizedRecommendation?.nextSteps || recommendation.nextSteps} ordered />
          {localizedRecommendation && localizedRecommendation.importantNotes.length > 0 && (
            <ChecklistCard title={text.checklist.importantNotes} items={localizedRecommendation.importantNotes} />
          )}
        </div>
      </div>

      <DisclaimerBanner>{text.common.guidance}</DisclaimerBanner>
    </main>
  );
}
