// Eligibility Snapshot results loaded from backend response stored in localStorage.
import { MetricCard } from "../components/results/MetricCard";
import { RecommendationCard } from "../components/results/ResultCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";
import { useLanguage } from "../context/LanguageContext";
import { navigate } from "../utils/navigation";
import { getEligibilityError, getEligibilityResult } from "../utils/storage";

export function Results() {
  const { language, text } = useLanguage();
  const result = getEligibilityResult();
  const error = getEligibilityError();

  if (!result) {
    return (
      <main className="section-shell page-section">
        <Card className="empty-state">
          <h1>{language === "bm" ? "Keputusan belum tersedia" : "Results are not ready yet"}</h1>
          <p>{error || (language === "bm" ? "Sila jalankan semakan kelayakan dahulu." : "Please run the eligibility check first.")}</p>
          <Button onClick={() => navigate("/eligibility")}>{text.buttons.start}</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="section-shell page-section">
      <div className="page-title">
        <span>{text.results.eyebrow}</span>
        <h1>{text.results.title}</h1>
      </div>
      <Card>
        <p className="lead-text">{text.results.summary}</p>
        <div className="metrics-grid">
          <MetricCard label={text.results.recommended} value={result.recommended.length} />
          <MetricCard label={text.results.needInfo} value={result.needMoreInfo.length} />
          <MetricCard label={language === "bm" ? "Sokongan lain" : "Other support"} value={result.lessLikely.length} />
        </div>
      </Card>

      <section className="page-section compact">
        <div className="section-header">
          <h2>{text.results.recommended}</h2>
          <p>{text.results.recommendedDesc}</p>
        </div>
        <div className="card-grid two">
          {result.recommended.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}
        </div>
      </section>

      <section className="page-section compact">
        <div className="section-header">
          <h2>{text.results.needInfo}</h2>
          <p>{text.results.needInfoDesc}</p>
        </div>
        <div className="card-grid two">
          {result.needMoreInfo.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}
        </div>
      </section>

      <section className="page-section compact">
        <div className="section-header">
          <h2>{language === "bm" ? "Sokongan lain" : "Less likely / other support"}</h2>
          <p>{language === "bm" ? "Program ini kurang sepadan, tetapi masih dipaparkan untuk rujukan demo." : "These programs are less likely matches, but are still shown for demo reference."}</p>
        </div>
        <div className="card-grid two">
          {result.lessLikely.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}
        </div>
      </section>

      <DisclaimerBanner>{text.common.disclaimer}</DisclaimerBanner>
    </main>
  );
}
