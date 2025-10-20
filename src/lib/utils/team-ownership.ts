import { getDatabase } from '../database';

/**
 * Add a user as owner of a team
 */
export function addTeamOwner(teamId: string, userId: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO team_owners (teamId, userId)
    VALUES (?, ?)
  `);
  stmt.run(teamId, userId);
}

/**
 * Remove a user as owner of a team
 */
export function removeTeamOwner(teamId: string, userId: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM team_owners WHERE teamId = ? AND userId = ?');
  stmt.run(teamId, userId);
}

/**
 * Get all owners of a team
 */
export function getTeamOwners(teamId: string): string[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT userId FROM team_owners WHERE teamId = ?');
  const rows = stmt.all(teamId) as { userId: string }[];
  return rows.map(row => row.userId);
}

/**
 * Get all teams owned by a user
 */
export function getTeamsOwnedByUser(userId: string): string[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT teamId FROM team_owners WHERE userId = ?');
  const rows = stmt.all(userId) as { teamId: string }[];
  return rows.map(row => row.teamId);
}

/**
 * Check if user owns a team
 */
export function isTeamOwner(teamId: string, userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM team_owners WHERE teamId = ? AND userId = ?');
  const result = stmt.get(teamId, userId) as { count: number };
  return result.count > 0;
}

/**
 * Check if user can edit a team
 * - Admins can edit any team
 * - Team owners can edit their teams
 */
export function canEditTeam(teamId: string, userId: string, userRole: string): boolean {
  // Admins can edit any team
  if (userRole === 'admin') return true;
  
  // Check if user is a team owner
  return isTeamOwner(teamId, userId);
}

/**
 * Set team owners (replace all existing owners)
 */
export function setTeamOwners(teamId: string, userIds: string[]): void {
  const db = getDatabase();
  
  // Remove all existing owners
  const deleteStmt = db.prepare('DELETE FROM team_owners WHERE teamId = ?');
  deleteStmt.run(teamId);
  
  // Add new owners
  const insertStmt = db.prepare('INSERT INTO team_owners (teamId, userId) VALUES (?, ?)');
  for (const userId of userIds) {
    insertStmt.run(teamId, userId);
  }
}
