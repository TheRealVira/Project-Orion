import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, createUser } from '@/lib/auth';

// POST /api/auth/register - Create a new local user (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, password, role = 'user' } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!['admin', 'user', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create the user
    const user = await createUser({
      email,
      name,
      password,
      role,
      authProvider: 'local',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.message === 'User with this email already exists') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
