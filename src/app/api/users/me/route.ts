import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getUserById, updateUser, updateEmail, canEditUser } from '@/lib/auth';

// GET /api/users/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, city, country, timezone, latitude, longitude } = body;

    // Validate fields
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email && email !== session.user.email) {
      try {
        updateEmail(session.user.id, email);
      } catch (error: any) {
        if (error.message === 'Email already in use') {
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }
        throw error;
      }
    }

    // Update other fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (timezone !== undefined) updates.timezone = timezone;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    
    // Track when location was manually updated
    if (city !== undefined || country !== undefined || timezone !== undefined || 
        latitude !== undefined || longitude !== undefined) {
      updates.locationSource = 'manual';
      updates.locationUpdatedAt = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      updateUser(session.user.id, updates);
    }

    const updatedUser = getUserById(session.user.id);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
