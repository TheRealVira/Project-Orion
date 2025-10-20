import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getUserById, updateUser, updatePassword, updateEmail, canEditUser, listUsers } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { User } from '@/lib/auth';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// GET /api/users - List all active users
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch users with team membership and on-call status
    const users = db.prepare(`
      SELECT u.*, 
             tm.teamId,
             CASE 
               WHEN au.userId IS NOT NULL THEN 1 
               ELSE 0 
             END as onCall
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.userId
      LEFT JOIN date_assignments da ON da.date = ? AND da.teamId = tm.teamId
      LEFT JOIN assignment_users au ON au.assignmentId = da.id AND au.userId = u.id
      ORDER BY u.name
    `).all(today) as (User & { teamId?: string; onCall?: number })[];
    
    // Convert to member format for UI compatibility
    const members = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      authProvider: u.authProvider,
      authProviderId: u.authProviderId,
      teamId: u.teamId,
      userId: u.id, // Self-reference for unified system
      city: u.city,
      country: u.country,
      timezone: u.timezone,
      latitude: u.latitude,
      longitude: u.longitude,
      locationSource: u.locationSource,
      locationUpdatedAt: u.locationUpdatedAt,
      onCall: u.onCall === 1, // Convert from SQLite integer to boolean
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt),
    }));
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, avatarUrl, password, role, city, country, timezone, latitude, longitude } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getDatabase();
    
    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const id = `u${Date.now()}`;
    const now = new Date().toISOString();

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insert = db.prepare(`
      INSERT INTO users (id, email, name, password, phone, role, authProvider, avatarUrl, city, country, timezone, latitude, longitude, locationSource, locationUpdatedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id, 
      email, 
      name, 
      hashedPassword, 
      phone || null, 
      role || 'user',
      'local',
      avatarUrl || null, 
      city || null,
      country || null,
      timezone || null,
      latitude || null,
      longitude || null,
      (city || country) ? 'manual' : null,
      (city || country) ? now : null,
      now, 
      now
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
    
    // Return in member format
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      userId: user.id,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
