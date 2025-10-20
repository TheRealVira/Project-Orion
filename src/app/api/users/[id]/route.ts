import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getUserById, updateUser, canEditUser } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { User } from '@/lib/auth';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Check permissions
    if (!canEditUser(session.user.id, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update user (admin only for role changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    const body = await request.json();
    const { role, name, email, phone, city, country, timezone, latitude, longitude } = body;

    // Check if trying to change role - only admins can do this
    if (role !== undefined && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 });
    }

    // Check basic edit permissions
    if (!canEditUser(session.user.id, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate role
    if (role !== undefined && !['admin', 'user', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Build updates object
    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (timezone !== undefined) updates.timezone = timezone;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateUser(userId, updates);

    const updatedUser = getUserById(userId);
    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.message === 'Email already in use') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (for member service compatibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, phone, avatarUrl, password, role, city, country, timezone, latitude, longitude } = body;
    const userId = params.id;

    const db = getDatabase();
    
    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatarUrl = ?');
      values.push(avatarUrl);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country);
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      values.push(timezone);
    }
    if (latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(longitude);
    }

    // Handle password update if provided
    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    
    // Return in member format
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      city: updatedUser.city,
      country: updatedUser.country,
      timezone: updatedUser.timezone,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude,
      userId: updatedUser.id,
      createdAt: new Date(updatedUser.createdAt),
      updatedAt: new Date(updatedUser.updatedAt),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Soft delete user (set isActive = 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const db = getDatabase();
    
    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to 0
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET isActive = 0, updatedAt = ? WHERE id = ?').run(now, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
