import type { AdminPolicy } from "../../services/adminApi";
import { Button } from "../ui/Button";

interface PolicyTableProps {
  policies: AdminPolicy[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PolicyTable({ policies, onEdit, onDelete }: PolicyTableProps) {
  return (
    <div className="admin-table-wrap card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>State</th>
            <th>Status</th>
            <th>Last updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id}>
              <td><strong>{policy.title}</strong></td>
              <td>{policy.category}</td>
              <td>{policy.eligibilityRules?.states?.join(", ") || "All"}</td>
              <td>{policy.verificationStatus || "draft"}</td>
              <td>{policy.lastUpdated || "-"}</td>
              <td>
                <div className="admin-row-actions">
                  <Button variant="outline" onClick={() => policy.id && onEdit(policy.id)}>Edit</Button>
                  <Button variant="ghost" onClick={() => policy.id && onDelete(policy.id)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {policies.length === 0 && <p>No policies found.</p>}
    </div>
  );
}
