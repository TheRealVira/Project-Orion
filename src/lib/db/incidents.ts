import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'orion.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create incidents table
db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL CHECK(status IN ('new', 'in_progress', 'closed')),
    team_id TEXT NOT NULL,
    assigned_to_id TEXT,
    tags TEXT NOT NULL, -- JSON array
    metadata TEXT NOT NULL, -- JSON object
    created_at INTEGER NOT NULL,
    acknowledged_at INTEGER,
    in_progress_at INTEGER,
    closed_at INTEGER,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES members(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
  CREATE INDEX IF NOT EXISTS idx_incidents_team_id ON incidents(team_id);
  CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to_id ON incidents(assigned_to_id);
  CREATE INDEX IF NOT EXISTS idx_incidents_fingerprint ON incidents(fingerprint);
  CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
`);

// Create incident notes table
db.exec(`
  CREATE TABLE IF NOT EXISTS incident_notes (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_incident_notes_incident_id ON incident_notes(incident_id);
  CREATE INDEX IF NOT EXISTS idx_incident_notes_created_at ON incident_notes(created_at);
`);

// Create incident notifications table
db.exec(`
  CREATE TABLE IF NOT EXISTS incident_notifications (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    channel TEXT NOT NULL CHECK(channel IN ('email', 'sms', 'slack', 'push')),
    sent_at INTEGER NOT NULL,
    delivered_at INTEGER,
    read_at INTEGER,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_incident_notifications_incident_id ON incident_notifications(incident_id);
  CREATE INDEX IF NOT EXISTS idx_incident_notifications_member_id ON incident_notifications(member_id);
`);

// Create escalation policies table
db.exec(`
  CREATE TABLE IF NOT EXISTS escalation_policies (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    layers TEXT NOT NULL, -- JSON array of EscalationLayer
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_escalation_policies_team_id ON escalation_policies(team_id);
`);

console.log('Incident management tables initialized');

export default db;
