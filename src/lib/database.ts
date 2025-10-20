import Database from 'better-sqlite3';
import path from 'path';
import { Member, Team, DateAssignment, Shadow } from '@/types';
import config, { logger } from './config';

const dbPath = config.databasePath.startsWith('./')
  ? path.join(process.cwd(), config.databasePath.slice(2))
  : config.databasePath;
let db: Database.Database;

export function getDatabase() {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDatabase();
    
    // Seed initial data (async, runs in background)
    seedInitialData().catch(err => {
      console.error('Error seeding initial data:', err);
    });
  }
  return db;
}

function initializeDatabase() {
  const db = getDatabase();

  // Migration: Drop deprecated members table (now using users table directly)
  try {
    db.exec(`DROP TABLE IF EXISTS members`);
  } catch (err) {
    logger.error('Error dropping members table:', err);
  }

  // NOTE: Removed automatic role downgrade migration
  // OAuth/LDAP users can now have their roles set by admins and they will persist
  // New OAuth/LDAP users still start as 'viewer' by default (see auth-oauth.ts and auth-ldap.ts)

  // Create Users table (for authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')) DEFAULT 'user',
      authProvider TEXT NOT NULL CHECK (authProvider IN ('local', 'oauth', 'ldap')) DEFAULT 'local',
      authProviderId TEXT,
      avatarUrl TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      lastLoginAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create Sessions table (for session management)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Teams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create TeamOwners junction table (for team ownership)
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_owners (
      teamId TEXT NOT NULL,
      userId TEXT NOT NULL,
      PRIMARY KEY (teamId, userId),
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create TeamMembers junction table (now references users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      teamId TEXT NOT NULL,
      userId TEXT NOT NULL,
      PRIMARY KEY (teamId, userId),
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Shadows table (now references users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS shadows (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      shadowUserId TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (shadowUserId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create DateAssignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS date_assignments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      teamId TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    )
  `);

  // Create AssignmentUsers junction table (renamed from assignment_members)
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignment_users (
      assignmentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      PRIMARY KEY (assignmentId, userId),
      FOREIGN KEY (assignmentId) REFERENCES date_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create AssignmentShadows junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignment_shadows (
      assignmentId TEXT NOT NULL,
      shadowId TEXT NOT NULL,
      PRIMARY KEY (assignmentId, shadowId),
      FOREIGN KEY (assignmentId) REFERENCES date_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (shadowId) REFERENCES shadows(id) ON DELETE CASCADE
    )
  `);

  // Create indices for better performance (updated to reference users)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_authProvider ON users(authProvider);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_team_owners_teamId ON team_owners(teamId);
    CREATE INDEX IF NOT EXISTS idx_team_owners_userId ON team_owners(userId);
    CREATE INDEX IF NOT EXISTS idx_date_assignments_date ON date_assignments(date);
    CREATE INDEX IF NOT EXISTS idx_team_members_teamId ON team_members(teamId);
    CREATE INDEX IF NOT EXISTS idx_team_members_userId ON team_members(userId);
    CREATE INDEX IF NOT EXISTS idx_shadows_userId ON shadows(userId);
    CREATE INDEX IF NOT EXISTS idx_shadows_shadowUserId ON shadows(shadowUserId);
    CREATE INDEX IF NOT EXISTS idx_assignment_users_assignmentId ON assignment_users(assignmentId);
    CREATE INDEX IF NOT EXISTS idx_assignment_users_userId ON assignment_users(userId);
  `);

  // Create Incidents table (now references users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      source TEXT NOT NULL,
      sourceId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
      status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'closed')),
      teamId TEXT,
      assignedToId TEXT,
      tags TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      acknowledgedAt TEXT,
      closedAt TEXT,
      firstResponseAt TEXT,
      slaResponseDeadline TEXT,
      slaResolutionDeadline TEXT,
      slaResponseBreached INTEGER DEFAULT 0,
      slaResolutionBreached INTEGER DEFAULT 0,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY (assignedToId) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create IncidentNotes table (now references users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS incident_notes (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      userId TEXT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create IncidentNotifications table (now references users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS incident_notifications (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      channel TEXT NOT NULL,
      sentAt TEXT NOT NULL,
      deliveredAt TEXT,
      readAt TEXT,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create EscalationPolicies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalation_policies (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      layers TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    )
  `);

  // Create Team SLA Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_sla_settings (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL UNIQUE,
      responseTimeCritical INTEGER NOT NULL,
      responseTimeHigh INTEGER NOT NULL,
      responseTimeMedium INTEGER NOT NULL,
      responseTimeLow INTEGER NOT NULL,
      resolutionTimeCritical INTEGER NOT NULL,
      resolutionTimeHigh INTEGER NOT NULL,
      resolutionTimeMedium INTEGER NOT NULL,
      resolutionTimeLow INTEGER NOT NULL,
      businessHoursOnly INTEGER NOT NULL DEFAULT 0,
      businessHoursStart TEXT DEFAULT '09:00',
      businessHoursEnd TEXT DEFAULT '17:00',
      businessDays TEXT DEFAULT '1,2,3,4,5',
      timezone TEXT DEFAULT 'UTC',
      enabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    )
  `);

  // Create indices for incidents
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_incidents_fingerprint ON incidents(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_incidents_teamId ON incidents(teamId);
    CREATE INDEX IF NOT EXISTS idx_incidents_assignedToId ON incidents(assignedToId);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incident_notes_incidentId ON incident_notes(incidentId);
    CREATE INDEX IF NOT EXISTS idx_incident_notifications_incidentId ON incident_notifications(incidentId);
    CREATE INDEX IF NOT EXISTS idx_team_sla_settings_teamId ON team_sla_settings(teamId);
  `);

  // Migration: Add SLA columns to existing incidents table if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(incidents)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);
    
    if (!columnNames.includes('firstResponseAt')) {
      logger.info('🔄 Migrating incidents table: Adding SLA columns...');
      db.exec(`
        ALTER TABLE incidents ADD COLUMN firstResponseAt TEXT;
        ALTER TABLE incidents ADD COLUMN slaResponseDeadline TEXT;
        ALTER TABLE incidents ADD COLUMN slaResolutionDeadline TEXT;
        ALTER TABLE incidents ADD COLUMN slaResponseBreached INTEGER DEFAULT 0;
        ALTER TABLE incidents ADD COLUMN slaResolutionBreached INTEGER DEFAULT 0;
      `);
      logger.info('✅ SLA columns added to incidents table');
    }
  } catch (err) {
    logger.error('Error adding SLA columns to incidents table:', err);
  }

  // Migration: Add location columns to users table if they don't exist
  try {
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const userColumnNames = userTableInfo.map(col => col.name);
    
    if (!userColumnNames.includes('city')) {
      logger.info('🔄 Migrating users table: Adding location columns...');
      db.exec(`
        ALTER TABLE users ADD COLUMN city TEXT;
        ALTER TABLE users ADD COLUMN country TEXT;
        ALTER TABLE users ADD COLUMN timezone TEXT;
        ALTER TABLE users ADD COLUMN latitude REAL;
        ALTER TABLE users ADD COLUMN longitude REAL;
        ALTER TABLE users ADD COLUMN locationSource TEXT CHECK (locationSource IN ('manual', 'oauth', 'ldap', 'auto'));
        ALTER TABLE users ADD COLUMN locationUpdatedAt TEXT;
      `);
      logger.info('✅ Location columns added to users table');
    }
  } catch (err) {
    logger.error('Error adding location columns to users table:', err);
  }
}

export async function seedInitialData() {
  const db = getDatabase();
  
  // Check if data already exists (now checking users instead of members)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE isActive = 1').get() as { count: number };
  if (userCount.count > 0) {
    return; // Data already seeded
  }

  // Create default admin user from config
  const bcrypt = require('bcryptjs');
  const config = require('./config').default;
  const adminId = 'admin-default';
  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(config.defaultAdmin.password, 10);

  // Use INSERT OR IGNORE to prevent duplicate errors
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, password, phone, role, authProvider, avatarUrl, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertAdmin.run(
    adminId,
    config.defaultAdmin.email,
    config.defaultAdmin.name,
    hashedPassword,
    null, // no phone
    'admin',
    'local',
    null, // no avatar
    1, // isActive
    now,
    now
  );

  if (result.changes > 0) {
    console.log(`Database initialized with default admin user (${config.defaultAdmin.email} / ${config.defaultAdmin.password})`);
  }
}

export default getDatabase;
