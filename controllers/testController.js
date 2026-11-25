const { sequelize } = require("../config/db");

exports.health = (req, res) => {
  res.set("Cache-Control", "no-store").status(200).json({
    status: "ok", service: "MetroBook API", timestamp: new Date().toISOString(),
  });
};

exports.helloWorld = async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      status: "ok", service: "MetroBook API", database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error.name, error.code || error.original?.code || "");
    return res.status(503).json({
      status: "unavailable", service: "MetroBook API", database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
};
