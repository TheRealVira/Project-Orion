import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getUserById, updateUser, updatePassword, updateEmail, canEditUser, listUsers } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { User } from '@/lib/auth';

// GET /api/users - List all active users
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    // Fetch active users and return in member-compatible format
    const users = db.prepare('SELECT * FROM users WHERE isActive = 1 ORDER BY name').all() as User[];
    
    // Convert to member format for UI compatibility
    const members = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      userId: u.id, // Self-reference for unified system
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
    const { name, email, phone, avatarUrl, password, role } = body;

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
      INSERT INTO users (id, email, name, password, phone, role, authProvider, avatarUrl, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      1, // isActive
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
