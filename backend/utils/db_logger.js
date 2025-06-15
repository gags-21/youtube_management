const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or your manual config
});

const logToDatabase = async (level, message, metadata = {}) => {
  try {
    await pool.query(`INSERT INTO logs (event_type, details) VALUES ($1, $2)`, [
      level,
      { message, ...metadata },
    ]);
  } catch (err) {
    console.error("Failed to log to DB:", err.message);
  }
};

module.exports = {
  info: (msg, meta) => logToDatabase("info", msg, meta),
  warn: (msg, meta) => logToDatabase("warn", msg, meta),
  error: (msg, meta) => logToDatabase("error", msg, meta),
};
