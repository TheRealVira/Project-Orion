import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { getSessionByToken } from '@/lib/auth';

// GET /api/incidents/[id] - Get a single incident
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;
    
    const incident = db.prepare(`
      SELECT i.*, 
             t.name as teamName, t.color as teamColor,
             u.name as assignedToName, u.email as assignedToEmail
      FROM incidents i
      LEFT JOIN teams t ON i.teamId = t.id
      LEFT JOIN users u ON i.assignedToId = u.id
      WHERE i.id = ?
    `).get(id) as any;
    
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ...incident,
      tags: incident.tags ? JSON.parse(incident.tags) : [],
      metadata: incident.metadata ? JSON.parse(incident.metadata) : {},
      team: incident.teamId ? { id: incident.teamId, name: incident.teamName, color: incident.teamColor } : null,
      assignedTo: incident.assignedToId ? { 
        id: incident.assignedToId, 
        name: incident.assignedToName, 
        email: incident.assignedToEmail 
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/incidents/[id] - Update an incident
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;
    const body = await request.json();
    
    // Get current user from session
    const token = request.cookies.get('session_token')?.value;
    const session = token ? getSessionByToken(token) : null;
    const currentUserId = session?.user?.id || null;
    
    // Check if incident exists
    const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    const {
      title,
      description,
      severity,
      status,
      teamId,
      assignedToId,
      tags,
      metadata,
    } = body;
    
    const now = new Date().toISOString();
    const updates: string[] = ['updatedAt = ?'];
    const values: any[] = [now];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (severity !== undefined) {
      updates.push('severity = ?');
      values.push(severity);
    }
    
    // Track status changes for timeline notes (to be created after successful update)
    let statusChangeNote: string | null = null;
    
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      
      const oldStatus = (existing as any).status;
      const currentAssignedTo = (existing as any).assignedToId;
      
      // Update status timestamps
      if (status === 'in_progress' && oldStatus === 'new') {
        updates.push('acknowledgedAt = ?');
        values.push(now);
        statusChangeNote = '🔵 Incident started - Status changed to In Progress';
        
        // Always assign to current user who started the work (overwrite any existing assignment)
        if (currentUserId) {
          // Check if assignment is changing
          const isReassignment = currentAssignedTo && currentAssignedTo !== currentUserId;
          
          updates.push('assignedToId = ?');
          values.push(currentUserId);
          
          const currentUserData = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUserId) as any;
          if (currentUserData) {
            if (isReassignment) {
              const previousUserData = db.prepare('SELECT name FROM users WHERE id = ?').get(currentAssignedTo) as any;
              statusChangeNote += `\n👤 Reassigned from ${previousUserData?.name || 'Unknown'} to ${currentUserData.name} (started work)`;
            } else if (!currentAssignedTo) {
              statusChangeNote += `\n👤 Auto-assigned to ${currentUserData.name}`;
            }
          }
        }
      } else if (status === 'in_progress' && oldStatus === 'closed') {
        // Reopening from closed
        statusChangeNote = '🔄 Incident reopened - Status changed to In Progress';
        
        // Always assign to current user who reopened the incident (overwrite any existing assignment)
        if (currentUserId) {
          const isReassignment = currentAssignedTo && currentAssignedTo !== currentUserId;
          
          updates.push('assignedToId = ?');
          values.push(currentUserId);
          
          const currentUserData = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUserId) as any;
          if (currentUserData) {
            if (isReassignment) {
              const previousUserData = db.prepare('SELECT name FROM users WHERE id = ?').get(currentAssignedTo) as any;
              statusChangeNote += `\n👤 Reassigned from ${previousUserData?.name || 'Unknown'} to ${currentUserData.name} (started work)`;
            } else if (!currentAssignedTo) {
              statusChangeNote += `\n👤 Auto-assigned to ${currentUserData.name}`;
            }
          }
        }
      } else if (status === 'new' && oldStatus === 'closed') {
        // Reopening to new
        statusChangeNote = '🔄 Incident reopened - Status changed to New';
      } else if (status === 'closed') {
        updates.push('closedAt = ?');
        values.push(now);
        statusChangeNote = '✅ Incident closed - Issue resolved';
      }
    }
    
    if (teamId !== undefined) {
      updates.push('teamId = ?');
      values.push(teamId);
    }
    
    // Track assignment changes for timeline notes and email (to be handled after successful update)
    let assignmentChangeNote: string | null = null;
    let assignedMember: any = null;
    
    if (assignedToId !== undefined) {
      updates.push('assignedToId = ?');
      values.push(assignedToId);
      
      // Check if assignment actually changed
      if ((existing as any).assignedToId !== assignedToId) {
        assignedMember = assignedToId ? db.prepare('SELECT name, email FROM users WHERE id = ?').get(assignedToId) as any : null;
        const memberName = assignedMember?.name || 'Unassigned';
        assignmentChangeNote = assignedToId ? `👤 Incident assigned to ${memberName}` : '👤 Incident unassigned';
      }
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }
    
    values.push(id);
    
    db.prepare(`
      UPDATE incidents 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    // Create timeline notes after successful update
    if (statusChangeNote) {
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO incident_notes (id, incidentId, userId, content, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(noteId, id, currentUserId, statusChangeNote, now);
    }
    
    if (assignmentChangeNote) {
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO incident_notes (id, incidentId, userId, content, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(noteId, id, currentUserId, assignmentChangeNote, now);
      
      // Send email notification if member was assigned (not unassigned)
      if (assignedMember && assignedMember.email) {
        try {
          const incident = existing as any;
          const { sendIncidentAssignedEmail } = await import('@/lib/email');
          await sendIncidentAssignedEmail(assignedMember.email, assignedMember.name, {
            incidentId: id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            status: incident.status,
            source: incident.source,
            createdAt: incident.createdAt,
          });
        } catch (emailError) {
          console.error('Failed to send assignment email:', emailError);
        }
      }
    }
    
    // Fetch updated incident
    const updated = db.prepare(`
      SELECT i.*, 
             t.name as teamName, t.color as teamColor,
             u.name as assignedToName, u.email as assignedToEmail
      FROM incidents i
      LEFT JOIN teams t ON i.teamId = t.id
      LEFT JOIN users u ON i.assignedToId = u.id
      WHERE i.id = ?
    `).get(id) as any;
    
    return NextResponse.json({
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : [],
      metadata: updated.metadata ? JSON.parse(updated.metadata) : {},
      team: updated.teamId ? { id: updated.teamId, name: updated.teamName, color: updated.teamColor } : null,
      assignedTo: updated.assignedToId ? { 
        id: updated.assignedToId, 
        name: updated.assignedToName, 
        email: updated.assignedToEmail 
      } : null,
    });
  } catch (error: any) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/incidents/[id] - Delete an incident
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;
    
    const result = db.prepare('DELETE FROM incidents WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting incident:', error);
    return NextResponse.json(
      { error: 'Failed to delete incident', details: error.message },
      { status: 500 }
    );
  }
}
