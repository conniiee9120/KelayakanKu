import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyForm } from "../../components/admin/PolicyForm";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  AdminApiError,
  approvePolicy,
  clearAdminToken,
  extractPolicy,
  getAdminToken,
  savePolicyDraft,
  type AdminPolicy,
  type ExtractionResponse,
  type FieldEvidence,
  type PolicyDraft
} from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

const EXTRACTION_PAYLOAD_KEY = "kelayakanku_admin_extraction_payload";
const EXTRACTION_TIMEOUT_MS = 90000;
const extractionRequests = new Map<string, Promise<ExtractionResponse>>();

interface ExtractionPayload {
  sourceType: "url" | "rawText";
  sourceUrl?: string;
  rawText?: string;
  title?: string;
  snippet?: string;
  source?: string;
}

type PageState = "idle" | "loading" | "success" | "error" | "auth";
type StepState = "pending" | "active" | "completed" | "failed";
interface ExtractionErrorDetail {
  stage?: string;
  message: string;
  technicalHint?: string;
  suggestedAction?: string;
  canUsePastedTextFallback?: boolean;
}

function readExtractionPayload(): ExtractionPayload | null {
  try {
    const raw = sessionStorage.getItem(EXTRACTION_PAYLOAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExtractionPayload;
    return parsed.sourceType ? parsed : null;
  } catch {
    return null;
  }
}

function getPayloadKey(payload: ExtractionPayload) {
  return JSON.stringify({
    sourceType: payload.sourceType,
    sourceUrl: payload.sourceUrl || "",
    rawText: payload.rawText || ""
  });
}

function isPayloadComplete(payload: ExtractionPayload | null) {
  return Boolean(payload && (payload.sourceUrl?.trim() || payload.rawText?.trim()));
}

function stringifyValue(value: unknown, labels: { notFound: string; yes: string; no: string }) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "[]";
  if (value === null || value === undefined || value === "") return labels.notFound;
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  return String(value);
}

function flattenDraftEvidence(draft: PolicyDraft | null) {
  if (!draft) return [];
  return [
    ["title", draft.title],
    ["category", draft.category],
    ["shortDescription", draft.shortDescription],
    ["eligibilityRules.citizenship", draft.eligibilityRules.citizenship],
    ["eligibilityRules.maxHouseholdIncome", draft.eligibilityRules.maxHouseholdIncome],
    ["eligibilityRules.maxMonthlyIncome", draft.eligibilityRules.maxMonthlyIncome],
    ["eligibilityRules.states", draft.eligibilityRules.states],
    ["eligibilityRules.minAge", draft.eligibilityRules.minAge],
    ["eligibilityRules.maxAge", draft.eligibilityRules.maxAge],
    ["eligibilityRules.employmentStatuses", draft.eligibilityRules.employmentStatuses],
    ["eligibilityRules.requiresChildren", draft.eligibilityRules.requiresChildren],
    ["eligibilityRules.requiresDisability", draft.eligibilityRules.requiresDisability],
    ["eligibilityRules.requiresStudent", draft.eligibilityRules.requiresStudent],
    ["requiredDocuments", draft.requiredDocuments],
    ["nextSteps", draft.nextSteps],
    ["officialUrl", draft.officialUrl],
    ["sourceUrl", draft.sourceUrl],
    ["applicationDeadline", draft.applicationDeadline]
  ] as Array<[string, FieldEvidence & { value: unknown }]>;
}

function getSteps(sourceType: ExtractionPayload["sourceType"], text: ReturnType<typeof useLanguage>["text"]) {
  return sourceType === "url" ? text.admin.stepsUrl : text.admin.stepsText;
}

function getStepState(index: number, activeIndex: number, failedIndex: number | null, state: PageState): StepState {
  if (failedIndex === index) return "failed";
  if (state === "success" || index < activeIndex) return "completed";
  if (state === "loading" && index === activeIndex) return "active";
  return "pending";
}

function failureStepFromMessage(payload: ExtractionPayload, message: string, activeIndex: number) {
  const lower = message.toLowerCase();
  if (lower.includes("unauthorized")) return 0;
  if (lower.includes("sourceurl or rawtext") || lower.includes("incomplete")) return 0;
  if (payload.sourceType === "url" && (lower.includes("webpage") || lower.includes("source") || lower.includes("fetch"))) return 1;
  if (lower.includes("validation")) return payload.sourceType === "url" ? 5 : 4;
  return activeIndex;
}

function failureStepFromStage(payload: ExtractionPayload, stage?: string) {
  if (!stage) return null;
  if (stage === "authentication" || stage === "source_fetch") return payload.sourceType === "url" ? 1 : 0;
  if (stage === "text_cleaning") return payload.sourceType === "url" ? 2 : 1;
  if (stage === "gemini_extraction") return payload.sourceType === "url" ? 3 : 2;
  if (stage === "gemini_audit") return payload.sourceType === "url" ? 4 : 3;
  if (stage === "validation") return payload.sourceType === "url" ? 5 : 4;
  return null;
}

export function AdminPolicyExtractionPage() {
  const { text } = useLanguage();
  const [payload] = useState<ExtractionPayload | null>(() => readExtractionPayload());
  const [state, setState] = useState<PageState>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndex, setFailedIndex] = useState<number | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState<ExtractionErrorDetail | null>(null);
  const [longRunning, setLongRunning] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedPolicyId, setSavedPolicyId] = useState("");
  const hasStartedExtractionRef = useRef(false);
  const isMountedRef = useRef(true);

  const steps = useMemo(() => getSteps(payload?.sourceType || "url", text), [payload?.sourceType, text]);
  const evidenceRows = flattenDraftEvidence(extraction?.policyDraft || null);

  async function runExtraction() {
    if (hasStartedExtractionRef.current) return;

    if (!payload) {
      setState("error");
      setError(text.admin.noExtractionDesc);
      setFailedIndex(0);
      return;
    }

    if (!isPayloadComplete(payload)) {
      setState("error");
      setError(text.admin.incompleteSourceDesc);
      setFailedIndex(0);
      return;
    }

    if (!getAdminToken()) {
      setState("auth");
      setError(text.admin.goLogin);
      setErrorDetail({
        stage: "authentication",
        message: text.admin.goLogin,
        suggestedAction: text.admin.backImport,
        canUsePastedTextFallback: false
      });
      setFailedIndex(0);
      return;
    }

    hasStartedExtractionRef.current = true;
    setState("loading");
    setError("");
    setErrorDetail(null);
    setLongRunning(false);
    setFailedIndex(null);
    setActiveIndex(1);

    const maxSimulatedStep = Math.max(1, steps.length - 2);
    const progressTimer = window.setInterval(() => {
      setActiveIndex((current) => Math.min(current + 1, maxSimulatedStep));
    }, 1600);
    const timeoutTimer = window.setTimeout(() => {
      if (isMountedRef.current) setLongRunning(true);
    }, EXTRACTION_TIMEOUT_MS);

    try {
      const requestKey = getPayloadKey(payload);
      let request = extractionRequests.get(requestKey);
      if (!request) {
        request = extractPolicy({
          sourceUrl: payload.sourceUrl,
          rawText: payload.sourceType === "rawText" ? payload.rawText : undefined
        });
        extractionRequests.set(requestKey, request);
      }

      const result = await request;
      window.clearInterval(progressTimer);
      window.clearTimeout(timeoutTimer);
      if (!isMountedRef.current) return;
      setExtraction(result);
      setActiveIndex(steps.length);
      setState("success");
    } catch (err) {
      window.clearInterval(progressTimer);
      window.clearTimeout(timeoutTimer);
      if (!isMountedRef.current) return;

      const message = err instanceof Error ? err.message : text.admin.extractionFailed;
      if (err instanceof AdminApiError && err.status === 401) {
        clearAdminToken();
        setState("auth");
        setError(text.admin.loginAgain);
        setErrorDetail({
          stage: "authentication",
          message: text.admin.loginAgain,
          suggestedAction: text.admin.backImport,
          canUsePastedTextFallback: false
        });
      } else {
        setState("error");
        setError(message);
        setErrorDetail(err instanceof AdminApiError ? {
          stage: err.stage,
          message,
          technicalHint: err.technicalHint,
          suggestedAction: err.suggestedAction,
          canUsePastedTextFallback: err.canUsePastedTextFallback
        } : { message, suggestedAction: text.admin.usePastedInstead });
      }
      const stage = err instanceof AdminApiError ? err.stage : undefined;
      setFailedIndex(failureStepFromStage(payload, stage) ?? failureStepFromMessage(payload, message, activeIndex));
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    runExtraction();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function tryAgain() {
    if (state === "loading") return;
    if (payload) extractionRequests.delete(getPayloadKey(payload));
    hasStartedExtractionRef.current = false;
    setExtraction(null);
    setSaveMessage("");
    setSavedPolicyId("");
    setLongRunning(false);
    setErrorDetail(null);
    runExtraction();
  }

  async function handleApprove(policy: AdminPolicy) {
    if (!window.confirm(text.admin.approveConfirm)) return;
    const saved = await approvePolicy(policy);
    setSavedPolicyId(saved.id || "");
    setSaveMessage(text.admin.approvedSaved);
  }

  async function handleSaveDraft(policy: AdminPolicy) {
    const saved = await savePolicyDraft(policy);
    setSavedPolicyId(saved.id || "");
    setSaveMessage(text.admin.draftSaved);
  }

  if (!payload) {
    return (
      <AdminLayout>
        <Card className="empty-state">
          <h2>{text.admin.noExtractionTitle}</h2>
          <p>{text.admin.noExtractionDesc}</p>
          <Button onClick={() => navigate("/admin/policy-import")}>{text.admin.backImport}</Button>
        </Card>
      </AdminLayout>
    );
  }

  if (!isPayloadComplete(payload)) {
    return (
      <AdminLayout>
        <Card className="empty-state">
          <h2>{text.admin.incompleteSourceTitle}</h2>
          <p>{text.admin.incompleteSourceDesc}</p>
          <Button onClick={() => navigate("/admin/policy-import")}>{text.admin.backImport}</Button>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <span className="badge badge-info">{text.admin.step4}</span>
          <h2>{text.admin.extractionReview}</h2>
          <p>{text.admin.extractionNotice}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/policy-import")}>{text.admin.backImport}</Button>
      </div>

      <Card className="stack">
        <h2>{text.admin.sourceInformation}</h2>
        <p><strong>{text.admin.sourceType}</strong> {payload.sourceType === "url" ? text.admin.officialSourceUrl : text.admin.pastedOfficialText}</p>
        {payload.title && <p><strong>{text.admin.tableTitle}:</strong> {payload.title}</p>}
        {payload.source && <p><strong>{text.checklist.sourceLabel}</strong> {payload.source}</p>}
        {payload.snippet && <p>{payload.snippet}</p>}
        {payload.sourceUrl && <a className="btn btn-outline" href={payload.sourceUrl} target="_blank" rel="noreferrer">{text.admin.openPortal}</a>}
      </Card>

      <Card className="stack">
        <h2>{text.admin.extractionProgress}</h2>
        {state === "loading" && <p>{text.admin.waitExtraction}</p>}
        {longRunning && (
          <div className="disclaimer-banner">
            {text.admin.longExtraction}
          </div>
        )}
        <ul className="plain-list">
          {steps.map((step, index) => {
            const stepStatus = getStepState(index, activeIndex, failedIndex, state);
            return (
              <li key={step}>
                <span className={`badge ${stepStatus === "failed" ? "badge-warning" : stepStatus === "completed" ? "badge-success" : stepStatus === "active" ? "badge-info" : "badge-neutral"}`}>{text.admin[stepStatus]}</span>
                {" "}{step}
              </li>
            );
          })}
        </ul>
        {(state === "error" || state === "auth") && (
          <div className="disclaimer-banner">
            <strong>{state === "auth" ? text.admin.loginRequired : text.admin.extractionFailed}</strong> {error}
            {errorDetail?.stage && <p><strong>{text.admin.failureStage}</strong> {errorDetail.stage}</p>}
            {errorDetail?.suggestedAction && <p><strong>{text.admin.suggestedAction}</strong> {errorDetail.suggestedAction}</p>}
            {errorDetail?.technicalHint && import.meta.env.DEV && <p><strong>{text.admin.developerHint}</strong> {errorDetail.technicalHint}</p>}
            {payload.sourceType === "url" && state === "error" && <p>{text.admin.webpageFailed}</p>}
            <div className="button-row">
              <Button variant="outline" onClick={() => navigate("/admin/policy-import")}>{text.admin.backImport}</Button>
              {state === "auth" ? (
                <Button onClick={() => navigate("/admin/login")}>
                  {error.includes("expired") && !error.includes("restart") ? text.admin.goLogin : text.admin.loginAgain}
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={tryAgain}>{text.admin.tryAgain}</Button>
                  {payload.sourceType === "url" && <Button onClick={() => navigate("/admin/policy-import")}>{text.admin.usePastedInstead}</Button>}
                  {payload.sourceUrl && <a className="btn btn-outline" href={payload.sourceUrl} target="_blank" rel="noreferrer">{text.admin.openPortal}</a>}
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {extraction && (
        <div className="stack">
          <div className="admin-review-grid">
            <Card>
              <h2>{text.admin.confidence}</h2>
              <div className="match-pill inline">
                <strong>{Math.round(extraction.confidence.overallConfidence * 100)}%</strong>
                <span>{extraction.confidence.riskLevel} {text.admin.risk}</span>
              </div>
              <p>{text.admin.not100}</p>
            </Card>
            <Card>
              <h2>{text.admin.auditResult}</h2>
              <p>{extraction.audit.auditPassed ? text.admin.auditPassed : text.admin.auditNeedsCheck}</p>
              {extraction.audit.fieldIssues.length > 0 && (
                <ul className="plain-list">
                  {extraction.audit.fieldIssues.map((issue) => (
                    <li key={`${issue.field}-${issue.issue}`}><strong>{issue.severity.toUpperCase()}:</strong> {issue.field} - {issue.issue}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {(extraction.warnings.length > 0 || extraction.validation.errors.length > 0) && (
            <div className="disclaimer-banner">
              <strong>{text.admin.reviewWarnings}</strong> {[...extraction.warnings, ...extraction.validation.errors].join(" ")}
            </div>
          )}

          {!extraction.success && (
            <div className="disclaimer-banner">
              <strong>{text.admin.manualReviewNeeded}</strong> {text.admin.manualReviewDesc}
              {extraction.stage && <p><strong>{text.admin.failureStage}</strong> {extraction.stage}</p>}
              {extraction.suggestedAction && <p><strong>{text.admin.suggestedAction}</strong> {extraction.suggestedAction}</p>}
            </div>
          )}

          <Card>
            <h2>{text.admin.fieldEvidence}</h2>
            <p>{text.admin.fieldEvidenceDesc}</p>
            <div className="admin-table-wrap">
              <table className="admin-table evidence-table">
                <thead>
                  <tr>
                    <th>{text.admin.field}</th>
                    <th>{text.admin.extractedValue}</th>
                    <th>{text.admin.evidenceQuote}</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map(([name, field]) => (
                    <tr key={name}>
                      <td><strong>{name}</strong></td>
                      <td>{stringifyValue(field.value, { notFound: text.common.unknown, yes: text.common.yes, no: text.common.no })}</td>
                      <td>{field.evidence || text.admin.noEvidence}</td>
                      <td>{Math.round((field.confidence || 0) * 100)}%</td>
                      <td>{field.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {saveMessage ? (
            <Card className="empty-state">
              <h2>{saveMessage}</h2>
              <div className="button-row">
                <Button onClick={() => navigate("/admin/policies")}>{text.admin.viewPolicies}</Button>
                <Button variant="outline" onClick={() => navigate("/admin/policy-import")}>{text.admin.importAnother}</Button>
                {savedPolicyId && <Button variant="secondary" onClick={() => navigate(`/admin/policies/${savedPolicyId}/edit`)}>{text.admin.continueEditing}</Button>}
                <Button variant="outline" onClick={() => navigate("/eligibility")}>{text.admin.testUserFlow}</Button>
              </div>
            </Card>
          ) : (
            <div className="stack">
              <h2>{text.admin.extractedPreview}</h2>
              <PolicyForm
                key={extraction.policy.id || extraction.policy.title}
                initialPolicy={extraction.policy}
                onSubmit={handleApprove}
                submitLabel={text.admin.approveSave}
                secondaryLabel={text.admin.saveDraft}
                onSecondarySubmit={handleSaveDraft}
                primaryDisabled={!extraction.success}
              />
              {!extraction.success && (
                <p className="helper-text">
                  {text.admin.approveDisabled}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
