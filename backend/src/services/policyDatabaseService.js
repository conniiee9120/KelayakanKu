// JSON policy database helpers used by public and admin routes.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POLICIES_PATH = path.resolve(__dirname, "../data/policies.json");

function slugify(value) {
  return String(value || "policy")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getAllPolicies() {
  const raw = await readFile(POLICIES_PATH, "utf8");
  return JSON.parse(raw);
}

export async function getPublicPolicies() {
  const policies = await getAllPolicies();
  return policies.filter((policy) => policy.verificationStatus === "approved");
}

export async function savePolicies(policies) {
  await writeFile(POLICIES_PATH, `${JSON.stringify(policies, null, 2)}\n`, "utf8");
  return policies;
}

export async function getPolicyById(id) {
  const policies = await getAllPolicies();
  return policies.find((policy) => policy.id === id) || null;
}

export async function createPolicy(policy) {
  const policies = await getAllPolicies();
  const baseId = slugify(policy.id || policy.title);
  let id = baseId;
  let counter = 2;

  while (policies.some((item) => item.id === id)) {
    id = `${baseId}-${counter}`;
    counter += 1;
  }

  const created = {
    ...policy,
    id,
    lastUpdated: policy.lastUpdated || new Date().toISOString().slice(0, 10)
  };

  policies.push(created);
  await savePolicies(policies);
  return created;
}

export async function updatePolicy(id, updates) {
  const policies = await getAllPolicies();
  const index = policies.findIndex((policy) => policy.id === id);

  if (index === -1) return null;

  const updated = {
    ...policies[index],
    ...updates,
    id,
    lastUpdated: updates.lastUpdated || new Date().toISOString().slice(0, 10)
  };

  policies[index] = updated;
  await savePolicies(policies);
  return updated;
}

export async function deletePolicy(id) {
  const policies = await getAllPolicies();
  const nextPolicies = policies.filter((policy) => policy.id !== id);

  if (nextPolicies.length === policies.length) return false;

  await savePolicies(nextPolicies);
  return true;
}
