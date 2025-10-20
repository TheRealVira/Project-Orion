import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Shadow } from '@/types';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { userId, shadowUserId, startDate, endDate } = data;
    const db = getDatabase();

    // Check if shadow exists
    const existing = db.prepare('SELECT * FROM shadows WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Shadow not found' }, { status: 404 });
    }

    const stmt = db.prepare(`
      UPDATE shadows 
      SET userId = ?, shadowUserId = ?, startDate = ?, endDate = ?
      WHERE id = ?
    `);

    stmt.run(
      userId,
      shadowUserId,
      startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate ? (endDate instanceof Date ? endDate.toISOString() : endDate) : null,
      params.id
    );

    const updatedShadow = db.prepare('SELECT * FROM shadows WHERE id = ?').get(params.id) as Shadow;
    
    return NextResponse.json({
      ...updatedShadow,
      startDate: new Date(updatedShadow.startDate),
      endDate: updatedShadow.endDate ? new Date(updatedShadow.endDate) : undefined,
    });
  } catch (error) {
    console.error('Error updating shadow:', error);
    return NextResponse.json({ error: 'Failed to update shadow' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();

    // Check if shadow exists
    const existing = db.prepare('SELECT * FROM shadows WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Shadow not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM shadows WHERE id = ?').run(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shadow:', error);
    return NextResponse.json({ error: 'Failed to delete shadow' }, { status: 500 });
  }
}
