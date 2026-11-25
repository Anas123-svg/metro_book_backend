exports.health = (req, res) => {
  res.set("Cache-Control", "no-store").status(200).json({
    status: "ok", service: "MetroBook API", timestamp: new Date().toISOString(),
  });
};

exports.helloWorld = async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const missing = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"].filter(key => !process.env[key]);
    if (missing.length) {
      console.error("Missing database environment variables:", missing.join(", "));
      return res.status(503).json({ status: "unavailable", service: "MetroBook API", database: "disconnected", code: "DB_CONFIG_MISSING", timestamp: new Date().toISOString() });
    }
    const { sequelize } = require("../config/db");
    await sequelize.authenticate();
    return res.status(200).json({
      status: "ok", service: "MetroBook API", database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const cause = error.original || error.parent || error;
    const code = cause.code || error.code || "";
    console.error("Database health check failed:", error.name, code, error.message);
    const reason = code === "28P01" ? "DB_AUTH_FAILED"
      : ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH"].includes(code) ? "DB_NETWORK_ERROR"
      : ["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "DEPTH_ZERO_SELF_SIGNED_CERT", "CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID"].includes(code) ? "DB_TLS_ERROR"
      : code === "ENOENT" ? "DB_CERT_FILE_MISSING"
      : error.name === "SequelizeConnectionAcquireTimeoutError" ? "DB_TIMEOUT"
      : "DB_CONNECTION_FAILED";
    return res.status(503).json({
      status: "unavailable", service: "MetroBook API", database: "disconnected", code: reason,
      timestamp: new Date().toISOString(),
    });
  }
};
