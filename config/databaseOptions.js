const fs = require("node:fs");
require("dotenv").config();

const host = process.env.DB_HOST || "localhost";
const sslEnabled = process.env.DB_SSL === undefined
  ? host.endsWith(".supabase.com") || host.endsWith(".supabase.co")
  : process.env.DB_SSL.toLowerCase() === "true";

const ssl = sslEnabled ? { rejectUnauthorized: true } : null;
if (ssl && process.env.DB_SSL_CA) {
  ssl.ca = process.env.DB_SSL_CA.replace(/\\n/g, "\n");
} else if (ssl && process.env.DB_SSL_CA_PATH) {
  ssl.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH, "utf8");
}

module.exports = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host,
  port: Number(process.env.DB_PORT || 5432),
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    connectionTimeoutMillis: 5000,
    ...(ssl ? { ssl } : {}),
  },
  pool: { max: 2, min: 0, acquire: 10000, idle: 5000 },
};
