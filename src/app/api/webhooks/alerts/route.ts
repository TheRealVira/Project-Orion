import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import config, { isFeatureEnabled, logger } from '@/lib/config';
import crypto from 'crypto';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// Helper function to generate fingerprint
function generateFingerprint(source: string, title: string, metadata: Record<string, any> = {}): string {
  const data = JSON.stringify({ source, title, ...metadata });
  return crypto.createHash('md5').update(data).digest('hex');
}

// Helper function to determine team based on alert tags/labels and on-call schedule
async function determineOnCallTeam(db: any, tags: string[] = []): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  
  // Strategy 1: Try to match alert tags to team names (case-insensitive)
  if (tags && tags.length > 0) {
    const teams = db.prepare('SELECT id, name FROM teams').all() as Array<{ id: string; name: string }>;
    
    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase().trim();
      const matchedTeam = teams.find(team => team.name.toLowerCase().trim() === normalizedTag);
      
      if (matchedTeam) {
        logger.info(`✅ Matched alert tag "${tag}" to team "${matchedTeam.name}"`);
        return matchedTeam.id;
      }
    }
    
    logger.info(`ℹ️ No team matched alert tags: ${tags.join(', ')}`);
  }
  
  // Strategy 2: Use today's on-call team
  const assignment = db.prepare(`
    SELECT teamId FROM date_assignments
    WHERE date = ?
    LIMIT 1
  `).get(today) as any;
  
  if (assignment?.teamId) {
    logger.info(`✅ Assigned to on-call team for today`);
    return assignment?.teamId;
  }
  
  // Strategy 3: Fallback to first available team
  const firstTeam = db.prepare('SELECT id, name FROM teams LIMIT 1').get() as { id: string; name: string } | undefined;
  
  if (firstTeam) {
    logger.info(`⚠️ No on-call team today. Assigned to first available team: "${firstTeam.name}"`);
    return firstTeam.id;
  }
  
  logger.warn(`❌ No teams available in the system`);
  return null;
}

// Helper function to determine team member from team
async function getOnCallMember(db: any, teamId: string): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  
  // Strategy 1: Get member who is on-call TODAY for this specific team
  const onCallUser = db.prepare(`
    SELECT au.userId
    FROM date_assignments da
    JOIN assignment_users au ON da.id = au.assignmentId
    WHERE da.date = ? AND da.teamId = ?
    LIMIT 1
  `).get(today, teamId) as any;
  
  if (onCallUser?.userId) {
    logger.info(`✅ Found on-call member for team today`);
    return onCallUser.userId;
  }
  
  // Strategy 2: Get team owner as fallback
  const owner = db.prepare(`
    SELECT userId
    FROM team_owners
    WHERE teamId = ?
    LIMIT 1
  `).get(teamId) as any;
  
  if (owner?.userId) {
    logger.info(`⚠️ No on-call member today. Assigned to team owner`);
    return owner.userId;
  }
  
  // Strategy 3: Get any team member as last resort
  const anyMember = db.prepare(`
    SELECT userId
    FROM team_members
    WHERE teamId = ?
    LIMIT 1
  `).get(teamId) as any;
  
  if (anyMember?.userId) {
    logger.info(`⚠️ No owner found. Assigned to first team member`);
    return anyMember.userId;
  }
  
  logger.warn(`⚠️ Team has no members. Incident assigned to team without specific member`);
  return null;
}

// POST /api/webhooks/alerts - Receive alerts from external systems
export async function POST(request: NextRequest) {
  // Check if webhooks are enabled
  if (!isFeatureEnabled('webhooks')) {
    logger.warn('🚫 Webhooks are disabled. Ignoring alert.');
    return NextResponse.json(
      { error: 'Webhooks are disabled' },
      { status: 503 }
    );
  }

  try {
    const db = getDatabase();
    const body = await request.json();

    // Verify webhook secret if configured
    if (config.webhook.secret) {
      const signature = request.headers.get('x-webhook-signature');
      const timestamp = request.headers.get('x-webhook-timestamp');

      if (!signature || !timestamp) {
        logger.warn('🚫 Webhook missing security headers');
        return NextResponse.json(
          { error: 'Missing security headers' },
          { status: 401 }
        );
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', config.webhook.secret)
        .update(timestamp + JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('🚫 Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      // Check timestamp (prevent replay attacks - 5 minute window)
      const requestTime = parseInt(timestamp);
      const currentTime = Date.now();
      if (Math.abs(currentTime - requestTime) > 300000) {
        logger.warn('🚫 Webhook timestamp too old');
        return NextResponse.json(
          { error: 'Request timestamp too old' },
          { status: 401 }
        );
      }
    }
    
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
        
        // Extract both label keys AND values as potential team identifiers
        tags = [];
        if (alert.labels) {
          tags.push(...Object.keys(alert.labels));
          tags.push(...Object.values(alert.labels).filter((v): v is string => typeof v === 'string'));
        }
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
      
      // Also extract common team identifier fields as tags
      const teamFields = ['team', 'service', 'product', 'component', 'app', 'application'];
      for (const field of teamFields) {
        if (body[field] && typeof body[field] === 'string') {
          tags.push(body[field]);
        }
      }
    }
    
    // Generate fingerprint for deduplication
    const fingerprint = generateFingerprint(source, title, metadata);
    
    // Determine on-call team and member (match by tags first, then fallback to on-call schedule)
    const teamId = await determineOnCallTeam(db, tags);
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
