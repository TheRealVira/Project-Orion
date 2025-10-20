import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// GET /api/incidents/[id]/notes - Get all notes for an incident
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;
    
    // Verify incident exists
    const incident = db.prepare('SELECT id FROM incidents WHERE id = ?').get(id);
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    const notes = db.prepare(`
      SELECT n.*, u.name as userName, u.email as userEmail, u.avatarUrl as userAvatarUrl
      FROM incident_notes n
      LEFT JOIN users u ON n.userId = u.id
      WHERE n.incidentId = ?
      ORDER BY n.createdAt DESC
    `).all(id) as any[];
    
    const parsedNotes = notes.map(note => ({
      id: note.id,
      incidentId: note.incidentId,
      content: note.content,
      createdAt: note.createdAt,
      member: note.userId ? {
        id: note.userId,
        name: note.userName,
        email: note.userEmail,
        avatarUrl: note.userAvatarUrl,
      } : null,
    }));
    
    return NextResponse.json(parsedNotes);
  } catch (error: any) {
    console.error('Error fetching incident notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/incidents/[id]/notes - Add a note to an incident
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;
    const body = await request.json();
    
    const { userId, content } = body;
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, content' },
        { status: 400 }
      );
    }
    
    // Verify incident exists
    const incident = db.prepare('SELECT id FROM incidents WHERE id = ?').get(id);
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO incident_notes (id, incidentId, userId, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(noteId, id, userId, content, now);
    
    // Fetch the created note with user info
    const note = db.prepare(`
      SELECT n.*, u.name as userName, u.email as userEmail, u.avatarUrl as userAvatarUrl
      FROM incident_notes n
      JOIN users u ON n.userId = u.id
      WHERE n.id = ?
    `).get(noteId) as any;
    
    return NextResponse.json({
      id: note.id,
      incidentId: note.incidentId,
      content: note.content,
      createdAt: note.createdAt,
      member: {
        id: note.userId,
        name: note.userName,
        email: note.userEmail,
        avatarUrl: note.userAvatarUrl,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating incident note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
