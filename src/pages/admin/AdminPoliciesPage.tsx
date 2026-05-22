import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyTable } from "../../components/admin/PolicyTable";
import { Button } from "../../components/ui/Button";
import { deleteAdminPolicy, getAdminPolicies, type AdminPolicy } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

export function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");

  async function loadPolicies() {
    setPolicies(await getAdminPolicies());
  }

  useEffect(() => {
    loadPolicies().catch((err) => setMessage(err instanceof Error ? err.message : "Could not load policies."));
  }, []);

  const filtered = useMemo(() => {
    return policies.filter((policy) => {
      const matchesQuery = `${policy.title} ${policy.category}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || policy.verificationStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [policies, query, status]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this policy?")) return;
    await deleteAdminPolicy(id);
    await loadPolicies();
  }

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>Policies</h2>
          <p>These records power the public eligibility matching flow.</p>
        </div>
        <Button onClick={() => navigate("/admin/policies/new")}>Add New Policy</Button>
      </div>
      <div className="card admin-filters">
        <label className="form-field">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or category" />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="approved">approved</option>
            <option value="pending_review">pending_review</option>
            <option value="draft">draft</option>
          </select>
        </label>
      </div>
      {message && <div className="disclaimer-banner">{message}</div>}
      <PolicyTable policies={filtered} onEdit={(id) => navigate(`/admin/policies/${id}/edit`)} onDelete={handleDelete} />
    </AdminLayout>
  );
}
