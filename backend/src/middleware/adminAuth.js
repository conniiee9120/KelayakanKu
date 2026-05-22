import { verifyAdminToken } from "../services/adminAuthService.js";

export function requireAdminAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = verifyAdminToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  req.admin = decoded;
  next();
}
