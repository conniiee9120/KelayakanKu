import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRESETS_PATH = path.resolve(__dirname, "../data/search-presets.json");

export async function getSearchPresets() {
  const raw = await readFile(PRESETS_PATH, "utf8");
  return JSON.parse(raw);
}

export async function getSearchPresetById(id) {
  const presets = await getSearchPresets();
  return presets.find((preset) => preset.id === id) || null;
}
