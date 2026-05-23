// JSON cache for admin SerpAPI searches so saved results can be reused.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_PATH = path.resolve(__dirname, "../data/serpapi-search-cache.json");

async function ensureCache() {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await writeFile(CACHE_PATH, "[]\n", "utf8");
    return [];
  }
}

export async function getSearchCache() {
  return ensureCache();
}

export async function saveSearchCache(cache) {
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  return cache;
}

export async function getCachedSearchById(id) {
  const cache = await getSearchCache();
  return cache.find((entry) => entry.id === id) || null;
}

export async function getLatestCacheForPreset(presetId, query = "") {
  const cache = await getSearchCache();
  return cache
    .filter((entry) => entry.presetId === presetId && (!query || entry.query === query))
    .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())[0] || null;
}

export async function saveSearchCacheEntry({ presetId, query, results, source = "serpapi" }) {
  const cache = await getSearchCache();
  const entry = {
    id: `cache-${Date.now()}`,
    presetId,
    query,
    searchedAt: new Date().toISOString(),
    source,
    results: Array.isArray(results) ? results : []
  };

  cache.unshift(entry);
  await saveSearchCache(cache.slice(0, 60));
  return entry;
}

export async function clearOldCacheEntries(limit = 60) {
  const cache = await getSearchCache();
  const nextCache = cache
    .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
    .slice(0, limit);
  await saveSearchCache(nextCache);
  return nextCache;
}
