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
import { getEligibilityForm, getEligibilityResult } from "../utils/storage";

function getProgramId() {
  const parts = window.location.pathname.split("/");
  return parts[2];
}

function findRecommendation(id: string | undefined): ProgramRecommendation | null {
  const result = getEligibilityResult();
  if (!result) return null;
  return [...result.recommended, ...result.needMoreInfo, ...result.lessLikely].find((item) => item.id === id) ?? null;
}

function buildLocalExplanationFallback(language: "bm" | "en", recommendation: ProgramRecommendation) {
  if (language === "bm") {
    return `Sokongan ini mungkin sepadan dengan profil anda berdasarkan skor dan sebab padanan yang telah dikira oleh sistem. Sila semak syarat akhir melalui portal rasmi atau agensi berkaitan sebelum memohon.`;
  }

  return `This support may match your profile based on the score and match reasons calculated by the system. Please verify the final criteria through the official portal or relevant agency before applying.`;
}

export function ChecklistDetail() {
  const { language, text } = useLanguage();
  const programId = useMemo(() => getProgramId(), []);
  const recommendation = useMemo(() => findRecommendation(programId), [programId]);
  const [explanation, setExplanation] = useState("");
  const [explanationSource, setExplanationSource] = useState<"gemini" | "fallback" | "">("");
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");

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

    getExplanation(userProfile, recommendation)
      .then((result) => {
        if (!isActive) return;
        setExplanation(result.explanation);
        setExplanationSource(result.source);
      })
      .catch(() => {
        if (!isActive) return;
        setExplanation(buildLocalExplanationFallback(language, recommendation));
        setExplanationSource("fallback");
        setExplanationError(language === "bm" ? "Penjelasan AI tidak dapat dimuat sekarang, jadi penjelasan asas dipaparkan." : "The AI explanation could not be loaded right now, so a basic explanation is shown.");
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
          <h1>{language === "bm" ? "Butiran program tidak dijumpai" : "Program details not found"}</h1>
          <p>{language === "bm" ? "Sila kembali ke keputusan dan pilih program yang tersedia." : "Please return to results and choose an available program."}</p>
          <Button onClick={() => navigate("/results")}>{text.buttons.backResults}</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="section-shell page-section">
      <div className="page-title">
        <span>{text.checklist.eyebrow}</span>
        <h1>{text.checklist.title}</h1>
      </div>

      <div className="checklist-layout">
        <Card className="program-summary">
          <Badge tone={recommendation.status === "Recommended" ? "success" : recommendation.status === "Need More Info" ? "warning" : "neutral"}>{recommendation.status}</Badge>
          <h2>{recommendation.title}</h2>
          <div className="match-pill inline">
            <strong>{recommendation.eligibilityScore}%</strong>
            <span>{text.checklist.match}</span>
          </div>
          <p>{recommendation.shortDescription}</p>
        </Card>

        <Card className="checklist-actions">
          <h2>{text.checklist.actions}</h2>
          <a className="btn btn-outline" href={recommendation.officialUrl || "#official-source-placeholder"}>{text.buttons.official}</a>
          <Button variant="secondary" onClick={() => navigate("/results")}>{text.buttons.backResults}</Button>
        </Card>

        <div className="checklist-detail-grid">
          <Card className="checklist-card">
            <h2>{language === "bm" ? "Penjelasan ringkas" : "Simple explanation"}</h2>
            {isExplanationLoading ? (
              <p>{language === "bm" ? "Sedang menyediakan penjelasan..." : "Preparing explanation..."}</p>
            ) : explanationError ? (
              <p>{explanationError}</p>
            ) : (
              <>
                <p>{explanation}</p>
                {explanationSource === "fallback" && (
                  <p className="helper-text">
                    {language === "bm" ? "Penjelasan asas digunakan kerana Gemini belum dikonfigurasi atau tidak tersedia." : "Basic explanation used because Gemini is not configured or unavailable."}
                  </p>
                )}
              </>
            )}
          </Card>
          <ChecklistCard title={text.checklist.why} items={recommendation.matchReasons.length ? recommendation.matchReasons : [language === "bm" ? "Profil anda mempunyai beberapa padanan dengan peraturan demo." : "Your profile has some matches with the demo rules."]} />
          <ChecklistCard title={text.checklist.confirm} items={recommendation.missingInfo.length ? recommendation.missingInfo : [language === "bm" ? "Sahkan butiran akhir dengan agensi rasmi." : "Verify final details with the official agency."]} />
          <Card className="checklist-card">
            <h2>{text.checklist.source}</h2>
            <p><strong>{text.checklist.sourceLabel}</strong> {recommendation.officialUrl || text.checklist.portal}</p>
            <p>{text.checklist.sourceNote}</p>
          </Card>
          <ChecklistCard title={text.checklist.documents} items={recommendation.requiredDocuments} />
          <ChecklistCard title={text.checklist.next} items={recommendation.nextSteps} ordered />
        </div>
      </div>

      <DisclaimerBanner>{text.common.guidance}</DisclaimerBanner>
    </main>
  );
}
