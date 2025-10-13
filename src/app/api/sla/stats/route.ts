import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { calculateSLAStatus } from '@/lib/sla';
import { Incident, TeamSLASettings } from '@/types';

// GET /api/sla/stats - Get comprehensive SLA statistics
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    
    // Optional filters
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
    // Build base query for incidents
    let query = `
      SELECT i.*, 
             t.name as teamName, t.color as teamColor
      FROM incidents i
      LEFT JOIN teams t ON i.teamId = t.id
      WHERE i.status != 'closed'
    `;
    
    const params: any[] = [];
    
    if (teamId) {
      query += ' AND i.teamId = ?';
      params.push(teamId);
    }
    
    if (startDate) {
      query += ' AND i.createdAt >= ?';
      params.push(startDate);
    }
    
    query += ' AND i.createdAt <= ?';
    params.push(endDate);
    
    const openIncidents = db.prepare(query).all(...params) as any[];
    
    // Fetch all team SLA settings
    const slaSettingsRows = db.prepare('SELECT * FROM team_sla_settings WHERE enabled = 1').all() as any[];
    const slaSettingsMap: Record<string, TeamSLASettings> = {};
    
    slaSettingsRows.forEach(row => {
      slaSettingsMap[row.teamId] = {
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
        businessHoursOnly: row.businessHoursOnly === 1,
        businessHoursStart: row.businessHoursStart,
        businessHoursEnd: row.businessHoursEnd,
        businessDays: row.businessDays.split(',').map(Number),
        timezone: row.timezone,
        enabled: row.enabled === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    });
    
    // Analyze open incidents
    const atRiskIncidents: any[] = [];
    const breachedIncidents: any[] = [];
    const healthyIncidents: any[] = [];
    
    openIncidents.forEach(inc => {
      const incident: Incident = {
        ...inc,
        tags: inc.tags ? JSON.parse(inc.tags) : [],
        metadata: inc.metadata ? JSON.parse(inc.metadata) : {},
        team: inc.teamId ? { id: inc.teamId, name: inc.teamName, color: inc.teamColor } : null,
        slaResponseBreached: inc.slaResponseBreached === 1,
        slaResolutionBreached: inc.slaResolutionBreached === 1,
      };
      
      if (incident.teamId && slaSettingsMap[incident.teamId]) {
        const slaStatus = calculateSLAStatus(incident, slaSettingsMap[incident.teamId]);
        
        if (slaStatus.isResponseBreached || slaStatus.isResolutionBreached) {
          breachedIncidents.push({ incident, slaStatus });
        } else if (slaStatus.responseTimePercentage > 80 || slaStatus.resolutionTimePercentage > 80) {
          atRiskIncidents.push({ incident, slaStatus });
        } else {
          healthyIncidents.push({ incident, slaStatus });
        }
      }
    });
    
    // Get historical breach data for closed incidents
    let historicalQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN slaResponseBreached = 1 THEN 1 ELSE 0 END) as responseBreaches,
        SUM(CASE WHEN slaResolutionBreached = 1 THEN 1 ELSE 0 END) as resolutionBreaches,
        AVG(CASE WHEN firstResponseAt IS NOT NULL 
          THEN (julianday(firstResponseAt) - julianday(createdAt)) * 24 * 60 
          ELSE NULL END) as avgResponseTimeMinutes,
        AVG(CASE WHEN closedAt IS NOT NULL 
          THEN (julianday(closedAt) - julianday(createdAt)) * 24 * 60 
          ELSE NULL END) as avgResolutionTimeMinutes
      FROM incidents
      WHERE status = 'closed'
    `;
    
    const historicalParams: any[] = [];
    
    if (teamId) {
      historicalQuery += ' AND teamId = ?';
      historicalParams.push(teamId);
    }
    
    if (startDate) {
      historicalQuery += ' AND createdAt >= ?';
      historicalParams.push(startDate);
    }
    
    historicalQuery += ' AND createdAt <= ?';
    historicalParams.push(endDate);
    
    const historicalData = db.prepare(historicalQuery).get(...historicalParams) as any;
    
    // Calculate compliance rates
    const totalHistorical = historicalData.total || 0;
    const responseCompliance = totalHistorical > 0 
      ? ((totalHistorical - (historicalData.responseBreaches || 0)) / totalHistorical * 100)
      : 100;
    const resolutionCompliance = totalHistorical > 0 
      ? ((totalHistorical - (historicalData.resolutionBreaches || 0)) / totalHistorical * 100)
      : 100;
    
    // Get team breakdown
    const teamBreakdownQuery = `
      SELECT 
        t.id,
        t.name,
        t.color,
        COUNT(i.id) as totalIncidents,
        SUM(CASE WHEN i.slaResponseBreached = 1 THEN 1 ELSE 0 END) as responseBreaches,
        SUM(CASE WHEN i.slaResolutionBreached = 1 THEN 1 ELSE 0 END) as resolutionBreaches
      FROM teams t
      LEFT JOIN incidents i ON t.id = i.teamId 
        AND i.status = 'closed'
        ${startDate ? 'AND i.createdAt >= ?' : ''}
        AND i.createdAt <= ?
      GROUP BY t.id
      HAVING totalIncidents > 0
      ORDER BY totalIncidents DESC
    `;
    
    const teamBreakdownParams = startDate ? [startDate, endDate] : [endDate];
    const teamBreakdown = db.prepare(teamBreakdownQuery).all(...teamBreakdownParams) as any[];
    
    const response = {
      summary: {
        totalOpenIncidents: openIncidents.length,
        atRiskCount: atRiskIncidents.length,
        breachedCount: breachedIncidents.length,
        healthyCount: healthyIncidents.length,
        responseCompliance: Math.round(responseCompliance * 10) / 10,
        resolutionCompliance: Math.round(resolutionCompliance * 10) / 10,
        avgResponseTimeMinutes: historicalData.avgResponseTimeMinutes 
          ? Math.round(historicalData.avgResponseTimeMinutes) 
          : null,
        avgResolutionTimeMinutes: historicalData.avgResolutionTimeMinutes 
          ? Math.round(historicalData.avgResolutionTimeMinutes) 
          : null,
      },
      historical: {
        totalClosed: totalHistorical,
        responseBreaches: historicalData.responseBreaches || 0,
        resolutionBreaches: historicalData.resolutionBreaches || 0,
      },
      teamBreakdown: teamBreakdown.map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        totalIncidents: team.totalIncidents,
        responseCompliance: team.totalIncidents > 0 
          ? Math.round((team.totalIncidents - team.responseBreaches) / team.totalIncidents * 100 * 10) / 10
          : 100,
        resolutionCompliance: team.totalIncidents > 0 
          ? Math.round((team.totalIncidents - team.resolutionBreaches) / team.totalIncidents * 100 * 10) / 10
          : 100,
      })),
    };
    
    // Include detailed incident lists if requested
    if (includeDetails) {
      (response as any).atRiskIncidents = atRiskIncidents.map(item => ({
        ...item.incident,
        slaStatus: item.slaStatus,
      }));
      (response as any).breachedIncidents = breachedIncidents.map(item => ({
        ...item.incident,
        slaStatus: item.slaStatus,
      }));
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching SLA stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SLA statistics', details: error.message },
      { status: 500 }
    );
  }
}
