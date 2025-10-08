import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import crypto from 'crypto';

// Helper function to generate fingerprint
function generateFingerprint(source: string, title: string, metadata: Record<string, any> = {}): string {
  const data = JSON.stringify({ source, title, ...metadata });
  return crypto.createHash('md5').update(data).digest('hex');
}

// Helper function to determine team based on current on-call schedule
async function determineOnCallTeam(db: any): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const assignment = db.prepare(`
    SELECT teamId FROM date_assignments
    WHERE date = ?
    LIMIT 1
  `).get(today) as any;
  
  return assignment?.teamId || null;
}

// Helper function to determine team member from team
async function getOnCallMember(db: any, teamId: string): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const user = db.prepare(`
    SELECT au.userId
    FROM date_assignments da
    JOIN assignment_users au ON da.id = au.assignmentId
    WHERE da.date = ? AND da.teamId = ?
    LIMIT 1
  `).get(today, teamId) as any;
  
  return user?.userId || null;
}

// POST /api/webhooks/alerts - Receive alerts from external systems
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    
    // Extract common fields from various alert formats
    let source = 'unknown';
    let sourceId = null;
    let title = 'Unknown Alert';
    let description = '';
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let metadata: Record<string, any> = {};
    let tags: string[] = [];
    
    // Detect alert source and extract fields
    if (body.alerts && Array.isArray(body.alerts)) {
      // Prometheus/Alertmanager format
      source = 'prometheus';
      const alert = body.alerts[0]; // Process first alert
      
      if (alert) {
        sourceId = alert.fingerprint;
        title = alert.labels?.alertname || 'Prometheus Alert';
        description = alert.annotations?.description || alert.annotations?.summary || '';
        
        // Map Prometheus severity to our severity
        const promSeverity = alert.labels?.severity?.toLowerCase();
        if (promSeverity === 'critical' || promSeverity === 'page') {
          severity = 'critical';
        } else if (promSeverity === 'warning') {
          severity = 'high';
        }
        
        metadata = {
          labels: alert.labels,
          annotations: alert.annotations,
          startsAt: alert.startsAt,
          endsAt: alert.endsAt,
          generatorURL: alert.generatorURL,
        };
        
        tags = Object.keys(alert.labels || {});
      }
    } else if (body.title || body.state) {
      // Grafana format
      source = 'grafana';
      sourceId = body.ruleId?.toString() || body.evalMatches?.[0]?.metric;
      title = body.title || body.ruleName || 'Grafana Alert';
      description = body.message || '';
      
      // Map Grafana state to severity
      if (body.state === 'alerting') {
        severity = 'high';
      } else if (body.state === 'ok') {
        severity = 'low';
      }
      
      metadata = {
        state: body.state,
        ruleId: body.ruleId,
        ruleName: body.ruleName,
        ruleUrl: body.ruleUrl,
        evalMatches: body.evalMatches,
        tags: body.tags,
      };
      
      tags = body.tags || [];
    } else if (body.ProblemID || body.ProblemTitle) {
      // Dynatrace format
      source = 'dynatrace';
      sourceId = body.ProblemID;
      title = body.ProblemTitle || 'Dynatrace Problem';
      description = body.ProblemDetails?.text || '';
      
      // Map Dynatrace severity
      const dtSeverity = body.ProblemSeverity?.toLowerCase();
      if (dtSeverity === 'error' || dtSeverity === 'resource') {
        severity = 'critical';
      } else if (dtSeverity === 'slowdown') {
        severity = 'high';
      }
      
      metadata = {
        problemId: body.ProblemID,
        impactLevel: body.ImpactLevel,
        problemSeverity: body.ProblemSeverity,
        affectedEntities: body.AffectedEntities,
        tags: body.Tags,
      };
      
      tags = body.Tags || [];
    } else {
      // Generic format - try to extract what we can
      source = body.source || 'generic';
      sourceId = body.id || body.alertId || body.incidentId;
      title = body.title || body.name || body.alert_name || 'Alert';
      description = body.description || body.message || body.details || '';
      severity = body.severity || 'medium';
      metadata = body;
      tags = body.tags || [];
    }
    
    // Generate fingerprint for deduplication
    const fingerprint = generateFingerprint(source, title, metadata);
    
    // Determine on-call team and member
    const teamId = await determineOnCallTeam(db);
    const assignedToId = teamId ? await getOnCallMember(db, teamId) : null;
    
    // Check if incident already exists
    const existing = db.prepare('SELECT id, status FROM incidents WHERE fingerprint = ?').get(fingerprint) as any;
    
    if (existing) {
      // If closed, reopen it
      if (existing.status === 'closed') {
        const now = new Date().toISOString();
        db.prepare(`
          UPDATE incidents 
          SET status = 'new', updatedAt = ?, closedAt = NULL
          WHERE id = ?
        `).run(now, existing.id);
        
        // Add a system note
        const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO incident_notes (id, incidentId, userId, content, createdAt)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          noteId,
          existing.id,
          null,
          'Alert triggered again - incident reopened',
          now
        );
        
        return NextResponse.json({ 
          id: existing.id, 
          status: 'reopened',
          message: 'Incident reopened'
        });
      }
      
      // Update timestamp only
      const now = new Date().toISOString();
      db.prepare('UPDATE incidents SET updatedAt = ? WHERE id = ?').run(now, existing.id);
      
      return NextResponse.json({ 
        id: existing.id, 
        status: 'updated',
        message: 'Incident already active'
      });
    }
    
    // Create new incident
    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO incidents (
        id, fingerprint, source, sourceId, title, description,
        severity, status, teamId, assignedToId, tags, metadata,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      fingerprint,
      source,
      sourceId,
      title,
      description,
      severity,
      'new',
      teamId,
      assignedToId,
      JSON.stringify(tags),
      JSON.stringify(metadata),
      now,
      now
    );
    
    // Send email notification to assigned member
    if (assignedToId) {
      try {
        const member = db.prepare('SELECT name, email FROM users WHERE id = ?').get(assignedToId) as any;
        const team = teamId ? db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId) as any : null;
        
        if (member && member.email) {
          // Dynamic import to avoid build errors if nodemailer isn't installed
          const { sendIncidentCreatedEmail } = await import('@/lib/email');
          await sendIncidentCreatedEmail(member.email, member.name, {
            incidentId: id,
            title,
            description: description || undefined,
            severity,
            status: 'new',
            source,
            teamName: team?.name,
            assignedToName: member.name,
            createdAt: now,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the incident creation if email fails
      }
    }
    
    return NextResponse.json({
      id,
      status: 'created',
      message: 'Incident created successfully',
      assignedTo: assignedToId,
      team: teamId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing alert webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process alert', details: error.message },
      { status: 500 }
    );
  }
}
