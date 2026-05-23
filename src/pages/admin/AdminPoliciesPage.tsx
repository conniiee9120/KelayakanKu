import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyTable } from "../../components/admin/PolicyTable";
import { Button } from "../../components/ui/Button";
import { approvePolicy, deleteAdminPolicy, getAdminPolicies, type AdminPolicy } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

export function AdminPoliciesPage() {
  const { text } = useLanguage();
  const isDraftsPage = window.location.pathname === "/admin/drafts";
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  async function loadPolicies() {
    setPolicies(await getAdminPolicies());
  }

  useEffect(() => {
    loadPolicies().catch((err) => setMessage(err instanceof Error ? err.message : text.admin.loadPoliciesError));
  }, []);

  const filtered = useMemo(() => {
    return policies.filter((policy) => {
      const matchesQuery = `${policy.title} ${policy.category}`.toLowerCase().includes(query.toLowerCase());
      const isApproved = policy.verificationStatus === "approved";
      const matchesPage = isDraftsPage ? !isApproved : isApproved;
      return matchesQuery && matchesPage;
    });
  }, [isDraftsPage, policies, query]);

  async function handleDelete(id: string) {
    if (!window.confirm(text.admin.deleteConfirm)) return;
    await deleteAdminPolicy(id);
    await loadPolicies();
  }

  async function handleApprove(policy: AdminPolicy) {
    if (!window.confirm(text.admin.approveDraftConfirm)) return;
    try {
      await approvePolicy(policy);
      setMessage(text.admin.approvedDraftMessage);
      await loadPolicies();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.admin.savePolicyFailed);
    }
  }

  const pageTitle = isDraftsPage ? text.admin.policyDraftsTitle : text.admin.approvedPoliciesTitle;
  const pageDesc = isDraftsPage ? text.admin.policyDraftsDesc : text.admin.approvedPoliciesDesc;
  const emptyMessage = isDraftsPage ? text.admin.noPendingDrafts : text.admin.noApprovedPolicies;

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>{pageTitle}</h2>
          <p>{pageDesc}</p>
        </div>
        {!isDraftsPage && <Button onClick={() => navigate("/admin/policies/new")}>{text.admin.addPolicyManually}</Button>}
      </div>
      <div className="card admin-filters">
        <label className="form-field">
          <span>{text.admin.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.admin.searchPlaceholder} />
        </label>
      </div>
      {message && <div className="disclaimer-banner">{message}</div>}
      <PolicyTable
        policies={filtered}
        onEdit={(id) => navigate(`/admin/policies/${id}/edit`)}
        onDelete={handleDelete}
        onApprove={isDraftsPage ? handleApprove : undefined}
        editLabel={isDraftsPage ? text.admin.reviewPolicy : text.admin.viewEdit}
        emptyMessage={emptyMessage}
      />
    </AdminLayout>
  );
}
