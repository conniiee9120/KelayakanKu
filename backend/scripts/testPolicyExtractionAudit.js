import assert from "node:assert/strict";
import { auditResultFromGeminiResult } from "../src/services/policyExtractionAuditService.js";

const completed = auditResultFromGeminiResult({
  text: JSON.stringify({
    auditPassed: true,
    summary: "Audit completed.",
    fieldIssues: [],
    warnings: []
  }),
  reason: ""
});
assert.equal(completed.status, "completed");
assert.equal(completed.auditPassed, true);
assert.equal(completed.fieldIssues.length, 0);

const unavailable = auditResultFromGeminiResult({ text: "", reason: "quota_exceeded" });
assert.equal(unavailable.status, "unavailable");
assert.equal(unavailable.reason, "quota_exceeded");
assert.equal(unavailable.fieldIssues[0].field, "overall");
assert.equal(unavailable.fieldIssues[0].severity, "high");

const missingKey = auditResultFromGeminiResult({ text: "", reason: "not_configured" }, { missingApiKey: true });
assert.equal(missingKey.status, "unavailable");
assert.equal(missingKey.reason, "missing_api_key");

const quota = auditResultFromGeminiResult({ text: "", reason: "quota_exceeded" });
assert.equal(quota.reason, "quota_exceeded");

const invalidJson = auditResultFromGeminiResult({ text: "{not valid json", reason: "" });
assert.equal(invalidJson.status, "unavailable");
assert.equal(invalidJson.reason, "invalid_json");

console.log("Policy extraction audit tests passed.");
