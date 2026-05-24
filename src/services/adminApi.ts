// Admin API client. Tokens stay in sessionStorage and are sent only to the backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADMIN_TOKEN_KEY = "kelayakanku_admin_token";
const LEGACY_ADMIN_TOKEN_KEY = "kelayakankuAdminToken";

export class AdminApiError extends Error {
  status: number;
  stage?: string;
  technicalHint?: string;
  suggestedAction?: string;
  canUsePastedTextFallback?: boolean;

  constructor(message: string, status: number, details: Partial<AdminApiError> = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.stage = details.stage;
    this.technicalHint = details.technicalHint;
    this.suggestedAction = details.suggestedAction;
    this.canUsePastedTextFallback = details.canUsePastedTextFallback;
  }
}

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
    auditStatus?: "completed" | "unavailable";
    auditSummary?: string;
    auditReason?: string;
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

export interface SearchPreset {
  id: string;
  label: string;
  labelBm?: string;
  description: string;
  descriptionBm?: string;
  query: string;
}

export interface SearchCacheEntry {
  id: string;
  presetId: string;
  query: string;
  searchedAt: string;
  source: string;
  results: SearchResult[];
}

export interface SearchResponse {
  source: "cache" | "serpapi";
  usesSerpApiQuota: boolean;
  cacheId: string;
  results: SearchResult[];
  cacheEntry?: SearchCacheEntry;
  message?: string;
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
  suggestion?: string;
}

export interface ExtractionAudit {
  status?: "completed" | "unavailable";
  auditPassed: boolean;
  summary?: string;
  fieldIssues: AuditIssue[];
  warnings?: string[];
  correctedWarnings?: string[];
  needsManualReview?: boolean;
  reason?: "quota_exceeded" | "missing_api_key" | "invalid_json" | "gemini_request_failed" | "unknown";
}

export interface ExtractionResponse {
  success: boolean;
  stage?: string;
  message?: string;
  technicalHint?: string;
  suggestedAction?: string;
  canUsePastedTextFallback?: boolean;
  policy: AdminPolicy;
  policyDraft: PolicyDraft | null;
  evidenceByField: Record<string, FieldEvidence>;
  audit: ExtractionAudit;
  confidence?: {
    overallConfidence: number;
    riskLevel: "low" | "medium" | "high";
    needsAdminReview: boolean;
    autoApprovalEligible: false;
    confidenceBreakdown?: {
      fieldCompleteness: number;
      evidenceCoverage: number;
      auditScore: number;
      validationScore: number;
      warningPenalty: number;
    };
  };
  warnings: string[];
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  sessionStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
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

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      clearAdminToken();
      const loginMessage = path === "/api/admin/login"
        ? "Invalid admin password."
        : "Unauthorized. Please log in again.";
      throw new AdminApiError(loginMessage, response.status, body || {});
    }

    if (response.status === 503 && path === "/api/admin/login") {
      throw new AdminApiError("Admin login is not configured. Please check backend/.env.", response.status, body || {});
    }

    throw new AdminApiError(
      body?.message || body?.errors?.join(" ") || body?.error || `Admin request failed. HTTP ${response.status}.`,
      response.status,
      body || {}
    );
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

export function getSearchPresets() {
  return adminRequest<{ presets: SearchPreset[] }>("/api/admin/policies/search-presets");
}

export function searchPolicySources(payload: { presetId: string; customQuery?: string; forceRefresh: boolean }) {
  return adminRequest<SearchResponse>("/api/admin/policies/search-serpapi", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSearchCache() {
  return adminRequest<{ cache: SearchCacheEntry[] }>("/api/admin/policies/search-cache");
}

export function getLatestSearchCache(presetId: string) {
  return adminRequest<{ cacheEntry: SearchCacheEntry | null }>(`/api/admin/policies/search-cache/latest?presetId=${encodeURIComponent(presetId)}`);
}

export function extractPolicy(payload: { sourceUrl?: string; rawText?: string }) {
  return adminRequest<ExtractionResponse>("/api/admin/policies/extract", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function approvePolicy(policy: AdminPolicy, options: { manualVerificationConfirmed?: boolean } = {}) {
  return adminRequest<AdminPolicy>("/api/admin/policies/approve", {
    method: "POST",
    body: JSON.stringify({ ...policy, ...options })
  });
}

export function savePolicyDraft(policy: AdminPolicy) {
  return createAdminPolicy({ ...policy, verificationStatus: "draft" });
}
