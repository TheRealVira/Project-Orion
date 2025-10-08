import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { DateAssignment } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { date, teamId, memberIds, shadowIds, notes } = body;
    const { id } = params;

    const db = getDatabase();
    const now = new Date().toISOString();

    const updateAssignment = db.prepare(`
      UPDATE date_assignments
      SET date = ?, teamId = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `);

    const deleteUsers = db.prepare('DELETE FROM assignment_users WHERE assignmentId = ?');
    const deleteShadows = db.prepare('DELETE FROM assignment_shadows WHERE assignmentId = ?');
    const insertUser = db.prepare('INSERT INTO assignment_users (assignmentId, userId) VALUES (?, ?)');
    const insertShadow = db.prepare('INSERT INTO assignment_shadows (assignmentId, shadowId) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      const result = updateAssignment.run(date, teamId, notes || null, now, id);
      
      if (result.changes === 0) {
        throw new Error('Assignment not found');
      }

      // Update users
      deleteUsers.run(id);
      if (memberIds && Array.isArray(memberIds)) {
        memberIds.forEach((memberId: string) => {
          insertUser.run(id, memberId);
        });
      }

      // Update shadows
      deleteShadows.run(id);
      if (shadowIds && Array.isArray(shadowIds)) {
        shadowIds.forEach((shadowId: string) => {
          insertShadow.run(id, shadowId);
        });
      }
    });

    transaction();

    const assignment = db.prepare('SELECT * FROM date_assignments WHERE id = ?').get(id) as DateAssignment;
    const users = db.prepare('SELECT userId FROM assignment_users WHERE assignmentId = ?').all(id) as { userId: string }[];
    const shadows = db.prepare('SELECT shadowId FROM assignment_shadows WHERE assignmentId = ?').all(id) as { shadowId: string }[];

    return NextResponse.json({
      ...assignment,
      memberIds: users.map(u => u.userId),
      shadowIds: shadows.map(s => s.shadowId),
      createdAt: new Date(assignment.createdAt),
      updatedAt: new Date(assignment.updatedAt),
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    if (error.message === 'Assignment not found') {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDatabase();

    const deleteStmt = db.prepare('DELETE FROM date_assignments WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
