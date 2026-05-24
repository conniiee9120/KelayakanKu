import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AdminPolicy } from "../../services/adminApi";
import { useLanguage } from "../../context/LanguageContext";
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

export function PolicyForm({ initialPolicy, onSubmit, submitLabel = "Save policy", secondaryLabel, onSecondarySubmit, primaryDisabled = false, requiresManualVerification = false }: {
  initialPolicy?: AdminPolicy;
  onSubmit: (policy: AdminPolicy, options?: { manualVerificationConfirmed?: boolean }) => Promise<void> | void;
  submitLabel?: string;
  secondaryLabel?: string;
  onSecondarySubmit?: (policy: AdminPolicy) => Promise<void> | void;
  primaryDisabled?: boolean;
  requiresManualVerification?: boolean;
}) {
  const { text } = useLanguage();
  const [policy, setPolicy] = useState<AdminPolicy>(initialPolicy || createBlankPolicy());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [manualVerified, setManualVerified] = useState(false);

  useEffect(() => {
    setPolicy(initialPolicy || createBlankPolicy());
    setErrors([]);
    setManualVerified(false);
  }, [initialPolicy]);

  function update<K extends keyof AdminPolicy>(key: K, value: AdminPolicy[K]) {
    setPolicy((current) => ({ ...current, [key]: value }));
  }

  function updateRules(key: keyof AdminPolicy["eligibilityRules"], value: unknown) {
    setPolicy((current) => ({
      ...current,
      eligibilityRules: { ...current.eligibilityRules, [key]: value }
    }));
  }

  function validateDraft(current: AdminPolicy) {
    const nextErrors: string[] = [];
    if (!current.title.trim()) nextErrors.push(text.admin.validationTitle);
    if (!current.category.trim()) nextErrors.push(text.admin.validationCategory);
    if (!current.shortDescription.trim()) nextErrors.push(text.admin.validationDescription);
    if (!current.eligibilityRules) nextErrors.push(text.admin.validationRules);
    if (!Array.isArray(current.requiredDocuments)) nextErrors.push(text.admin.validationDocuments);
    if (!Array.isArray(current.nextSteps)) nextErrors.push(text.admin.validationNextSteps);
    return nextErrors;
  }

  async function saveWithValidation(handler: (policy: AdminPolicy) => Promise<void> | void) {
    const nextErrors = validateDraft(policy);
    setErrors(nextErrors);
    if (nextErrors.length) return;

    setSaving(true);
    try {
      await handler(policy);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await saveWithValidation((nextPolicy) => onSubmit(nextPolicy, {
      manualVerificationConfirmed: requiresManualVerification ? manualVerified : undefined
    }));
  }

  async function handleSecondarySubmit() {
    if (!onSecondarySubmit) return;
    await saveWithValidation(onSecondarySubmit);
  }

  return (
    <form className="card admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <span>{text.admin.formTitle}</span>
          <input value={policy.title} onChange={(event) => update("title", event.target.value)} required />
        </label>
        <label className="form-field">
          <span>{text.admin.formCategory}</span>
          <select value={policy.category} onChange={(event) => update("category", event.target.value)}>
            {["Cash Aid", "Food Aid", "Education Aid", "Housing Aid", "Employment Aid", "Healthcare Aid", "Contribution Support", "Household Support", "Other"].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="form-field wide">
          <span>{text.admin.formDescription}</span>
          <textarea value={policy.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} required />
        </label>
        <label className="form-field">
          <span>{text.admin.formMaxHouseholdIncome}</span>
          <input type="number" value={policy.eligibilityRules.maxHouseholdIncome ?? ""} onChange={(event) => updateRules("maxHouseholdIncome", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formMaxMonthlyIncome}</span>
          <input type="number" value={policy.eligibilityRules.maxMonthlyIncome ?? ""} onChange={(event) => updateRules("maxMonthlyIncome", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formMinAge}</span>
          <input type="number" value={policy.eligibilityRules.minAge ?? ""} onChange={(event) => updateRules("minAge", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formMaxAge}</span>
          <input type="number" value={policy.eligibilityRules.maxAge ?? ""} onChange={(event) => updateRules("maxAge", numberOrNull(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formStates}</span>
          <textarea value={joinList(policy.eligibilityRules.states)} onChange={(event) => updateRules("states", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formEmployment}</span>
          <textarea value={joinList(policy.eligibilityRules.employmentStatuses)} onChange={(event) => updateRules("employmentStatuses", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formSupportNeeds}</span>
          <textarea value={joinList(policy.eligibilityRules.supportNeeds)} onChange={(event) => updateRules("supportNeeds", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formDocuments}</span>
          <textarea value={joinList(policy.requiredDocuments)} onChange={(event) => update("requiredDocuments", splitList(event.target.value))} />
        </label>
        <label className="form-field wide">
          <span>{text.admin.formNextSteps}</span>
          <textarea value={joinList(policy.nextSteps)} onChange={(event) => update("nextSteps", splitList(event.target.value))} />
        </label>
        <label className="form-field">
          <span>{text.admin.formOfficialUrl}</span>
          <input value={policy.officialUrl} onChange={(event) => update("officialUrl", event.target.value)} />
        </label>
        <label className="form-field">
          <span>{text.admin.formSourceUrl}</span>
          <input value={policy.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} />
        </label>
        <label className="form-field">
          <span>{text.admin.formVerification}</span>
          <select value={policy.verificationStatus} onChange={(event) => update("verificationStatus", event.target.value as AdminPolicy["verificationStatus"])}>
            <option value="draft">draft</option>
            <option value="pending_review">pending_review</option>
            <option value="approved">approved</option>
          </select>
        </label>
        <div className="admin-checkboxes">
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresChildren} onChange={(event) => updateRules("requiresChildren", event.target.checked)} /> {text.admin.requiresChildren}</label>
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresDisability} onChange={(event) => updateRules("requiresDisability", event.target.checked)} /> {text.admin.requiresDisability}</label>
          <label><input type="checkbox" checked={policy.eligibilityRules.requiresStudent} onChange={(event) => updateRules("requiresStudent", event.target.checked)} /> {text.admin.requiresStudent}</label>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="form-error" role="alert">
          {errors.map((item) => <p key={item}>{item}</p>)}
        </div>
      )}
      {requiresManualVerification && (
        <label className="admin-manual-check">
          <input
            type="checkbox"
            checked={manualVerified}
            onChange={(event) => setManualVerified(event.target.checked)}
          />
          I have manually verified this policy against the official source.
        </label>
      )}
      <div className="form-actions">
        {secondaryLabel && onSecondarySubmit && (
          <Button type="button" variant="outline" disabled={saving} onClick={handleSecondarySubmit}>
            {secondaryLabel}
          </Button>
        )}
        <Button type="submit" disabled={saving || primaryDisabled || (requiresManualVerification && !manualVerified)}>{saving ? text.admin.saving : submitLabel}</Button>
      </div>
    </form>
  );
}
