import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/admin.routes.js";
import eligibilityRoutes from "./routes/eligibility.routes.js";
import explanationRoutes from "./routes/explanation.routes.js";
import healthRoutes from "./routes/health.routes.js";
import policiesRoutes from "./routes/policies.routes.js";

dotenv.config();

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/policies", policiesRoutes);
app.use("/api/eligibility", eligibilityRoutes);
app.use("/api/explanation", explanationRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
