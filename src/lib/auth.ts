import bcrypt from 'bcryptjs';
import { getDatabase } from './database';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user' | 'viewer';
  authProvider: 'local' | 'oauth' | 'ldap';
  authProviderId?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
  role?: 'admin' | 'user' | 'viewer';
  authProvider?: 'local' | 'oauth' | 'ldap';
  authProviderId?: string;
  avatarUrl?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Hash password if provided (for local auth)
  const hashedPassword = input.password ? await hashPassword(input.password) : null;

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, password, role, authProvider, authProviderId, avatarUrl, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  stmt.run(
    id,
    input.email.toLowerCase(),
    input.name,
    hashedPassword,
    input.role || 'user',
    input.authProvider || 'local',
    input.authProviderId || null,
    input.avatarUrl || null,
    now,
    now
  );

  return getUserById(id)!;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, name, role, authProvider, authProviderId, avatarUrl, isActive, lastLoginAt, createdAt, updatedAt
    FROM users
    WHERE id = ?
  `);

  return stmt.get(id) as User | null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, name, role, authProvider, authProviderId, avatarUrl, isActive, lastLoginAt, createdAt, updatedAt
    FROM users
    WHERE email = ? COLLATE NOCASE
  `);

  return stmt.get(email.toLowerCase()) as User | null;
}

/**
 * Get user with password by email (for authentication)
 */
export function getUserWithPasswordByEmail(email: string): (User & { password: string | null }) | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, name, password, role, authProvider, authProviderId, avatarUrl, isActive, lastLoginAt, createdAt, updatedAt
    FROM users
    WHERE email = ? COLLATE NOCASE
  `);

  return stmt.get(email.toLowerCase()) as (User & { password: string | null }) | null;
}

/**
 * Update user's last login timestamp
 */
export function updateLastLogin(userId: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users
    SET lastLoginAt = ?
    WHERE id = ?
  `);

  stmt.run(new Date().toISOString(), userId);
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = getUserWithPasswordByEmail(email);

  if (!user || !user.isActive) {
    return null;
  }

  // Check if user is local auth
  if (user.authProvider !== 'local' || !user.password) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  updateLastLogin(user.id);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Create a session for a user
 */
export function createSession(userId: string, expiresInHours: number = 24 * 7): Session {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, token, expiresAt, createdAt);

  return { id, userId, token, expiresAt, createdAt };
}

/**
 * Get session by token
 */
export function getSessionByToken(token: string): (Session & { user: User }) | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      s.id, s.userId, s.token, s.expiresAt, s.createdAt,
      u.id as user_id, u.email as user_email, u.name as user_name, 
      u.role as user_role, u.authProvider as user_authProvider, 
      u.authProviderId as user_authProviderId, u.avatarUrl as user_avatarUrl, 
      u.isActive as user_isActive, u.lastLoginAt as user_lastLoginAt,
      u.createdAt as user_createdAt, u.updatedAt as user_updatedAt
    FROM sessions s
    JOIN users u ON s.userId = u.id
    WHERE s.token = ? AND s.expiresAt > datetime('now')
  `);

  const row = stmt.get(token) as any;
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    token: row.token,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    user: {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
      role: row.user_role,
      authProvider: row.user_authProvider,
      authProviderId: row.user_authProviderId,
      avatarUrl: row.user_avatarUrl,
      isActive: Boolean(row.user_isActive),
      lastLoginAt: row.user_lastLoginAt,
      createdAt: row.user_createdAt,
      updatedAt: row.user_updatedAt,
    },
  };
}

/**
 * Delete a session
 */
export function deleteSession(token: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Delete all sessions for a user
 */
export function deleteUserSessions(userId: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sessions WHERE userId = ?');
  stmt.run(userId);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM sessions WHERE expiresAt < datetime('now')");
  stmt.run();
}

/**
 * List all users (admin only)
 */
export function listUsers(): User[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, name, role, authProvider, authProviderId, avatarUrl, isActive, lastLoginAt, createdAt, updatedAt
    FROM users
    ORDER BY createdAt DESC
  `);

  return stmt.all() as User[];
}

/**
 * Update user
 */
export function updateUser(id: string, updates: Partial<User>): User | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const allowedFields = ['name', 'email', 'role', 'avatarUrl', 'isActive'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

  if (fields.length === 0) {
    return getUserById(id);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);

  const stmt = db.prepare(`
    UPDATE users
    SET ${setClause}, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(...values, now, id);

  return getUserById(id);
}

/**
 * Update user password
 */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const db = getDatabase();
  const hashedPassword = await hashPassword(newPassword);
  const stmt = db.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?');
  stmt.run(hashedPassword, new Date().toISOString(), userId);
}

/**
 * Update user email
 */
export function updateEmail(userId: string, newEmail: string): User | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE users SET email = ?, updatedAt = ? WHERE id = ?');
  stmt.run(newEmail.toLowerCase(), now, userId);
  return getUserById(userId);
}

/**
 * Check if user can edit another user (admin check)
 */
export function canEditUser(editorId: string, targetId: string): boolean {
  const editor = getUserById(editorId);
  if (!editor) return false;
  
  // Admins can edit anyone
  if (editor.role === 'admin') return true;
  
  // Users can edit themselves
  return editorId === targetId;
}

/**
 * Delete user
 */
export function deleteUser(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
}

/**
 * Seed initial admin user if no users exist
 */
export async function seedAdminUser(): Promise<void> {
  const db = getDatabase();
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (count.count === 0) {
    // Create default admin user
    await createUser({
      email: 'admin@orion.local',
      name: 'Administrator',
      password: 'admin123', // Should be changed on first login
      role: 'admin',
      authProvider: 'local',
    });

    console.log('✓ Default admin user created: admin@orion.local / admin123');
  }
}
