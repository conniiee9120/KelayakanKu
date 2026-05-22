// Review page that safely displays saved form answers before matching.
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getEligibilityForm } from "../utils/storage";
import { navigate } from "../utils/navigation";
import { useLanguage } from "../context/LanguageContext";
import { formatEligibilityValue } from "../data/formOptions";
import type { EligibilityFormData } from "../types/eligibility";
import type { Language } from "../data/translations";

const labels = {
  en: [
    ["citizenship", "Citizenship"],
    ["ageGroup", "Age group"],
    ["state", "State"],
    ["householdSituation", "Household"],
    ["dependents", "People depending on household income"],
    ["workSituation", "Work situation"],
    ["householdIncomeRange", "Estimated monthly household income"],
    ["incomeStability", "Income stability"],
    ["contributionStatus", "EPF/KWSP or SOCSO/PERKESO status"],
    ["supportNeeds", "Support needed"],
    ["specialSituations", "Special household situations"],
    ["extraContext", "Extra context"]
  ],
  bm: [
    ["citizenship", "Kewarganegaraan"],
    ["ageGroup", "Kumpulan umur"],
    ["state", "Negeri"],
    ["householdSituation", "Isi rumah"],
    ["dependents", "Orang yang bergantung pada pendapatan isi rumah"],
    ["workSituation", "Situasi kerja"],
    ["householdIncomeRange", "Anggaran pendapatan bulanan isi rumah"],
    ["incomeStability", "Kestabilan pendapatan"],
    ["contributionStatus", "Status EPF/KWSP atau SOCSO/PERKESO"],
    ["supportNeeds", "Sokongan diperlukan"],
    ["specialSituations", "Situasi khas isi rumah"],
    ["extraContext", "Konteks tambahan"]
  ]
} as const;

function displayValue(key: keyof EligibilityFormData, value: string | undefined, language: Language) {
  if (!value) return "";
  if (key === "extraContext") return value;
  return formatEligibilityValue(key, value, language);
}

export function ReviewDetails() {
  const { language, text } = useLanguage();
  const form = getEligibilityForm();

  return (
    <main className="section-shell page-section">
      <div className="page-title">
        <span>{text.review.eyebrow}</span>
        <h1>{text.review.title}</h1>
        <p>{text.review.desc}</p>
      </div>

      {!form ? (
        <Card className="empty-state">
          <h2>{text.review.emptyTitle}</h2>
          <p>{text.review.emptyDesc}</p>
          <Button onClick={() => navigate("/eligibility")}>{text.buttons.start}</Button>
        </Card>
      ) : (
        <div className="two-column">
          <Card>
            <h2>{text.review.summary}</h2>
            <p>{text.review.helper}</p>
            <dl className="summary-grid">
              {labels[language].map(([key, label]) => (
                <div key={key} className={key === "extraContext" ? "wide" : ""}>
                  <dt>{label}</dt>
                  <dd>{displayValue(key, form[key], language) || text.review.notProvided}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="action-card">
            <h2>{text.review.ready}</h2>
            <p>{text.review.readyDesc}</p>
            <Button variant="outline" onClick={() => navigate("/eligibility")}>{text.buttons.edit}</Button>
            <Button onClick={() => navigate("/processing")}>{text.buttons.find}</Button>
          </Card>
        </div>
      )}
    </main>
  );
}
