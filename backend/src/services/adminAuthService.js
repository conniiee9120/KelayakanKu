// Simple signed-token admin auth for the MVP admin area.
import jwt from "jsonwebtoken";

const TOKEN_TTL = "8h";

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_TOKEN_SECRET);
}

export function verifyAdminPassword(password) {
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export function createAdminToken() {
  if (!process.env.ADMIN_TOKEN_SECRET) {
    throw new Error("ADMIN_TOKEN_SECRET is not configured.");
  }

  return jwt.sign({ role: "admin" }, process.env.ADMIN_TOKEN_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyAdminToken(token) {
  if (!process.env.ADMIN_TOKEN_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET);
    return decoded?.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}
