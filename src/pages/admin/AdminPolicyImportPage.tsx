import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  getSearchCache,
  getSearchPresets,
  searchPolicySources,
  type SearchCacheEntry,
  type SearchPreset,
  type SearchResponse,
  type SearchResult
} from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

const EXTRACTION_PAYLOAD_KEY = "kelayakanku_admin_extraction_payload";

interface ExtractionPayload {
  sourceType: "url" | "rawText";
  sourceUrl?: string;
  rawText?: string;
  title?: string;
  snippet?: string;
  source?: string;
}

function saveExtractionPayload(payload: ExtractionPayload) {
  sessionStorage.setItem(EXTRACTION_PAYLOAD_KEY, JSON.stringify(payload));
  navigate("/admin/policy-import/extract");
}

export function AdminPolicyImportPage() {
  const { language, text } = useLanguage();
  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const [presetId, setPresetId] = useState("general-b40");
  const [customQuery, setCustomQuery] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [cache, setCache] = useState<SearchCacheEntry[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");
  const [extractingLink, setExtractingLink] = useState("");
  const [showEmptyCache, setShowEmptyCache] = useState(false);

  useEffect(() => {
    Promise.all([getSearchPresets(), getSearchCache()])
      .then(([presetResponse, cacheResponse]) => {
        setPresets(presetResponse.presets);
        setCache(cacheResponse.cache);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : text.admin.overviewError));
  }, []);

  const selectedPreset = useMemo(() => presets.find((preset) => preset.id === presetId), [presetId, presets]);
  const activeQuery = presetId === "custom" ? customQuery : selectedPreset?.query || "";

  async function refreshCache() {
    const response = await getSearchCache();
    setCache(response.cache);
  }

  async function handleSearch(forceRefresh: boolean) {
    setMessage("");
    setShowEmptyCache(false);
    setSearchMeta(null);

    if (forceRefresh && !window.confirm(text.admin.quotaConfirm)) return;

    setLoading(forceRefresh ? text.admin.runningSearch : text.admin.loadingSaved);
    try {
      const response = await searchPolicySources({ presetId, customQuery, forceRefresh });
      setSearchMeta(response);
      setResults(response.results);
      await refreshCache();

      if (!forceRefresh && response.results.length === 0) {
        setShowEmptyCache(true);
        setMessage(response.message || text.admin.noSavedBody);
      } else if (response.results.length === 0) {
        setMessage(text.admin.noTrustedResults);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.admin.searchFailed);
    } finally {
      setLoading("");
    }
  }

  function loadCacheEntry(entry: SearchCacheEntry) {
    setResults(entry.results);
    setPresetId(entry.presetId);
    setShowEmptyCache(false);
    setSearchMeta({
      source: "cache",
      usesSerpApiQuota: false,
      cacheId: entry.id,
      results: entry.results,
      cacheEntry: entry
    });
    setMessage(text.admin.loadedCache);
  }

  function startUrlExtraction(result: SearchResult) {
    if (extractingLink) return;
    setExtractingLink(result.link);
    saveExtractionPayload({
      sourceType: "url",
      sourceUrl: result.link,
      title: result.title,
      snippet: result.snippet,
      source: result.source
    });
  }

  function startPastedTextExtraction() {
    if (!rawText.trim()) {
      setMessage(text.admin.pasteBeforeExtraction);
      return;
    }

    saveExtractionPayload({
      sourceType: "rawText",
      sourceUrl: sourceUrl.trim() || undefined,
      rawText
    });
  }

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>{text.admin.importPolicy}</h2>
          <p>{text.admin.importDesc}</p>
        </div>
      </div>

      <Card className="stack">
        <span className="badge badge-info">{text.admin.step1}</span>
        <label className="form-field">
          <span>{text.admin.chooseCategory}</span>
          <select value={presetId} onChange={(event) => setPresetId(event.target.value)}>
            {presets.map((preset) => <option key={preset.id} value={preset.id}>{language === "bm" && preset.labelBm ? preset.labelBm : preset.label}</option>)}
          </select>
        </label>
        {selectedPreset && <p className="field-helper">{language === "bm" && selectedPreset.descriptionBm ? selectedPreset.descriptionBm : selectedPreset.description}</p>}
        <label className="form-field">
          <span>{text.admin.queryPreview}</span>
          {presetId === "custom" ? (
            <textarea value={customQuery} onChange={(event) => setCustomQuery(event.target.value)} placeholder={text.admin.customQueryPlaceholder} />
          ) : (
            <textarea value={activeQuery} readOnly />
          )}
        </label>
      </Card>

      <Card className="stack">
        <span className="badge badge-info">{text.admin.step2}</span>
        <div className="admin-review-grid">
          <Card className="soft-info">
            <h3>{text.admin.loadSaved}</h3>
            <p>{text.admin.savedNoQuota}</p>
            <Button variant="secondary" disabled={Boolean(loading)} onClick={() => handleSearch(false)}>{text.admin.loadSaved}</Button>
          </Card>
          <Card className="soft-info">
            <h3>{text.admin.runSearch}</h3>
            <p>{text.admin.liveQuota}</p>
            <Button disabled={Boolean(loading)} onClick={() => handleSearch(true)}>{text.admin.runSearch}</Button>
          </Card>
        </div>
        {loading && <p>{loading}</p>}
        {message && <div className="disclaimer-banner">{message}</div>}
        {searchMeta && searchMeta.results.length > 0 && (
          <span className={`badge ${searchMeta.source === "cache" ? "badge-info" : "badge-warning"}`}>
            {searchMeta.source === "cache" ? text.admin.cacheSource : text.admin.liveSource}
          </span>
        )}
      </Card>

      {showEmptyCache && (
        <Card className="empty-state">
          <h2>{text.admin.noSavedTitle}</h2>
          <p>{text.admin.noSavedBody}</p>
          <div className="button-row">
            <Button onClick={() => handleSearch(true)}>{text.admin.runSearch}</Button>
            <Button variant="outline" onClick={() => document.getElementById("paste-official-text")?.scrollIntoView({ behavior: "smooth" })}>{text.admin.pasteInstead}</Button>
          </div>
        </Card>
      )}

      <Card className="stack">
        <span className="badge badge-info">{text.admin.savedCache}</span>
        <h2>{text.admin.savedResults}</h2>
        <p>{text.admin.reuseResults}</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.admin.searchCategory}</th>
                <th>{text.admin.query}</th>
                <th>{text.admin.date}</th>
                <th>{text.admin.results}</th>
                <th>{text.admin.action}</th>
              </tr>
            </thead>
            <tbody>
              {cache.map((entry) => (
                <tr key={entry.id}>
                  <td>{(() => {
                    const preset = presets.find((item) => item.id === entry.presetId);
                    return preset ? (language === "bm" && preset.labelBm ? preset.labelBm : preset.label) : entry.presetId;
                  })()}</td>
                  <td>{entry.query}</td>
                  <td>{new Date(entry.searchedAt).toLocaleString()}</td>
                  <td>{entry.results.length}</td>
                  <td><Button variant="outline" onClick={() => loadCacheEntry(entry)}>{text.admin.loadResults}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {cache.length === 0 && <p>{text.admin.noSavedSearches}</p>}
        </div>
      </Card>

      <Card className="stack">
        <span className="badge badge-info">{text.admin.step3}</span>
        <h2>{text.admin.searchResults}</h2>
        <p>{text.admin.extractNoSerpApi}</p>
        {results.map((result) => (
          <Card key={result.link} className="soft-info">
            <h3>{result.title}</h3>
            <p>{result.snippet}</p>
            <p><strong>{result.source}</strong></p>
            <div className="button-row">
              <a className="btn btn-outline" href={result.link} target="_blank" rel="noreferrer">{text.admin.openPortal}</a>
              <Button variant="outline" disabled={Boolean(extractingLink)} onClick={() => startUrlExtraction(result)}>
                {extractingLink === result.link ? text.admin.openingReview : text.admin.extractPolicy}
              </Button>
            </div>
          </Card>
        ))}
        {results.length === 0 && <p>{text.admin.noResultsLoaded}</p>}
      </Card>

      <Card id="paste-official-text" className="stack">
        <span className="badge badge-warning">{text.admin.fallbackOption}</span>
        <h2>{text.admin.pasteTitle}</h2>
        <p>{text.admin.pasteDesc}</p>
        <p>{text.admin.scraperLimit}</p>
        <label className="form-field">
          <span>{text.admin.sourceUrlOptional}</span>
          <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder={text.admin.sourceUrlPlaceholder} />
        </label>
        <label className="form-field">
          <span>{text.admin.officialText}</span>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={text.admin.officialTextPlaceholder} />
        </label>
        <Button variant="secondary" disabled={Boolean(extractingLink)} onClick={startPastedTextExtraction}>{text.admin.extractFromText}</Button>
      </Card>
    </AdminLayout>
  );
}
