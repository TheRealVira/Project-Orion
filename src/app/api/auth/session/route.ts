import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = getSessionByToken(token);

    if (!session) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session_token');
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatarUrl: session.user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
