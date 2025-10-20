import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// Debug endpoint to check raw user data
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const db = getDatabase();
    
    // Get session
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get raw user data from database
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId);
    
    return NextResponse.json({
      message: 'Raw user data from database',
      user,
      note: 'This shows exactly what is stored in the database'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
