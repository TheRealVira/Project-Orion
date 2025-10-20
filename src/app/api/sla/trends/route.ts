import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// Helper function to fill in missing dates with default values
function fillMissingDates(data: any[], startDate: Date, endDate: Date, defaultValue: any) {
  const dateMap = new Map(data.map(item => [item.date, item]));
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });
  
  return allDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateMap.get(dateStr) || { date: dateStr, ...defaultValue };
  });
}

// GET /api/sla/trends - Get SLA trends over time
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    
    const teamId = searchParams.get('teamId');
    const days = parseInt(searchParams.get('days') || '30', 10);
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
    
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    // If no specific team selected, fetch per-team breakdown
    if (!teamId) {
      // First get all teams
      const teams = db.prepare('SELECT id, name, color FROM teams').all() as any[];
      
      // Get trends for each team
      const teamTrendsMap: any = {};
      
      teams.forEach(team => {
        const teamQuery = `
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as totalIncidents,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedIncidents,
            SUM(CASE WHEN slaResponseBreached = 1 THEN 1 ELSE 0 END) as responseBreaches,
            SUM(CASE WHEN slaResolutionBreached = 1 THEN 1 ELSE 0 END) as resolutionBreaches
          FROM incidents
          WHERE createdAt >= ? AND createdAt <= ? AND teamId = ?
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;
        
        const teamData = db.prepare(teamQuery).all(
          startDate.toISOString(), 
          endDate.toISOString(),
          team.id
        ) as any[];
        
        const processedData = teamData.map(row => ({
          date: row.date,
          totalIncidents: row.totalIncidents,
          closedIncidents: row.closedIncidents,
          responseCompliance: row.closedIncidents > 0
            ? Math.round((row.closedIncidents - row.responseBreaches) / row.closedIncidents * 100 * 10) / 10
            : 100,
          resolutionCompliance: row.closedIncidents > 0
            ? Math.round((row.closedIncidents - row.resolutionBreaches) / row.closedIncidents * 100 * 10) / 10
            : 100,
        }));
        
        // Fill in missing dates with default values
        teamTrendsMap[team.id] = {
          teamName: team.name,
          teamColor: team.color,
          trends: fillMissingDates(processedData, startDate, endDate, {
            totalIncidents: 0,
            closedIncidents: 0,
            responseCompliance: 100,
            resolutionCompliance: 100,
          }),
        };
      });
      
      // Get overall trends (aggregated across all teams)
      const overallQuery = `
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as totalIncidents,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedIncidents,
          SUM(CASE WHEN slaResponseBreached = 1 THEN 1 ELSE 0 END) as responseBreaches,
          SUM(CASE WHEN slaResolutionBreached = 1 THEN 1 ELSE 0 END) as resolutionBreaches,
          AVG(CASE WHEN firstResponseAt IS NOT NULL AND status = 'closed'
            THEN (julianday(firstResponseAt) - julianday(createdAt)) * 24 * 60 
            ELSE NULL END) as avgResponseTime,
          AVG(CASE WHEN closedAt IS NOT NULL 
            THEN (julianday(closedAt) - julianday(createdAt)) * 24 * 60 
            ELSE NULL END) as avgResolutionTime
        FROM incidents
        WHERE createdAt >= ? AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `;
      
      const overallData = db.prepare(overallQuery).all(
        startDate.toISOString(),
        endDate.toISOString()
      ) as any[];
      
      const processedOverallData = overallData.map(row => ({
        date: row.date,
        totalIncidents: row.totalIncidents,
        closedIncidents: row.closedIncidents,
        responseCompliance: row.closedIncidents > 0
          ? Math.round((row.closedIncidents - row.responseBreaches) / row.closedIncidents * 100 * 10) / 10
          : 100,
        resolutionCompliance: row.closedIncidents > 0
          ? Math.round((row.closedIncidents - row.resolutionBreaches) / row.closedIncidents * 100 * 10) / 10
          : 100,
        avgResponseTime: row.avgResponseTime ? Math.round(row.avgResponseTime) : 0,
        avgResolutionTime: row.avgResolutionTime ? Math.round(row.avgResolutionTime) : 0,
      }));
      
      // Fill in missing dates with default values
      const trends = fillMissingDates(processedOverallData, startDate, endDate, {
        totalIncidents: 0,
        closedIncidents: 0,
        responseCompliance: 100,
        resolutionCompliance: 100,
        avgResponseTime: 0,
        avgResolutionTime: 0,
      });
      
      const summary = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalIncidents: trends.reduce((sum, t) => sum + t.totalIncidents, 0),
        totalClosed: trends.reduce((sum, t) => sum + t.closedIncidents, 0),
        avgResponseCompliance: trends.length > 0
          ? Math.round(trends.reduce((sum, t) => sum + t.responseCompliance, 0) / trends.length * 10) / 10
          : 100,
        avgResolutionCompliance: trends.length > 0
          ? Math.round(trends.reduce((sum, t) => sum + t.resolutionCompliance, 0) / trends.length * 10) / 10
          : 100,
      };
      
      return NextResponse.json({
        summary,
        trends,
        teamTrends: teamTrendsMap,
      });
    }
    
    // Get daily incident stats for specific team
    let query = `
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as totalIncidents,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedIncidents,
        SUM(CASE WHEN slaResponseBreached = 1 THEN 1 ELSE 0 END) as responseBreaches,
        SUM(CASE WHEN slaResolutionBreached = 1 THEN 1 ELSE 0 END) as resolutionBreaches,
        AVG(CASE WHEN firstResponseAt IS NOT NULL AND status = 'closed'
          THEN (julianday(firstResponseAt) - julianday(createdAt)) * 24 * 60 
          ELSE NULL END) as avgResponseTime,
        AVG(CASE WHEN closedAt IS NOT NULL 
          THEN (julianday(closedAt) - julianday(createdAt)) * 24 * 60 
          ELSE NULL END) as avgResolutionTime,
        severity
      FROM incidents
      WHERE createdAt >= ? AND createdAt <= ?
    `;
    
    const params: any[] = [startDate.toISOString(), endDate.toISOString()];
    
    if (teamId) {
      query += ' AND teamId = ?';
      params.push(teamId);
    }
    
    query += ' GROUP BY DATE(createdAt), severity ORDER BY date ASC';
    
    const rawData = db.prepare(query).all(...params) as any[];
    
    // Aggregate by severity
    const dateMap = new Map<string, any>();
    
    rawData.forEach(row => {
      const date = row.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          totalIncidents: 0,
          closedIncidents: 0,
          responseBreaches: 0,
          resolutionBreaches: 0,
          avgResponseTime: 0,
          avgResolutionTime: 0,
          responseTimeCount: 0,
          resolutionTimeCount: 0,
          bySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
        });
      }
      
      const entry = dateMap.get(date)!;
      entry.totalIncidents += row.totalIncidents;
      entry.closedIncidents += row.closedIncidents;
      entry.responseBreaches += row.responseBreaches;
      entry.resolutionBreaches += row.resolutionBreaches;
      
      if (row.avgResponseTime) {
        entry.avgResponseTime += row.avgResponseTime;
        entry.responseTimeCount += 1;
      }
      
      if (row.avgResolutionTime) {
        entry.avgResolutionTime += row.avgResolutionTime;
        entry.resolutionTimeCount += 1;
      }
      
      entry.bySeverity[row.severity as 'critical' | 'high' | 'medium' | 'low'] = row.totalIncidents;
    });
    
    // Calculate final averages and compliance
    const processedTrends = Array.from(dateMap.values()).map(entry => {
      const responseCompliance = entry.closedIncidents > 0
        ? Math.round((entry.closedIncidents - entry.responseBreaches) / entry.closedIncidents * 100 * 10) / 10
        : 100;
      const resolutionCompliance = entry.closedIncidents > 0
        ? Math.round((entry.closedIncidents - entry.resolutionBreaches) / entry.closedIncidents * 100 * 10) / 10
        : 100;
      
      return {
        date: entry.date,
        totalIncidents: entry.totalIncidents,
        closedIncidents: entry.closedIncidents,
        responseCompliance,
        resolutionCompliance,
        avgResponseTime: entry.responseTimeCount > 0 
          ? Math.round(entry.avgResponseTime / entry.responseTimeCount) 
          : 0,
        avgResolutionTime: entry.resolutionTimeCount > 0 
          ? Math.round(entry.avgResolutionTime / entry.resolutionTimeCount) 
          : 0,
        bySeverity: entry.bySeverity,
      };
    });
    
    // Fill in missing dates with default values
    const trends = fillMissingDates(processedTrends, startDate, endDate, {
      totalIncidents: 0,
      closedIncidents: 0,
      responseCompliance: 100,
      resolutionCompliance: 100,
      avgResponseTime: 0,
      avgResolutionTime: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    });
    
    // Calculate overall summary for the period
    const summary = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalIncidents: trends.reduce((sum, t) => sum + t.totalIncidents, 0),
      totalClosed: trends.reduce((sum, t) => sum + t.closedIncidents, 0),
      avgResponseCompliance: trends.length > 0
        ? Math.round(trends.reduce((sum, t) => sum + t.responseCompliance, 0) / trends.length * 10) / 10
        : 100,
      avgResolutionCompliance: trends.length > 0
        ? Math.round(trends.reduce((sum, t) => sum + t.resolutionCompliance, 0) / trends.length * 10) / 10
        : 100,
    };
    
    return NextResponse.json({
      summary,
      trends,
    });
  } catch (error: any) {
    console.error('Error fetching SLA trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SLA trends', details: error.message },
      { status: 500 }
    );
  }
}
