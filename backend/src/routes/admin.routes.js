import { Router } from "express";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { createAdminToken, isAdminConfigured, verifyAdminPassword } from "../services/adminAuthService.js";
import { createPolicy, deletePolicy, getAllPolicies, getPolicyById, updatePolicy } from "../services/policyDatabaseService.js";
import { auditExtractedPolicy } from "../services/policyExtractionAuditService.js";
import { createEmptyEditablePolicy, extractPolicyWithEvidence, flattenPolicyDraft } from "../services/policyExtractionService.js";
import { searchTrustedPolicySources } from "../services/serpapiService.js";
import { getLatestCacheForPreset, getSearchCache, saveSearchCacheEntry } from "../services/searchCacheService.js";
import { getSearchPresetById, getSearchPresets } from "../services/searchPresetService.js";
import { getSourceText } from "../services/webpageTextService.js";
import { calculateOverallConfidence } from "../utils/policyConfidence.js";
import { validatePolicy } from "../utils/validatePolicy.js";

const router = Router();
const MIN_EXTRACTABLE_TEXT_LENGTH = 220;

function extractionFailure(res, payload, source = {}) {
  const fallbackPolicy = createEmptyEditablePolicy({
    sourceUrl: source.sourceUrl || source.body?.sourceUrl || ""
  });
  const message = payload.message || "Extraction failed. Admin must review and complete the draft manually.";

  return res.json({
    success: false,
    stage: payload.stage,
    message,
    technicalHint: payload.technicalHint || "",
    suggestedAction: payload.suggestedAction || "Paste official portal text manually and retry.",
    canUsePastedTextFallback: payload.canUsePastedTextFallback ?? true,
    policyDraft: null,
    policy: fallbackPolicy,
    evidenceByField: {},
    confidence: {
      overallConfidence: 0,
      riskLevel: "high",
      needsAdminReview: true,
      autoApprovalEligible: false
    },
    warnings: [
      "Extraction failed. Admin must review and complete the draft manually."
    ],
    audit: {
      auditPassed: false,
      fieldIssues: [
        {
          field: "overall",
          severity: "high",
          issue: "Gemini audit was unavailable. Admin must cross-check all fields manually."
        }
      ],
      correctedWarnings: []
    },
    validation: {
      valid: false,
      errors: ["Policy draft requires manual completion."]
    }
  });
}

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

router.get("/policies/search-presets", requireAdminAuth, async (_req, res, next) => {
  try {
    res.json({ presets: await getSearchPresets() });
  } catch (error) {
    next(error);
  }
});

router.get("/policies/search-cache", requireAdminAuth, async (_req, res, next) => {
  try {
    res.json({ cache: await getSearchCache() });
  } catch (error) {
    next(error);
  }
});

router.get("/policies/search-cache/latest", requireAdminAuth, async (req, res, next) => {
  try {
    const presetId = req.query.presetId;
    if (!presetId) return res.status(400).json({ error: "presetId is required." });
    res.json({ cacheEntry: await getLatestCacheForPreset(presetId) });
  } catch (error) {
    next(error);
  }
});

router.post("/policies/search-serpapi", requireAdminAuth, async (req, res, next) => {
  try {
    const { presetId = "mof-benefit-hub", customQuery = "", forceRefresh = false } = req.body || {};
    const preset = await getSearchPresetById(presetId);
    if (!preset) return res.status(400).json({ error: "Search preset not found." });

    const query = presetId === "custom" ? customQuery.trim() : preset.query;
    if (!query) return res.status(400).json({ error: "Search query is required." });

    if (!forceRefresh) {
      const cached = await getLatestCacheForPreset(presetId, query);
      if (cached) {
        return res.json({
          source: "cache",
          usesSerpApiQuota: false,
          cacheId: cached.id,
          results: cached.results,
          cacheEntry: cached
        });
      }

      return res.json({
        source: "cache",
        usesSerpApiQuota: false,
        cacheId: "",
        results: [],
        message: "No saved results found. Run a new SerpAPI search to fetch live official sources."
      });
    }

    const results = await searchTrustedPolicySources(query);
    const cacheEntry = await saveSearchCacheEntry({ presetId, query, results, source: "serpapi" });

    res.json({
      source: "serpapi",
      usesSerpApiQuota: true,
      cacheId: cacheEntry.id,
      results,
      cacheEntry
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Search failed." });
  }
});

router.post("/policies/extract", requireAdminAuth, async (req, res, next) => {
  try {
    if (!req.body?.sourceUrl && !req.body?.rawText) {
      return extractionFailure(res, {
        stage: "source_fetch",
        message: "No extraction source was provided.",
        technicalHint: "sourceUrl or rawText is required.",
        suggestedAction: "Return to Import Policy and choose a result or paste official text again.",
        canUsePastedTextFallback: false
      }, { body: req.body });
    }

    const source = await getSourceText(req.body);
    if (req.body?.sourceUrl && !source.rawText) {
      return extractionFailure(res, {
        stage: "source_fetch",
        message: "This webpage could not be extracted automatically.",
        technicalHint: source.warnings.join(" ") || "Fetch returned no readable text.",
        suggestedAction: "Paste official portal text manually and retry.",
        canUsePastedTextFallback: true
      }, source);
    }

    if (source.rawText.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
      return extractionFailure(res, {
        stage: "text_cleaning",
        message: "The webpage did not contain enough readable policy text.",
        technicalHint: `Cleaned text length was ${source.rawText.length} characters.`,
        suggestedAction: "Use pasted official text instead.",
        canUsePastedTextFallback: true
      }, source);
    }

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
      success: true,
      policy,
      policyDraft: extraction.policyDraft,
      evidenceByField: policy.extractionMeta?.evidenceByField || {},
      audit,
      confidence,
      warnings,
      validation: {
        valid: validation.valid,
        errors: validation.errors
      }
    });
  } catch (error) {
    return extractionFailure(res, {
      stage: "gemini_extraction",
      message: "Policy extraction could not be completed.",
      technicalHint: error?.message || "Unexpected extraction error.",
      suggestedAction: "Try again, or paste official portal text manually and retry.",
      canUsePastedTextFallback: true
    }, { body: req.body });
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
