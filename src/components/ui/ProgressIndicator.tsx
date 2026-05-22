// Three-step progress indicator for the eligibility wizard.
import { useLanguage } from "../../context/LanguageContext";

export function ProgressIndicator({ step }: { step: number }) {
  const { language } = useLanguage();
  const labels = language === "bm"
    ? ["Langkah 1 daripada 3: Profil Asas & Isi Rumah", "Langkah 2 daripada 3: Kerja & Pendapatan", "Langkah 3 daripada 3: Keperluan Sokongan & Situasi Khas"]
    : ["Step 1 of 3: Basic Profile & Household", "Step 2 of 3: Work & Income", "Step 3 of 3: Support Needs & Special Situation"];

  return (
    <ol className="progress-list" aria-label="Form progress">
      {labels.map((label, index) => {
        const number = index + 1;
        return (
          <li key={label} className={number === step ? "active" : number < step ? "complete" : ""} aria-current={number === step ? "step" : undefined}>
            <span>{number}</span>
            <p>{label}</p>
          </li>
        );
      })}
    </ol>
  );
}
