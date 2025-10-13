import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { TeamSLASettings, Incident } from '@/types';
import { calculateSLAStatus, formatMinutes } from '@/lib/sla';
import { sendSLABreachEmail } from '@/lib/email';
import { logger } from '@/lib/config';

/**
 * Background job to check for SLA breaches and send notifications
 * This can be called by a cron job or scheduled task
 * 
 * GET /api/sla/check - Check all open incidents for SLA breaches
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    
    // Get all open incidents (not closed) with teams that have SLA settings
    const incidents = db.prepare(`
      SELECT i.*, 
             t.name as teamName,
             u.name as assignedToName, 
             u.email as assignedToEmail,
             s.* as slaSettings
      FROM incidents i
      INNER JOIN teams t ON i.teamId = t.id
      INNER JOIN team_sla_settings s ON t.id = s.teamId
      LEFT JOIN users u ON i.assignedToId = u.id
      WHERE i.status != 'closed' 
        AND s.enabled = 1
    `).all() as any[];

    logger.info(`🔍 Checking ${incidents.length} incidents for SLA breaches...`);

    const now = new Date();
    let notificationsSent = 0;
    let breachesFound = 0;
    let atRiskFound = 0;

    for (const row of incidents) {
      // Parse SLA settings
      const slaSettings: TeamSLASettings = {
        id: row.id,
        teamId: row.teamId,
        responseTimeCritical: row.responseTimeCritical,
        responseTimeHigh: row.responseTimeHigh,
        responseTimeMedium: row.responseTimeMedium,
        responseTimeLow: row.responseTimeLow,
        resolutionTimeCritical: row.resolutionTimeCritical,
        resolutionTimeHigh: row.resolutionTimeHigh,
        resolutionTimeMedium: row.resolutionTimeMedium,
        resolutionTimeLow: row.resolutionTimeLow,
        businessHoursOnly: Boolean(row.businessHoursOnly),
        businessHoursStart: row.businessHoursStart,
        businessHoursEnd: row.businessHoursEnd,
        businessDays: row.businessDays.split(',').map((d: string) => parseInt(d)),
        timezone: row.timezone,
        enabled: Boolean(row.enabled),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };

      // Parse incident
      const incident: Incident = {
        id: row.id,
        fingerprint: row.fingerprint,
        source: row.source,
        sourceId: row.sourceId,
        title: row.title,
        description: row.description,
        severity: row.severity,
        status: row.status,
        teamId: row.teamId,
        assignedToId: row.assignedToId,
        tags: row.tags ? JSON.parse(row.tags) : [],
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt) : undefined,
        closedAt: row.closedAt ? new Date(row.closedAt) : undefined,
        firstResponseAt: row.firstResponseAt ? new Date(row.firstResponseAt) : undefined,
        slaResponseDeadline: row.slaResponseDeadline ? new Date(row.slaResponseDeadline) : undefined,
        slaResolutionDeadline: row.slaResolutionDeadline ? new Date(row.slaResolutionDeadline) : undefined,
        slaResponseBreached: Boolean(row.slaResponseBreached),
        slaResolutionBreached: Boolean(row.slaResolutionBreached),
      };

      // Calculate SLA status
      const slaStatus = calculateSLAStatus(incident, slaSettings, now);

      // Check response time
      if (!incident.firstResponseAt) {
        if (slaStatus.isResponseBreached && !incident.slaResponseBreached) {
          // Response SLA just breached - update DB and send notification
          db.prepare('UPDATE incidents SET slaResponseBreached = 1 WHERE id = ?').run(incident.id);
          breachesFound++;
          
          if (row.assignedToEmail) {
            await sendSLABreachEmail(
              row.assignedToEmail,
              row.assignedToName || 'Team Member',
              {
                incidentId: incident.id,
                title: incident.title,
                description: incident.description,
                severity: incident.severity,
                status: incident.status,
                source: incident.source,
                teamName: row.teamName,
                assignedToName: row.assignedToName,
                createdAt: incident.createdAt.toISOString(),
              },
              'response',
              formatMinutes(slaStatus.responseTimeRemaining)
            );
            notificationsSent++;
          }
          
          logger.warn(`⚠️ Response SLA breached for incident ${incident.id} (${incident.title})`);
        } else if (slaStatus.isResponseAtRisk && !incident.slaResponseBreached) {
          // Response SLA at risk (>80%) - send warning if not already sent
          // Check if we've already sent a warning (you might want to track this in DB)
          atRiskFound++;
          
          if (row.assignedToEmail) {
            await sendSLABreachEmail(
              row.assignedToEmail,
              row.assignedToName || 'Team Member',
              {
                incidentId: incident.id,
                title: incident.title,
                description: incident.description,
                severity: incident.severity,
                status: incident.status,
                source: incident.source,
                teamName: row.teamName,
                assignedToName: row.assignedToName,
                createdAt: incident.createdAt.toISOString(),
              },
              'response',
              formatMinutes(slaStatus.responseTimeRemaining)
            );
            notificationsSent++;
          }
          
          logger.info(`⚠️ Response SLA at risk for incident ${incident.id} (${incident.title})`);
        }
      }

      // Check resolution time
      if (!incident.closedAt) {
        if (slaStatus.isResolutionBreached && !incident.slaResolutionBreached) {
          // Resolution SLA just breached - update DB and send notification
          db.prepare('UPDATE incidents SET slaResolutionBreached = 1 WHERE id = ?').run(incident.id);
          breachesFound++;
          
          if (row.assignedToEmail) {
            await sendSLABreachEmail(
              row.assignedToEmail,
              row.assignedToName || 'Team Member',
              {
                incidentId: incident.id,
                title: incident.title,
                description: incident.description,
                severity: incident.severity,
                status: incident.status,
                source: incident.source,
                teamName: row.teamName,
                assignedToName: row.assignedToName,
                createdAt: incident.createdAt.toISOString(),
              },
              'resolution',
              formatMinutes(slaStatus.resolutionTimeRemaining)
            );
            notificationsSent++;
          }
          
          logger.warn(`⚠️ Resolution SLA breached for incident ${incident.id} (${incident.title})`);
        } else if (slaStatus.isResolutionAtRisk && !incident.slaResolutionBreached) {
          // Resolution SLA at risk (>80%)
          atRiskFound++;
          
          if (row.assignedToEmail) {
            await sendSLABreachEmail(
              row.assignedToEmail,
              row.assignedToName || 'Team Member',
              {
                incidentId: incident.id,
                title: incident.title,
                description: incident.description,
                severity: incident.severity,
                status: incident.status,
                source: incident.source,
                teamName: row.teamName,
                assignedToName: row.assignedToName,
                createdAt: incident.createdAt.toISOString(),
              },
              'resolution',
              formatMinutes(slaStatus.resolutionTimeRemaining)
            );
            notificationsSent++;
          }
          
          logger.info(`⚠️ Resolution SLA at risk for incident ${incident.id} (${incident.title})`);
        }
      }
    }

    const result = {
      success: true,
      checked: incidents.length,
      breaches: breachesFound,
      atRisk: atRiskFound,
      notificationsSent,
      timestamp: now.toISOString(),
    };

    logger.info(`✅ SLA check complete: ${JSON.stringify(result)}`);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('❌ Error checking SLA breaches:', error);
    return NextResponse.json(
      { error: 'Failed to check SLA breaches', details: error.message },
      { status: 500 }
    );
  }
}
