import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'Viewer',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS page_visibility (
      page_key TEXT PRIMARY KEY,
      is_public INTEGER DEFAULT 0,
      is_visible_for_users INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      path TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
}
