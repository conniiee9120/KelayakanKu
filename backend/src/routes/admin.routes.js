import { Router } from "express";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { createAdminToken, isAdminConfigured, verifyAdminPassword } from "../services/adminAuthService.js";
import { createPolicy, deletePolicy, getAllPolicies, getPolicyById, updatePolicy } from "../services/policyDatabaseService.js";
import { auditExtractedPolicy } from "../services/policyExtractionAuditService.js";
import { extractPolicyWithEvidence, flattenPolicyDraft } from "../services/policyExtractionService.js";
import { searchTrustedPolicySources } from "../services/serpapiService.js";
import { getSourceText } from "../services/webpageTextService.js";
import { calculateOverallConfidence } from "../utils/policyConfidence.js";
import { validatePolicy } from "../utils/validatePolicy.js";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body || {};

  if (!isAdminConfigured()) {
    return res.status(503).json({ error: "Admin login is not configured yet." });
  }

  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ error: "Invalid admin password" });
  }

  res.json({
    token: createAdminToken(),
    message: "Admin login successful"
  });
});

router.get("/me", requireAdminAuth, (_req, res) => {
  res.json({ authenticated: true, role: "admin" });
});

router.get("/policies", requireAdminAuth, async (_req, res, next) => {
  try {
    res.json(await getAllPolicies());
  } catch (error) {
    next(error);
  }
});

router.post("/policies", requireAdminAuth, async (req, res, next) => {
  try {
    const validation = validatePolicy(req.body);
    if (!validation.valid) return res.status(400).json({ errors: validation.errors });
    res.status(201).json(await createPolicy(validation.policy));
  } catch (error) {
    next(error);
  }
});

router.put("/policies/:id", requireAdminAuth, async (req, res, next) => {
  try {
    const validation = validatePolicy(req.body);
    if (!validation.valid) return res.status(400).json({ errors: validation.errors });

    const updated = await updatePolicy(req.params.id, validation.policy);
    if (!updated) return res.status(404).json({ error: "Policy not found." });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/policies/:id", requireAdminAuth, async (req, res, next) => {
  try {
    const deleted = await deletePolicy(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Policy not found." });
    res.json({ message: "Policy deleted successfully." });
  } catch (error) {
    next(error);
  }
});

router.post("/policies/search-serpapi", requireAdminAuth, async (req, res, next) => {
  try {
    const { query } = req.body || {};
    if (!query) return res.status(400).json({ error: "Search query is required." });
    res.json({ results: await searchTrustedPolicySources(query) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Search failed." });
  }
});

router.post("/policies/extract", requireAdminAuth, async (req, res, next) => {
  try {
    if (!req.body?.sourceUrl && !req.body?.rawText) {
      return res.status(400).json({ error: "sourceUrl or rawText is required." });
    }

    const source = await getSourceText(req.body);
    const extraction = await extractPolicyWithEvidence(source);
    const audit = await auditExtractedPolicy({
      rawText: source.rawText,
      extractedPolicy: extraction.policyDraft
    });
    const confidence = calculateOverallConfidence(extraction.policyDraft, audit);
    const warnings = [
      ...source.warnings,
      ...extraction.warnings,
      ...(audit.correctedWarnings || [])
    ];
    const policy = flattenPolicyDraft(extraction.policyDraft, { confidence, audit, warnings });
    const validation = validatePolicy(policy);

    res.json({
      policy,
      policyDraft: extraction.policyDraft,
      audit,
      confidence,
      warnings,
      validation: {
        valid: validation.valid,
        errors: validation.errors
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/policies/approve", requireAdminAuth, async (req, res, next) => {
  try {
    const validation = validatePolicy({
      ...req.body,
      verificationStatus: "approved"
    });
    if (!validation.valid) return res.status(400).json({ errors: validation.errors });

    const existing = validation.policy.id ? await getPolicyById(validation.policy.id) : null;
    const saved = existing
      ? await updatePolicy(validation.policy.id, validation.policy)
      : await createPolicy(validation.policy);

    res.status(existing ? 200 : 201).json(saved);
  } catch (error) {
    next(error);
  }
});

export default router;
