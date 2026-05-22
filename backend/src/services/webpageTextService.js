// Fetches and cleans official webpage text for admin-only policy extraction.
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanPolicyText(text = "") {
  return stripHtml(text).slice(0, 30000);
}

export async function getSourceText({ sourceUrl = "", rawText = "" }) {
  if (rawText) {
    return {
      sourceUrl,
      rawText: cleanPolicyText(rawText),
      warnings: []
    };
  }

  if (!sourceUrl) {
    return {
      sourceUrl,
      rawText: "",
      warnings: ["No source URL or pasted text was provided."]
    };
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "KelayakanKuAdminBot/0.1"
      }
    });

    if (!response.ok) {
      return {
        sourceUrl,
        rawText: "",
        warnings: [`Could not fetch source URL. HTTP status ${response.status}.`]
      };
    }

    return {
      sourceUrl,
      rawText: cleanPolicyText(await response.text()),
      warnings: []
    };
  } catch {
    return {
      sourceUrl,
      rawText: "",
      warnings: ["Could not fetch source URL. Paste the policy text manually instead."]
    };
  }
}
