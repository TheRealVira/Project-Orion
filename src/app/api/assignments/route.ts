import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { DateAssignment } from '@/types';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const db = getDatabase();
    let query = 'SELECT * FROM date_assignments';
    let params: any[] = [];

    if (date) {
      query += ' WHERE date = ?';
      params = [date];
    }

    query += ' ORDER BY date';

    const assignments = db.prepare(query).all(...params) as DateAssignment[];
    
    // Get user and shadow IDs for each assignment
    const getUsers = db.prepare('SELECT userId FROM assignment_users WHERE assignmentId = ?');
    const getShadows = db.prepare('SELECT shadowId FROM assignment_shadows WHERE assignmentId = ?');
    
    const assignmentsWithData = assignments.map(assignment => {
      const users = getUsers.all(assignment.id) as { userId: string }[];
      const shadows = getShadows.all(assignment.id) as { shadowId: string }[];
      
      return {
        ...assignment,
        memberIds: users.map(u => u.userId),
        shadowIds: shadows.map(s => s.shadowId),
        createdAt: new Date(assignment.createdAt),
        updatedAt: new Date(assignment.updatedAt),
      };
    });

    return NextResponse.json(assignmentsWithData);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, teamId, memberIds, shadowIds, notes } = body;

    if (!date || !teamId) {
      return NextResponse.json({ error: 'Date and teamId are required' }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'At least one member must be assigned' }, { status: 400 });
    }

    const db = getDatabase();
    const id = `a${Date.now()}`;
    const now = new Date().toISOString();

    const insertAssignment = db.prepare(`
      INSERT INTO date_assignments (id, date, teamId, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertUser = db.prepare(`
      INSERT INTO assignment_users (assignmentId, userId) VALUES (?, ?)
    `);

    const insertShadow = db.prepare(`
      INSERT INTO assignment_shadows (assignmentId, shadowId) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      insertAssignment.run(id, date, teamId, notes || null, now, now);
      
      if (memberIds && Array.isArray(memberIds)) {
        memberIds.forEach((memberId: string) => {
          insertUser.run(id, memberId);
        });
      }

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

    // Send email notifications to assigned members
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      try {
        const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId) as { name: string } | undefined;
        const { sendCalendarAssignmentEmail } = await import('@/lib/email');
        
        for (const memberId of memberIds) {
          const member = db.prepare('SELECT name, email FROM users WHERE id = ?').get(memberId) as { name: string; email: string | null } | undefined;
          
          if (member && member.email) {
            await sendCalendarAssignmentEmail(member.email, member.name, {
              assignmentId: id,
              date,
              teamName: team?.name || 'Unknown Team',
              notes: notes || undefined,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send assignment notification emails:', emailError);
        // Don't fail the assignment creation if email fails
      }
    }

    return NextResponse.json({
      ...assignment,
      memberIds: users.map(u => u.userId),
      shadowIds: shadows.map(s => s.shadowId),
      createdAt: new Date(assignment.createdAt),
      updatedAt: new Date(assignment.updatedAt),
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
