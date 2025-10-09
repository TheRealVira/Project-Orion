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

    // Get old assignment data for email notifications
    const oldAssignment = db.prepare('SELECT * FROM date_assignments WHERE id = ?').get(id) as DateAssignment | undefined;
    const oldUserIds = db.prepare('SELECT userId FROM assignment_users WHERE assignmentId = ?').all(id) as { userId: string }[];
    const oldMemberIdSet = new Set(oldUserIds.map(u => u.userId));

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

    // Send email notifications for changes
    if (oldAssignment) {
      try {
        const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId) as { name: string } | undefined;
        const { sendCalendarAssignmentEmail, sendCalendarAssignmentUpdateEmail } = await import('@/lib/email');
        
        const newMemberIdSet = new Set(memberIds || []);
        
        // Find newly added members
        const addedMemberIds = (memberIds || []).filter((mid: string) => !oldMemberIdSet.has(mid));
        
        // Find removed members
        const removedMemberIds = Array.from(oldMemberIdSet).filter(mid => !newMemberIdSet.has(mid));
        
        // Find members who are still assigned (updated)
        const updatedMemberIds = (memberIds || []).filter((mid: string) => oldMemberIdSet.has(mid));
        
        // Send emails to newly added members
        for (const memberId of addedMemberIds) {
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
        
        // Send removal emails to removed members
        for (const memberId of removedMemberIds) {
          const member = db.prepare('SELECT name, email FROM users WHERE id = ?').get(memberId) as { name: string; email: string | null } | undefined;
          
          if (member && member.email) {
            await sendCalendarAssignmentUpdateEmail(member.email, member.name, {
              assignmentId: id,
              date: oldAssignment.date,
              teamName: team?.name || 'Unknown Team',
              notes: oldAssignment.notes || undefined,
            }, 'removed');
          }
        }
        
        // Send update emails to members who remain assigned (if date or notes changed)
        if (oldAssignment.date !== date || oldAssignment.notes !== notes) {
          for (const memberId of updatedMemberIds) {
            const member = db.prepare('SELECT name, email FROM users WHERE id = ?').get(memberId) as { name: string; email: string | null } | undefined;
            
            if (member && member.email) {
              await sendCalendarAssignmentUpdateEmail(member.email, member.name, {
                assignmentId: id,
                date,
                teamName: team?.name || 'Unknown Team',
                notes: notes || undefined,
              }, 'updated');
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send assignment update notification emails:', emailError);
        // Don't fail the assignment update if email fails
      }
    }

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

    // Get assignment data before deletion for email notifications
    const assignment = db.prepare('SELECT * FROM date_assignments WHERE id = ?').get(id) as DateAssignment | undefined;
    const userIds = db.prepare('SELECT userId FROM assignment_users WHERE assignmentId = ?').all(id) as { userId: string }[];

    const deleteStmt = db.prepare('DELETE FROM date_assignments WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Send email notifications to all assigned members
    if (assignment && userIds.length > 0) {
      try {
        const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(assignment.teamId) as { name: string } | undefined;
        const { sendCalendarAssignmentUpdateEmail } = await import('@/lib/email');
        
        for (const { userId } of userIds) {
          const member = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId) as { name: string; email: string | null } | undefined;
          
          if (member && member.email) {
            await sendCalendarAssignmentUpdateEmail(member.email, member.name, {
              assignmentId: id,
              date: assignment.date,
              teamName: team?.name || 'Unknown Team',
              notes: assignment.notes || undefined,
            }, 'removed');
          }
        }
      } catch (emailError) {
        console.error('Failed to send assignment deletion notification emails:', emailError);
        // Don't fail the deletion if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
