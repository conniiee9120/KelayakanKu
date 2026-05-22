// Admin API client. Tokens stay in sessionStorage and are sent only to the backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADMIN_TOKEN_KEY = "kelayakankuAdminToken";

export interface AdminPolicy {
  id?: string;
  title: string;
  category: string;
  shortDescription: string;
  eligibilityRules: {
    citizenship: string;
    maxHouseholdIncome: number | null;
    maxMonthlyIncome: number | null;
    states: string[];
    minAge: number | null;
    maxAge: number | null;
    employmentStatuses: string[];
    requiresChildren: boolean;
    requiresDisability: boolean;
    requiresStudent: boolean;
    minDependents?: number;
    supportNeeds?: string[];
    housingStatuses?: string[];
  };
  requiredDocuments: string[];
  nextSteps: string[];
  officialUrl: string;
  sourceUrl: string;
  lastUpdated: string;
  verificationStatus: "draft" | "pending_review" | "approved";
  applicationDeadline?: string | null;
  extractionMeta?: {
    overallConfidence: number;
    riskLevel: "low" | "medium" | "high";
    evidenceByField: Record<string, FieldEvidence>;
    auditIssues: AuditIssue[];
    warnings: string[];
  };
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  trusted: boolean;
}

export interface FieldEvidence {
  evidence: string;
  confidence: number;
  status: "confirmed" | "uncertain" | "missing" | "conflicting";
}

export interface DraftField<T = unknown> extends FieldEvidence {
  value: T;
}

export interface PolicyDraft {
  id: DraftField<string>;
  title: DraftField<string>;
  category: DraftField<string>;
  shortDescription: DraftField<string>;
  eligibilityRules: {
    citizenship: DraftField<string>;
    maxHouseholdIncome: DraftField<number | null>;
    maxMonthlyIncome: DraftField<number | null>;
    states: DraftField<string[]>;
    minAge: DraftField<number | null>;
    maxAge: DraftField<number | null>;
    employmentStatuses: DraftField<string[]>;
    requiresChildren: DraftField<boolean>;
    requiresDisability: DraftField<boolean>;
    requiresStudent: DraftField<boolean>;
  };
  requiredDocuments: DraftField<string[]>;
  nextSteps: DraftField<string[]>;
  officialUrl: DraftField<string>;
  sourceUrl: DraftField<string>;
  applicationDeadline: DraftField<string | null>;
}

export interface AuditIssue {
  field: string;
  issue: string;
  severity: "low" | "medium" | "high";
}

export interface ExtractionResponse {
  policy: AdminPolicy;
  policyDraft: PolicyDraft;
  audit: {
    auditPassed: boolean;
    fieldIssues: AuditIssue[];
    correctedWarnings: string[];
  };
  confidence: {
    overallConfidence: number;
    riskLevel: "low" | "medium" | "high";
    needsAdminReview: boolean;
    autoApprovalEligible: false;
  };
  warnings: string[];
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) clearAdminToken();

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.errors?.join(" ") || body?.error || "Admin request failed.");
  }

  return response.json() as Promise<T>;
}

export async function loginAdmin(password: string) {
  const result = await adminRequest<{ token: string; message: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
  saveAdminToken(result.token);
  return result;
}

export function getAdminMe() {
  return adminRequest<{ authenticated: boolean; role: string }>("/api/admin/me");
}

export function getAdminPolicies() {
  return adminRequest<AdminPolicy[]>("/api/admin/policies");
}

export function createAdminPolicy(policy: AdminPolicy) {
  return adminRequest<AdminPolicy>("/api/admin/policies", {
    method: "POST",
    body: JSON.stringify(policy)
  });
}

export function updateAdminPolicy(id: string, policy: AdminPolicy) {
  return adminRequest<AdminPolicy>(`/api/admin/policies/${id}`, {
    method: "PUT",
    body: JSON.stringify(policy)
  });
}

export function deleteAdminPolicy(id: string) {
  return adminRequest<{ message: string }>(`/api/admin/policies/${id}`, {
    method: "DELETE"
  });
}

export function searchPolicySources(query: string) {
  return adminRequest<{ results: SearchResult[] }>("/api/admin/policies/search-serpapi", {
    method: "POST",
    body: JSON.stringify({ query })
  });
}

export function extractPolicy(payload: { sourceUrl?: string; rawText?: string }) {
  return adminRequest<ExtractionResponse>("/api/admin/policies/extract", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function approvePolicy(policy: AdminPolicy) {
  return adminRequest<AdminPolicy>("/api/admin/policies/approve", {
    method: "POST",
    body: JSON.stringify(policy)
  });
}
