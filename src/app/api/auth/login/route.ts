import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, seedAdminUser } from '@/lib/auth';
import { authenticateLDAP } from '@/lib/auth/auth-ldap';

// Initialize admin user on first load
seedAdminUser().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, authProvider = 'local' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let user = null;

    // Authenticate based on provider
    if (authProvider === 'ldap') {
      user = await authenticateLDAP(email, password);
    } else {
      user = await authenticateUser(email, password);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const session = createSession(user.id);

    // Set session cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token: session.token,
    });

    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
