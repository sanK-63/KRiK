import Database from "better-sqlite3";

const db = new Database("corporate-portal.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS constitution (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const row = db
  .prepare("SELECT COUNT(*) as count FROM constitution")
  .get() as { count: number };
if (row.count === 0) {
  db.prepare("INSERT INTO constitution (version, content) VALUES (?, ?)").run(
    "1.0.0",
    "1. Устав Синдиката: Непрекословное подчинение.\n2. Верность Архитектуре."
  );
  console.log("Конституция: дефолтная версия создана");
}

export default db;
