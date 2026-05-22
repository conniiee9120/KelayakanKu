import { useState } from "react";
import type { FormEvent } from "react";
import type { AdminPolicy } from "../../services/adminApi";
import { Button } from "../ui/Button";

const blankPolicy: AdminPolicy = {
  title: "",
  category: "Cash Aid",
  shortDescription: "",
  eligibilityRules: {
    citizenship: "Malaysian",
    maxHouseholdIncome: null,
    maxMonthlyIncome: null,
    states: ["All"],
    minAge: null,
    maxAge: null,
    employmentStatuses: [],
    requiresChildren: false,
    requiresDisability: false,
    requiresStudent: false,
    minDependents: 0,
    supportNeeds: []
  },
  requiredDocuments: [],
  nextSteps: [],
  officialUrl: "",
  sourceUrl: "",
  lastUpdated: new Date().toISOString().slice(0, 10),
  verificationStatus: "draft"
};

function splitList(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function joinList(value?: string[]) {
  return (value || []).join("\n");
}

function numberOrNull(value: string) {
  return value === "" ? null : Number(value);
}

export function createBlankPolicy() {
  return structuredClone(blankPolicy);
}

export function PolicyForm({ initialPolicy, onSubmit, submitLabel = "Save policy" }: {
  initialPolicy?: AdminPolicy;
  onSubmit: (policy: AdminPolicy) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [policy, setPolicy] = useState<AdminPolicy>(initialPolicy || createBlankPolicy());
  const [saving, setSaving] = useState(false);

  function update<K extends keyof AdminPolicy>(key: K, value: AdminPolicy[K]) {
    setPolicy((current) => ({ ...current, [key]: value }));
  }

  function updateRules(key: keyof AdminPolicy["eligibilityRules"], value: unknown) {
    setPolicy((current) => ({
      ...current,
      eligibilityRules: { ...current.eligibilityRules, [key]: value }
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(policy);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <span>Title</span>
          <input value={policy.title} onChange={(event) => update("title", event.target.value)} required />
        </label>
        <label className="form-field">
          <span>Category</span>
          <select value={policy.category} onChange={(event) => update("category", event.target.value)}>
            {["Cash Aid", "Food Aid", "Education Aid", "Housing Aid", "Employment Aid", "Healthcare Aid", "Contribution Support", "Household Support", "Other"].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="form-field wide">
          <span>Short description</span>
          <textarea value={policy.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} required />
        </label>
        <label className="form-field">
          <span>Max household income</span>
          <input type="number" value={policy.eligibilityRules.maxHouseholdIncome ?? ""} onChange={(event) => updateRules("maxHouseholdIncome", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Max monthly income</span>
          <input type="number" value={policy.eligibilityRules.maxMonthlyIncome ?? ""} onChange={(event) => updateRules("maxMonthlyIncome", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Minimum age</span>
          <input type="number" value={policy.eligibilityRules.minAge ?? ""} onChange={(event) => updateRules("minAge", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Maximum age</span>
          <input type="number" value={policy.eligibilityRules.maxAge ?? ""} onChange={(event) => updateRules("maxAge", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>States, one per line</span>
          <textarea value={joinList(policy.eligibilityRules.states)} onChange={(event) => updateRules("states", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Employment statuses, one per line</span>
          <textarea value={joinList(policy.eligibilityRules.employmentStatuses)} onChange={(event) => updateRules("employmentStatuses", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Support needs, one per line</span>
          <textarea value={joinList(policy.eligibilityRules.supportNeeds)} onChange={(event) => updateRules("supportNeeds", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Required documents, one per line</span>
          <textarea value={joinList(policy.requiredDocuments)} onChange={(event) => update("requiredDocuments", splitList(event.target.value))} />
        </label>
        <label className="form-field wide">
          <span>Next steps, one per line</span>
          <textarea value={joinList(policy.nextSteps)} onChange={(event) => update("nextSteps", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>Official URL</span>
          <input value={policy.officialUrl} onChange={(event) => update("officialUrl", event.target.value)} />
        </label>
        <label className="form-field">
          <span>Source URL</span>
          <input value={policy.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} />
        </label>
        <label className="form-field">
          <span>Verification status</span>
          <select value={policy.verificationStatus} onChange={(event) => update("verificationStatus", event.target.value as AdminPolicy["verificationStatus"])}>
            <option value="draft">draft</option>
            <option value="pending_review">pending_review</option>
            <option value="approved">approved</option>
          </select>
        </label>
        <div className="admin-checkboxes">
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresChildren} onChange={(event) => updateRules("requiresChildren", event.target.checked)} /> Requires children</label>
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresDisability} onChange={(event) => updateRules("requiresDisability", event.target.checked)} /> Requires disability status</label>
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresStudent} onChange={(event) => updateRules("requiresStudent", event.target.checked)} /> Requires student status</label>
        </div>
      </div>
      <div className="form-actions">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
