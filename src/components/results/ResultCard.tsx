// Result cards for backend recommendation groups.
import { useLanguage } from "../../context/LanguageContext";
import type { ProgramRecommendation } from "../../types/program";
import { getLocalizedRecommendation } from "../../utils/localizeRecommendation";
import { navigate } from "../../utils/navigation";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

function badgeTone(status: ProgramRecommendation["status"]) {
  if (status === "Recommended") return "success";
  if (status === "Need More Info") return "warning";
  return "neutral";
}

export function RecommendationCard({ recommendation }: { recommendation: ProgramRecommendation }) {
  const { language, text } = useLanguage();
  const localized = getLocalizedRecommendation(recommendation, language);
  const statusLabel = recommendation.status === "Recommended" ? text.common.recommended || "Recommended" : text.common.needMoreInfo || "Need More Info";

  return (
    <Card className={recommendation.status === "Need More Info" ? "result-card soft-info" : "result-card"}>
      <div className="result-card-header">
        <div>
          <Badge tone={badgeTone(recommendation.status)}>{statusLabel}</Badge>
          <h3>{localized.title}</h3>
        </div>
        <div className="match-pill">
          <strong>{recommendation.eligibilityScore}%</strong>
          <span>{text.results.match}</span>
        </div>
      </div>
      <p>{localized.shortDescription}</p>
      {localized.matchReasons.slice(0, 2).map((reason) => <p key={reason}>{reason}</p>)}
      {recommendation.status === "Need More Info" && localized.needsMoreInfoReasons.length > 0 ? (
        <p>{localized.needsMoreInfoReasons[0]}</p>
      ) : null}
      <div className="document-list">
        <strong>{text.results.documents}</strong>
        <ul>
          {localized.requiredDocuments.slice(0, 3).map((document) => <li key={document}>{document}</li>)}
        </ul>
      </div>
      {recommendation.officialUrl || recommendation.sourceUrl ? (
        <a className="source-placeholder" href={recommendation.officialUrl || recommendation.sourceUrl} target="_blank" rel="noopener noreferrer">{text.results.officialSource}</a>
      ) : (
        <span className="source-placeholder">{text.results.officialSource}</span>
      )}
      <Button onClick={() => navigate(`/checklist/${recommendation.id}`)}>{text.buttons.viewProgram}</Button>
    </Card>
  );
}
