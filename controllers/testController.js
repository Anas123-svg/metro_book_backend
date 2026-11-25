const { pool } = require("../config/db");

exports.helloWorld = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      message: "Hello World from MetroBooks Backend",
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
};