import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Team } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
  const { name, description, color, memberIds, ownerIds } = body;
    const { id } = params;

    const db = getDatabase();
    const now = new Date().toISOString();

    const updateTeam = db.prepare(`
      UPDATE teams
      SET name = ?, description = ?, color = ?, updatedAt = ?
      WHERE id = ?
    `);

    const deleteTeamMembers = db.prepare('DELETE FROM team_members WHERE teamId = ?');
    const insertTeamUser = db.prepare('INSERT INTO team_members (teamId, userId) VALUES (?, ?)');


    const { setTeamOwners } = require('@/lib/utils/team-ownership');
    const transaction = db.transaction(() => {
      const result = updateTeam.run(name, description || null, color, now, id);
      if (result.changes === 0) {
        throw new Error('Team not found');
      }
      // Update team members
      deleteTeamMembers.run(id);
      if (memberIds && Array.isArray(memberIds)) {
        memberIds.forEach((memberId: string) => {
          insertTeamUser.run(id, memberId);
        });
      }
      if (ownerIds && Array.isArray(ownerIds)) {
        setTeamOwners(id, ownerIds);
      }
    });
    transaction();

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as Team;
    const users = db.prepare('SELECT userId FROM team_members WHERE teamId = ?').all(id) as { userId: string }[];

    return NextResponse.json({
      ...team,
      memberIds: users.map(u => u.userId),
      createdAt: new Date(team.createdAt),
      updatedAt: new Date(team.updatedAt),
    });
  } catch (error: any) {
    console.error('Error updating team:', error);
    if (error.message === 'Team not found') {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDatabase();

    const deleteStmt = db.prepare('DELETE FROM teams WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
