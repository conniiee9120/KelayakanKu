import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/translations.ts", import.meta.url), "utf8");
const moduleSource = source
  .replace(/export type Language = "en" \| "bm";/, "")
  .replace(/export const translations = /, "const translations = ")
  .replace(/;\s*$/, "\nreturn translations;");

const translations = new Function(moduleSource)();

function collectKeys(value, prefix = "") {
  if (Array.isArray(value) || typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => collectKeys(child, prefix ? `${prefix}.${key}` : key));
}

const enKeys = new Set(collectKeys(translations.en));
const bmKeys = new Set(collectKeys(translations.bm));
const missingInBm = [...enKeys].filter((key) => !bmKeys.has(key));
const missingInEn = [...bmKeys].filter((key) => !enKeys.has(key));

if (missingInBm.length || missingInEn.length) {
  console.error("Translation key mismatch found.");
  if (missingInBm.length) console.error("Missing in BM:", missingInBm.join(", "));
  if (missingInEn.length) console.error("Missing in EN:", missingInEn.join(", "));
  process.exit(1);
}

console.log(`Translation keys aligned (${enKeys.size} keys).`);
