const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const testRoutes = require("./routes/testRoutes");

app.disable("x-powered-by");
// Bearer-token authentication: allow all origins without cross-origin cookies.
app.use(cors({
  origin: "*",
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: false,
  maxAge: 86400,
  optionsSuccessStatus: 204,
}));

// Parse JSON bodies
app.use(express.json());

// -------------------- ROUTES --------------------
app.get("/", (req, res) => res.json({ service: "MetroBook API", status: "ok" }));
app.use("/api", testRoutes);
app.use(testRoutes);
// Initialize database-backed routes only when a business endpoint is requested.
// The root, liveness and OPTIONS endpoints must not depend on database or Stripe configuration.
let businessRoutes;
app.use((req, res, next) => {
  try {
    if (!businessRoutes) businessRoutes = require("./routes/businessRoutes");
  } catch (error) {
    console.error("Business route initialization failed:", error.stack || error);
    return res.status(503).json({ status: "unavailable", error: "BACKEND_INITIALIZATION_FAILED" });
  }
  return businessRoutes(req, res, next);
});
app.use((req, res) => res.status(404).json({ error: "NOT_FOUND" }));
app.use((error, req, res, next) => {
  console.error("Request failed:", error.name, error.code || "");
  if (res.headersSent) return next(error);
  const status = Number(error.status || error.statusCode);
  return res.status(status >= 400 && status < 500 ? status : 500).json({ error: "REQUEST_FAILED" });
});

// Vercel imports the Express app. Local execution opens a listener without requiring DB availability.
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;
