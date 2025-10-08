import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Team } from '@/types';

export async function GET() {
  try {
    const db = getDatabase();
    const teams = db.prepare('SELECT * FROM teams ORDER BY name').all() as Team[];
    
    // Get user IDs for each team
    const getUsers = db.prepare('SELECT userId FROM team_members WHERE teamId = ?');
    
    const teamsWithMembers = teams.map(team => {
      const users = getUsers.all(team.id) as { userId: string }[];
      return {
        ...team,
        memberIds: users.map(u => u.userId),
        createdAt: new Date(team.createdAt),
        updatedAt: new Date(team.updatedAt),
      };
    });

    return NextResponse.json(teamsWithMembers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const { name, description, color, memberIds, ownerIds } = body;

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    const db = getDatabase();
    const id = `t${Date.now()}`;
    const now = new Date().toISOString();

    // Use transaction
    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, description, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertTeamUser = db.prepare(`
      INSERT INTO team_members (teamId, userId) VALUES (?, ?)
    `);


    const { setTeamOwners } = require('@/lib/team-ownership');
    const transaction = db.transaction(() => {
      insertTeam.run(id, name, description || null, color, now, now);
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
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
