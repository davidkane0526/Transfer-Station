CREATE TABLE IF NOT EXISTS part_revision (
  revision INTEGER PRIMARY KEY AUTOINCREMENT,
  part TEXT NOT NULL,
  parent INTEGER REFERENCES part_revision(revision),
  changed_at TEXT NOT NULL,
  field TEXT NOT NULL,
  previous TEXT NOT NULL,
  value TEXT NOT NULL,
  snapshot TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS part_revision_head ON part_revision(part, revision DESC);
CREATE TABLE IF NOT EXISTS part_import_history (
  part TEXT PRIMARY KEY,
  imported_at TEXT NOT NULL,
  entries_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_session (
  digest TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_session_expiry ON admin_session(expires_at);
