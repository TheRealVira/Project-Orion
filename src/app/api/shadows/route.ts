import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Shadow } from '@/types';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    const shadows = db.prepare('SELECT * FROM shadows').all() as Shadow[];
    
    return NextResponse.json(shadows.map(s => ({
      ...s,
      startDate: new Date(s.startDate),
      endDate: s.endDate ? new Date(s.endDate) : undefined,
    })));
  } catch (error) {
    console.error('Error fetching shadows:', error);
    return NextResponse.json({ error: 'Failed to fetch shadows' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, shadowUserId, startDate, endDate } = data;

    if (!userId || !shadowUserId || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDatabase();
    const id = `shadow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO shadows (id, userId, shadowUserId, startDate, endDate)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      shadowUserId,
      startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate ? (endDate instanceof Date ? endDate.toISOString() : endDate) : null
    );

    const newShadow = db.prepare('SELECT * FROM shadows WHERE id = ?').get(id) as Shadow;
    
    return NextResponse.json({
      ...newShadow,
      startDate: new Date(newShadow.startDate),
      endDate: newShadow.endDate ? new Date(newShadow.endDate) : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shadow:', error);
    return NextResponse.json({ error: 'Failed to create shadow' }, { status: 500 });
  }
}
