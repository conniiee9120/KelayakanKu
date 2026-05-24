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
  const { text } = useLanguage();
  const result = getEligibilityResult();
  const error = getEligibilityError();
  const hasNoMatches = result ? result.recommended.length === 0 && result.needMoreInfo.length === 0 : false;

  if (!result) {
    return (
      <main className="section-shell page-section">
        <Card className="empty-state">
          <h1>{text.results.notReadyTitle}</h1>
          <p>{error || text.results.notReadyDesc}</p>
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
          <MetricCard label={text.results.readyReview} value={result.recommended.length + result.needMoreInfo.length} />
        </div>
      </Card>

      {hasNoMatches ? (
        <section className="page-section compact">
          <Card className="empty-state">
            <h2>{text.results.emptyNoMatchesTitle}</h2>
            <p>{text.results.emptyNoMatchesDesc}</p>
            <div className="button-row empty-state-actions">
              <Button onClick={() => navigate("/review")}>{text.buttons.review}</Button>
              <Button variant="outline" onClick={() => navigate("/eligibility")}>{text.buttons.tryAgain}</Button>
            </div>
            <div className="common-reasons">
              <h3>{text.results.commonReasonsTitle}</h3>
              <ul className="plain-list">
                {text.results.commonReasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          </Card>
        </section>
      ) : (
        <>
          <section className="page-section compact">
            <div className="section-header">
              <h2>{text.results.recommended}</h2>
              <p>{text.results.recommendedDesc}</p>
            </div>
            {result.recommended.length > 0 ? (
              <div className="card-grid two">
                {result.recommended.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}
              </div>
            ) : (
              <Card className="empty-state">
                <p>{text.results.noRecommended}</p>
              </Card>
            )}
          </section>

          <section className="page-section compact">
            <div className="section-header">
              <h2>{text.results.needInfo}</h2>
              <p>{text.results.needInfoDesc}</p>
            </div>
            {result.needMoreInfo.length > 0 ? (
              <div className="card-grid two">
                {result.needMoreInfo.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}
              </div>
            ) : (
              <Card className="empty-state">
                <p>{text.results.noNeedInfo}</p>
              </Card>
            )}
          </section>
        </>
      )}

      <DisclaimerBanner>{text.common.disclaimer}</DisclaimerBanner>
    </main>
  );
}
