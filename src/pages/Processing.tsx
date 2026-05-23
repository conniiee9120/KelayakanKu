// Processing state that calls the backend eligibility API before results.
import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useLanguage } from "../context/LanguageContext";
import { checkEligibility, mapFormToBackendProfile } from "../services/api";
import { navigate } from "../utils/navigation";
import { getEligibilityForm, saveEligibilityError, saveEligibilityResult } from "../utils/storage";

export function Processing() {
  const { language, text } = useLanguage();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const items = text.processing.steps;

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      const form = getEligibilityForm();

      if (!form) {
        const message = text.processing.missingForm;
        saveEligibilityError(message);
        if (!cancelled) setError(message);
        return;
      }

      try {
        const profile = mapFormToBackendProfile(form);
        const result = await checkEligibility(profile);
        saveEligibilityResult(result);
        if (!cancelled) {
          setReady(true);
          window.setTimeout(() => navigate("/results"), 500);
        }
      } catch (apiError) {
        const message = text.processing.apiError;
        saveEligibilityError(message);
        if (!cancelled) setError(message);
      }
    }

    runCheck();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <main className="section-shell page-section centered-page">
      <h1>{text.processing.title}</h1>
      <p>{text.processing.desc}</p>
      <Card className="processing-card">
        {!error ? <div className="spinner" aria-hidden="true" /> : null}
        <ul>
          {items.map((item) => <li className={!error ? "done" : ""} key={item}><span>{!error ? "✓" : "!"}</span>{item}</li>)}
        </ul>
        {error ? (
          <>
            <p><strong>{text.common.error}</strong> {error}</p>
            <Button onClick={() => navigate("/review")}>{text.buttons.edit}</Button>
          </>
        ) : (
          <>
            <p>{ready ? text.processing.ready : text.processing.note}</p>
            <Button onClick={() => navigate("/results")}>{text.processing.viewResults}</Button>
          </>
        )}
      </Card>
    </main>
  );
}
