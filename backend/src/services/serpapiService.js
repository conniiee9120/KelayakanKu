// Admin-only SerpAPI search wrapper with trusted domain filtering.
const TRUSTED_DOMAINS = [
  "gov.my",
  "hasil.gov.my",
  "jkm.gov.my",
  "mohe.gov.my",
  "kwsp.gov.my",
  "perkeso.gov.my",
  "mykasih.com.my",
  "epetrol.gov.my",
  "bantuanrakyat.hasil.gov.my"
];

function getHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrusted(link) {
  const hostname = getHostname(link);
  return TRUSTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

export async function searchTrustedPolicySources(query) {
  if (!process.env.SERPAPI_KEY) {
    const error = new Error("SerpAPI key is not configured. You can use cached results or paste policy text manually.");
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: process.env.SERPAPI_KEY
  });

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

  if (!response.ok) {
    const error = new Error("SerpAPI search failed. Please try again later.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const organicResults = Array.isArray(data.organic_results) ? data.organic_results : [];

  return organicResults
    .filter((item) => item.link && isTrusted(item.link))
    .map((item) => ({
      title: item.title || "Untitled result",
      link: item.link,
      snippet: item.snippet || "",
      source: getHostname(item.link),
      trusted: true
    }));
}
