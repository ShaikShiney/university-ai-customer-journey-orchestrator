const mysql = require("mysql2/promise");

require("dotenv").config();

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Shiney@1509",
  database: "university_ai_orchestrator",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;