import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Incident, TeamSLASettings } from '@/types';
import { calculateSLADeadline, getResponseTarget, getResolutionTarget } from '@/lib/utils/sla';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// GET /api/incidents - List all incidents
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    
    // Optional filters
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const teamId = searchParams.get('teamId');
    const assignedToId = searchParams.get('assignedToId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = `
      SELECT i.*, 
             t.name as teamName, t.color as teamColor,
             u.name as assignedToName, u.email as assignedToEmail
      FROM incidents i
      LEFT JOIN teams t ON i.teamId = t.id
      LEFT JOIN users u ON i.assignedToId = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (severity) {
      query += ' AND i.severity = ?';
      params.push(severity);
    }
    
    if (teamId) {
      query += ' AND i.teamId = ?';
      params.push(teamId);
    }
    
    if (assignedToId) {
      query += ' AND i.assignedToId = ?';
      params.push(assignedToId);
    }
    
    if (startDate) {
      query += ' AND i.createdAt >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND i.createdAt <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY i.createdAt DESC';
    
    const incidents = db.prepare(query).all(...params) as any[];
    
    // Parse JSON fields
    const parsedIncidents = incidents.map(inc => ({
      ...inc,
      tags: inc.tags ? JSON.parse(inc.tags) : [],
      metadata: inc.metadata ? JSON.parse(inc.metadata) : {},
      team: inc.teamId ? { id: inc.teamId, name: inc.teamName, color: inc.teamColor } : null,
      assignedTo: inc.assignedToId ? { 
        id: inc.assignedToId, 
        name: inc.assignedToName, 
        email: inc.assignedToEmail 
      } : null,
    }));
    
    return NextResponse.json(parsedIncidents);
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/incidents - Create a new incident
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    
    const {
      fingerprint,
      source,
      sourceId,
      title,
      description,
      severity = 'medium',
      status = 'new',
      teamId,
      assignedToId,
      tags = [],
      metadata = {},
    } = body;
    
    // Validate required fields
    if (!fingerprint || !source || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: fingerprint, source, title' },
        { status: 400 }
      );
    }
    
    // Check if incident with this fingerprint already exists
    const existing = db.prepare('SELECT id, status FROM incidents WHERE fingerprint = ?').get(fingerprint) as any;
    
    if (existing) {
      // If the incident is closed, reopen it
      if (existing.status === 'closed') {
        const now = new Date().toISOString();
        db.prepare(`
          UPDATE incidents 
          SET status = 'new', updatedAt = ?, closedAt = NULL
          WHERE id = ?
        `).run(now, existing.id);
        
        return NextResponse.json({ 
          id: existing.id, 
          status: 'reopened',
          message: 'Incident reopened'
        });
      }
      
      // Otherwise, just update the timestamp
      const now = new Date().toISOString();
      db.prepare('UPDATE incidents SET updatedAt = ? WHERE id = ?').run(now, existing.id);
      
      return NextResponse.json({ 
        id: existing.id, 
        status: 'updated',
        message: 'Incident already exists'
      });
    }
    
    // Create new incident
    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const createdAt = new Date(now);
    
    // Calculate SLA deadlines if team has SLA settings
    let slaResponseDeadline: string | null = null;
    let slaResolutionDeadline: string | null = null;
    
    if (teamId) {
      const slaSettings = db.prepare('SELECT * FROM team_sla_settings WHERE teamId = ? AND enabled = 1').get(teamId) as any;
      
      if (slaSettings) {
        const settings: TeamSLASettings = {
          id: slaSettings.id,
          teamId: slaSettings.teamId,
          responseTimeCritical: slaSettings.responseTimeCritical,
          responseTimeHigh: slaSettings.responseTimeHigh,
          responseTimeMedium: slaSettings.responseTimeMedium,
          responseTimeLow: slaSettings.responseTimeLow,
          resolutionTimeCritical: slaSettings.resolutionTimeCritical,
          resolutionTimeHigh: slaSettings.resolutionTimeHigh,
          resolutionTimeMedium: slaSettings.resolutionTimeMedium,
          resolutionTimeLow: slaSettings.resolutionTimeLow,
          businessHoursOnly: Boolean(slaSettings.businessHoursOnly),
          businessHoursStart: slaSettings.businessHoursStart,
          businessHoursEnd: slaSettings.businessHoursEnd,
          businessDays: slaSettings.businessDays.split(',').map((d: string) => parseInt(d)),
          timezone: slaSettings.timezone,
          enabled: Boolean(slaSettings.enabled),
          createdAt: new Date(slaSettings.createdAt),
          updatedAt: new Date(slaSettings.updatedAt),
        };
        
        const responseTarget = getResponseTarget(severity as any, settings);
        const resolutionTarget = getResolutionTarget(severity as any, settings);
        
        slaResponseDeadline = calculateSLADeadline(createdAt, responseTarget, settings).toISOString();
        slaResolutionDeadline = calculateSLADeadline(createdAt, resolutionTarget, settings).toISOString();
      }
    }
    
    db.prepare(`
      INSERT INTO incidents (
        id, fingerprint, source, sourceId, title, description,
        severity, status, teamId, assignedToId, tags, metadata,
        createdAt, updatedAt, slaResponseDeadline, slaResolutionDeadline,
        slaResponseBreached, slaResolutionBreached
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      fingerprint,
      source,
      sourceId,
      title,
      description,
      severity,
      status,
      teamId || null,
      assignedToId || null,
      JSON.stringify(tags),
      JSON.stringify(metadata),
      now,
      now,
      slaResponseDeadline,
      slaResolutionDeadline,
      0,
      0
    );
    
    // Fetch the created incident with team and member info
    const incident = db.prepare(`
      SELECT i.*, 
             t.name as teamName, t.color as teamColor,
             u.name as assignedToName, u.email as assignedToEmail
      FROM incidents i
      LEFT JOIN teams t ON i.teamId = t.id
      LEFT JOIN users u ON i.assignedToId = u.id
      WHERE i.id = ?
    `).get(id) as any;
    
    return NextResponse.json({
      ...incident,
      tags: JSON.parse(incident.tags),
      metadata: JSON.parse(incident.metadata),
      team: incident.teamId ? { id: incident.teamId, name: incident.teamName, color: incident.teamColor } : null,
      assignedTo: incident.assignedToId ? { 
        id: incident.assignedToId, 
        name: incident.assignedToName, 
        email: incident.assignedToEmail 
      } : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident', details: error.message },
      { status: 500 }
    );
  }
}
