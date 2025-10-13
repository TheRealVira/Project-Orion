import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { TeamSLASettings } from '@/types';

// GET /api/teams/[id]/sla - Get SLA settings for a team
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDatabase();

    const settings = db.prepare('SELECT * FROM team_sla_settings WHERE teamId = ?').get(id) as any;

    if (!settings) {
      return NextResponse.json({ error: 'SLA settings not found' }, { status: 404 });
    }

    // Parse business days from comma-separated string to array
    const businessDays = settings.businessDays.split(',').map((day: string) => parseInt(day));

    const slaSettings: TeamSLASettings = {
      id: settings.id,
      teamId: settings.teamId,
      responseTimeCritical: settings.responseTimeCritical,
      responseTimeHigh: settings.responseTimeHigh,
      responseTimeMedium: settings.responseTimeMedium,
      responseTimeLow: settings.responseTimeLow,
      resolutionTimeCritical: settings.resolutionTimeCritical,
      resolutionTimeHigh: settings.resolutionTimeHigh,
      resolutionTimeMedium: settings.resolutionTimeMedium,
      resolutionTimeLow: settings.resolutionTimeLow,
      businessHoursOnly: Boolean(settings.businessHoursOnly),
      businessHoursStart: settings.businessHoursStart,
      businessHoursEnd: settings.businessHoursEnd,
      businessDays,
      timezone: settings.timezone,
      enabled: Boolean(settings.enabled),
      createdAt: new Date(settings.createdAt),
      updatedAt: new Date(settings.updatedAt),
    };

    return NextResponse.json(slaSettings);
  } catch (error) {
    console.error('Error fetching SLA settings:', error);
    return NextResponse.json({ error: 'Failed to fetch SLA settings' }, { status: 500 });
  }
}

// PUT /api/teams/[id]/sla - Create or update SLA settings for a team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: teamId } = params;
    const body = await request.json();
    const {
      responseTimeCritical,
      responseTimeHigh,
      responseTimeMedium,
      responseTimeLow,
      resolutionTimeCritical,
      resolutionTimeHigh,
      resolutionTimeMedium,
      resolutionTimeLow,
      businessHoursOnly,
      businessHoursStart,
      businessHoursEnd,
      businessDays,
      timezone,
      enabled,
    } = body;

    // Validate required fields
    if (
      responseTimeCritical === undefined ||
      responseTimeHigh === undefined ||
      responseTimeMedium === undefined ||
      responseTimeLow === undefined ||
      resolutionTimeCritical === undefined ||
      resolutionTimeHigh === undefined ||
      resolutionTimeMedium === undefined ||
      resolutionTimeLow === undefined
    ) {
      return NextResponse.json({ error: 'All SLA time values are required' }, { status: 400 });
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    // Check if settings already exist
    const existing = db.prepare('SELECT id FROM team_sla_settings WHERE teamId = ?').get(teamId) as any;

    const businessDaysStr = Array.isArray(businessDays) ? businessDays.join(',') : '1,2,3,4,5';

    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE team_sla_settings
        SET responseTimeCritical = ?,
            responseTimeHigh = ?,
            responseTimeMedium = ?,
            responseTimeLow = ?,
            resolutionTimeCritical = ?,
            resolutionTimeHigh = ?,
            resolutionTimeMedium = ?,
            resolutionTimeLow = ?,
            businessHoursOnly = ?,
            businessHoursStart = ?,
            businessHoursEnd = ?,
            businessDays = ?,
            timezone = ?,
            enabled = ?,
            updatedAt = ?
        WHERE teamId = ?
      `).run(
        responseTimeCritical,
        responseTimeHigh,
        responseTimeMedium,
        responseTimeLow,
        resolutionTimeCritical,
        resolutionTimeHigh,
        resolutionTimeMedium,
        resolutionTimeLow,
        businessHoursOnly ? 1 : 0,
        businessHoursStart || '09:00',
        businessHoursEnd || '17:00',
        businessDaysStr,
        timezone || 'UTC',
        enabled !== false ? 1 : 0,
        now,
        teamId
      );
    } else {
      // Create new settings
      const id = `sla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO team_sla_settings (
          id, teamId, responseTimeCritical, responseTimeHigh, responseTimeMedium, responseTimeLow,
          resolutionTimeCritical, resolutionTimeHigh, resolutionTimeMedium, resolutionTimeLow,
          businessHoursOnly, businessHoursStart, businessHoursEnd, businessDays, timezone,
          enabled, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        teamId,
        responseTimeCritical,
        responseTimeHigh,
        responseTimeMedium,
        responseTimeLow,
        resolutionTimeCritical,
        resolutionTimeHigh,
        resolutionTimeMedium,
        resolutionTimeLow,
        businessHoursOnly ? 1 : 0,
        businessHoursStart || '09:00',
        businessHoursEnd || '17:00',
        businessDaysStr,
        timezone || 'UTC',
        enabled !== false ? 1 : 0,
        now,
        now
      );
    }

    // Fetch and return the updated/created settings
    const settings = db.prepare('SELECT * FROM team_sla_settings WHERE teamId = ?').get(teamId) as any;
    const parsedBusinessDays = settings.businessDays.split(',').map((day: string) => parseInt(day));

    const slaSettings: TeamSLASettings = {
      id: settings.id,
      teamId: settings.teamId,
      responseTimeCritical: settings.responseTimeCritical,
      responseTimeHigh: settings.responseTimeHigh,
      responseTimeMedium: settings.responseTimeMedium,
      responseTimeLow: settings.responseTimeLow,
      resolutionTimeCritical: settings.resolutionTimeCritical,
      resolutionTimeHigh: settings.resolutionTimeHigh,
      resolutionTimeMedium: settings.resolutionTimeMedium,
      resolutionTimeLow: settings.resolutionTimeLow,
      businessHoursOnly: Boolean(settings.businessHoursOnly),
      businessHoursStart: settings.businessHoursStart,
      businessHoursEnd: settings.businessHoursEnd,
      businessDays: parsedBusinessDays,
      timezone: settings.timezone,
      enabled: Boolean(settings.enabled),
      createdAt: new Date(settings.createdAt),
      updatedAt: new Date(settings.updatedAt),
    };

    return NextResponse.json(slaSettings);
  } catch (error) {
    console.error('Error updating SLA settings:', error);
    return NextResponse.json({ error: 'Failed to update SLA settings' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/sla - Delete SLA settings for a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDatabase();

    const result = db.prepare('DELETE FROM team_sla_settings WHERE teamId = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'SLA settings not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SLA settings:', error);
    return NextResponse.json({ error: 'Failed to delete SLA settings' }, { status: 500 });
  }
}
