import { useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyForm } from "../../components/admin/PolicyForm";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { approvePolicy, extractPolicy, searchPolicySources, type AdminPolicy, type ExtractionResponse, type FieldEvidence, type PolicyDraft, type SearchResult } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

function stringifyValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "[]";
  if (value === null || value === undefined || value === "") return "Not found";
  if (typeof value === "boolean") return value ? "true" : "false";
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

export function AdminPolicyImportPage() {
  const [query, setQuery] = useState("site:gov.my bantuan kewangan B40 Malaysia 2026");
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  async function handleSearch() {
    setMessage("");
    setLoading("Searching official sources...");
    try {
      const response = await searchPolicySources(query);
      setResults(response.results);
      if (response.results.length === 0) setMessage("No trusted results found. Try another query or add policy manually.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading("");
    }
  }

  async function handleExtract(payload: { sourceUrl?: string; rawText?: string }) {
    setMessage("");
    setLoading("Extracting policy with evidence and audit...");
    try {
      setExtraction(await extractPolicy(payload));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setLoading("");
    }
  }

  async function handleApprove(policy: AdminPolicy) {
    const saved = await approvePolicy(policy);
    navigate(`/admin/policies/${saved.id}/edit`);
  }

  const evidenceRows = flattenDraftEvidence(extraction?.policyDraft || null);

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>Import Policy</h2>
          <p>Extract from official sources, cross-check evidence, edit if needed, then approve manually.</p>
        </div>
      </div>

      <Card className="stack">
        <label className="form-field">
          <span>Search query</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <Button onClick={handleSearch}>Search Official Sources</Button>
        {loading && <p>{loading}</p>}
        {message && <div className="disclaimer-banner">{message}</div>}
        <div className="stack">
          {results.map((result) => (
            <Card key={result.link} className="soft-info">
              <h3>{result.title}</h3>
              <p>{result.snippet}</p>
              <p><strong>{result.source}</strong></p>
              <div className="button-row">
                <a className="btn btn-outline" href={result.link} target="_blank" rel="noreferrer">Open official portal</a>
                <Button variant="outline" onClick={() => handleExtract({ sourceUrl: result.link })}>Extract Policy</Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="stack">
        <h2>Extract from pasted text</h2>
        <label className="form-field">
          <span>Policy text</span>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Paste official policy text here..." />
        </label>
        <Button variant="secondary" onClick={() => handleExtract({ rawText })}>Extract from Text</Button>
      </Card>

      {extraction && (
        <div className="stack">
          <div className="admin-review-grid">
            <Card>
              <h2>Extraction confidence</h2>
              <div className="match-pill inline">
                <strong>{Math.round(extraction.confidence.overallConfidence * 100)}%</strong>
                <span>{extraction.confidence.riskLevel} risk</span>
              </div>
              <p>Manual admin review is still required. This system never treats extraction as 100% accurate.</p>
              {extraction.policy.sourceUrl && (
                <a className="btn btn-outline" href={extraction.policy.sourceUrl} target="_blank" rel="noreferrer">Open official portal</a>
              )}
            </Card>
            <Card>
              <h2>Audit result</h2>
              <p>{extraction.audit.auditPassed ? "No major audit issue was returned." : "Audit found issues or needs manual checking."}</p>
              {extraction.audit.fieldIssues.length > 0 && (
                <ul className="plain-list">
                  {extraction.audit.fieldIssues.map((issue) => (
                    <li key={`${issue.field}-${issue.issue}`}>
                      <strong>{issue.severity.toUpperCase()}:</strong> {issue.field} - {issue.issue}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {(extraction.warnings.length > 0 || extraction.validation.errors.length > 0) && (
            <div className="disclaimer-banner">
              <strong>Review warnings:</strong> {[...extraction.warnings, ...extraction.validation.errors].join(" ")}
            </div>
          )}

          <Card>
            <h2>Field-level evidence</h2>
            <p>Compare each extracted value with the evidence before approving.</p>
            <div className="admin-table-wrap">
              <table className="admin-table evidence-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Extracted value</th>
                    <th>Evidence quote</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map(([name, field]) => (
                    <tr key={name}>
                      <td><strong>{name}</strong></td>
                      <td>{stringifyValue(field.value)}</td>
                      <td>{field.evidence || "No evidence found"}</td>
                      <td>{Math.round((field.confidence || 0) * 100)}%</td>
                      <td>{field.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="stack">
            <h2>Editable policy draft</h2>
            <PolicyForm initialPolicy={extraction.policy} onSubmit={handleApprove} submitLabel="Approve and Save" />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
