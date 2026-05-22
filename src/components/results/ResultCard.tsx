// Result cards for backend recommendation groups.
import { useLanguage } from "../../context/LanguageContext";
import type { ProgramRecommendation } from "../../types/program";
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
  const { text } = useLanguage();

  return (
    <Card className={recommendation.status === "Need More Info" ? "result-card soft-info" : "result-card"}>
      <div className="result-card-header">
        <div>
          <Badge tone={badgeTone(recommendation.status)}>{recommendation.status}</Badge>
          <h3>{recommendation.title}</h3>
        </div>
        <div className="match-pill">
          <strong>{recommendation.eligibilityScore}%</strong>
          <span>{text.results.match}</span>
        </div>
      </div>
      <p>{recommendation.shortDescription}</p>
      {recommendation.matchReasons.length > 0 ? <p>{recommendation.matchReasons[0]}</p> : null}
      <div className="document-list">
        <strong>{text.results.documents}</strong>
        <ul>
          {recommendation.requiredDocuments.slice(0, 3).map((document) => <li key={document}>{document}</li>)}
        </ul>
      </div>
      {recommendation.officialUrl ? (
        <a className="source-placeholder" href={recommendation.officialUrl}>{text.results.source}</a>
      ) : (
        <span className="source-placeholder">{text.results.source}</span>
      )}
      <Button onClick={() => navigate(`/checklist/${recommendation.id}`)}>{text.buttons.viewProgram}</Button>
    </Card>
  );
}
