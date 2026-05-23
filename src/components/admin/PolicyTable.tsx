import type { AdminPolicy } from "../../services/adminApi";
import { useLanguage } from "../../context/LanguageContext";
import { Button } from "../ui/Button";

interface PolicyTableProps {
  policies: AdminPolicy[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (policy: AdminPolicy) => void;
  editLabel?: string;
  emptyMessage?: string;
}

export function PolicyTable({ policies, onEdit, onDelete, onApprove, editLabel, emptyMessage }: PolicyTableProps) {
  const { text } = useLanguage();
  return (
    <div className="admin-table-wrap card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{text.admin.tableTitle}</th>
            <th>{text.admin.tableCategory}</th>
            <th>{text.admin.tableState}</th>
            <th>{text.admin.tableStatus}</th>
            <th>{text.admin.tableUpdated}</th>
            <th>{text.admin.tableActions}</th>
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
                  <Button variant="outline" onClick={() => policy.id && onEdit(policy.id)}>{editLabel || text.admin.edit}</Button>
                  {onApprove && policy.verificationStatus !== "approved" && (
                    <Button variant="secondary" onClick={() => onApprove(policy)}>{text.admin.approve}</Button>
                  )}
                  <Button variant="ghost" onClick={() => policy.id && onDelete(policy.id)}>{text.admin.delete}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {policies.length === 0 && <p className="admin-empty-state">{emptyMessage || text.admin.noPolicies}</p>}
    </div>
  );
}
