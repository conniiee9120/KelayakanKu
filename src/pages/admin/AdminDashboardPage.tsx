import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getAdminPolicies, getSearchCache, type AdminPolicy, type SearchCacheEntry } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

export function AdminDashboardPage() {
  const { text } = useLanguage();
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [cache, setCache] = useState<SearchCacheEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAdminPolicies(), getSearchCache()])
      .then(([policyResponse, cacheResponse]) => {
        setPolicies(policyResponse);
        setCache(cacheResponse.cache);
      })
      .catch((err) => setError(err instanceof Error ? err.message : text.admin.overviewError));
  }, []);

  const approved = policies.filter((policy) => policy.verificationStatus === "approved").length;
  const draft = policies.filter((policy) => policy.verificationStatus === "draft").length;
  const pending = policies.filter((policy) => policy.verificationStatus === "pending_review").length;
  const latestCache = cache
    .slice()
    .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())[0];

  return (
    <AdminLayout>
      {error && <div className="disclaimer-banner">{error}</div>}
      <div className="admin-page-intro">
        <p>{text.admin.dashboardSubtitle}</p>
      </div>
      <div className="metrics-grid">
        <Card className="metric-card"><strong>{approved}</strong><span>{text.admin.approvedPolicies}</span></Card>
        <Card className="metric-card"><strong>{draft + pending}</strong><span>{text.admin.pendingDrafts}</span></Card>
        <Card className="metric-card"><strong>{latestCache ? new Date(latestCache.searchedAt).toLocaleDateString() : "-"}</strong><span>{text.admin.lastCacheDate}</span></Card>
      </div>
      <Card className="admin-workflow-card">
        <div className="admin-workflow-copy">
          <h2>{text.admin.adminWorkflowTitle}</h2>
          <ol className="admin-workflow-list">
            {text.admin.workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="admin-command-actions">
          <Button variant="secondary" onClick={() => navigate("/admin/policy-import")}>{text.admin.importNewPolicy}</Button>
          <div className="admin-secondary-links">
            <button type="button" onClick={() => navigate("/admin/policies")}>{text.admin.manageApprovedPolicies}</button>
            <button type="button" onClick={() => navigate("/admin/drafts")}>{text.admin.reviewDrafts}</button>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
