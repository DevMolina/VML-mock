const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "requests.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    ip TEXT,
    headers TEXT,
    query TEXT,
    params TEXT,
    body TEXT,
    cookies TEXT
  )
`);

const insertStmt = db.prepare(`
  INSERT INTO requests (created_at, method, path, ip, headers, query, params, body, cookies)
  VALUES (@created_at, @method, @path, @ip, @headers, @query, @params, @body, @cookies)
`);

function logRequest(req) {
  insertStmt.run({
    created_at: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    headers: JSON.stringify(req.headers || {}),
    query: JSON.stringify(req.query || {}),
    params: JSON.stringify(req.params || {}),
    body: JSON.stringify(req.body || {}),
    cookies: JSON.stringify(req.cookies || {}),
  });
}

function getRequests(limit = 100) {
  const rows = db
    .prepare("SELECT * FROM requests ORDER BY id DESC LIMIT ?")
    .all(limit);

  return rows.map((row) => ({
    ...row,
    headers: JSON.parse(row.headers),
    query: JSON.parse(row.query),
    params: JSON.parse(row.params),
    body: JSON.parse(row.body),
    cookies: JSON.parse(row.cookies),
  }));
}

module.exports = { logRequest, getRequests };
