import { getDatabase } from '@/lib/database';
import { Member, Team, Insight, InsightType } from '@/types';

export class InsightService {
  private db: any = null;

  /**
   * Get database instance (lazy initialization)
   */
  private getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * Generate all applicable insights for a team
   */
  async generateInsights(teamId: string, userId?: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const db = this.getDb();

    try {
      // Get team data
      const team = db
        .prepare('SELECT * FROM teams WHERE id = ?')
        .get(teamId) as any;
      if (!team) return [];

      const members = this.getTeamMembers(teamId);
      if (members.length === 0) return [];

      // Run all insight generators
      insights.push(...(await this.checkCoverageGaps(teamId, team, members)));
      insights.push(...(await this.checkMissingUserInfo(teamId, members)));
      insights.push(...(await this.checkTeamImbalance(teamId, members)));
      insights.push(...(await this.checkSLAConfiguration(teamId, members)));
      insights.push(...(await this.checkIncidentTrends(teamId)));

      // Filter out dismissed insights if userId provided
      if (userId) {
        return this.filterDismissedInsights(insights, userId, teamId);
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Check for timezone coverage gaps
   */
  private async checkCoverageGaps(
    teamId: string,
    team: any,
    members: Member[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      const timezones = members
        .map((m) => m.timezone)
        .filter(Boolean) as string[];

      if (timezones.length === 0) {
        insights.push({
          id: `insight_${teamId}_no_timezones`,
          type: 'timezone-coverage-gap',
          category: 'Coverage',
          severity: 'critical',
          title: 'No team timezones configured',
          description:
            'No team members have timezones set. Cannot assess 24-hour coverage.',
          suggestions: [
            'Add timezone information for all team members',
            'This will enable coverage gap analysis',
          ],
          actions: [
            {
              label: 'View team members',
              actionId: 'navigate_to_members',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      } else {
        // Calculate coverage gaps
        const uniqueTimezones = [...new Set(timezones)];
        const gap = this.calculateTimezoneGap(uniqueTimezones);

        if (gap && gap.duration > 4) {
          // More than 4 hours without coverage
          insights.push({
            id: `insight_${teamId}_coverage_gap`,
            type: 'timezone-coverage-gap',
            category: 'Coverage',
            severity: 'warning',
            title: `${gap.duration}-hour coverage gap detected`,
            description: `No team members available between ${gap.startTime} and ${gap.endTime} UTC.`,
            details: `This period covers ${gap.affectedRegions.join(', ')}.`,
            metrics: [
              { label: 'Gap Duration', value: `${gap.duration}h` },
              { label: 'Affected Hours', value: gap.startTime },
              {
                label: 'Regions Uncovered',
                value: gap.affectedRegions.length,
              },
            ],
            suggestions: [
              `Consider adding team members in ${gap.suggestedTimezone} timezone`,
              'Evaluate hiring or rotating shift patterns',
              'Set up automated escalation for off-hours incidents',
            ],
            actions: [
              {
                label: 'Add team member',
                actionId: 'add_team_member',
                params: { teamId },
              },
            ],
            dismissible: true,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error checking coverage gaps:', error);
      return [];
    }
  }

  /**
   * Check for missing critical user information
   */
  private async checkMissingUserInfo(
    teamId: string,
    members: Member[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      const missingTimezone = members.filter((m) => !m.timezone);
      const missingPhone = members.filter(
        (m) => !m.phone && m.role !== 'viewer'
      );
      const missingLocation = members.filter(
        (m) => !m.city && !m.country
      );

      if (missingTimezone.length > 0) {
        insights.push({
          id: `insight_${teamId}_missing_timezone`,
          type: 'missing-timezone',
          category: 'Data',
          severity:
            missingTimezone.length / members.length > 0.3 ? 'warning' : 'info',
          title: `${missingTimezone.length} member(s) missing timezone`,
          description: `${missingTimezone.length} team member(s) don't have timezone configured. This affects scheduling accuracy.`,
          metrics: [
            {
              label: 'Members Missing Timezone',
              value: missingTimezone.length,
            },
            {
              label: 'Team Coverage',
              value: `${(((members.length - missingTimezone.length) / members.length) * 100).toFixed(0)}%`,
            },
          ],
          suggestions: missingTimezone
            .slice(0, 3)
            .map((m) => `Add timezone for ${m.name}`),
          actions: [
            {
              label: 'Update member info',
              actionId: 'edit_members',
              params: { memberIds: missingTimezone.map((m) => m.id) },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      if (missingPhone.length > 0) {
        insights.push({
          id: `insight_${teamId}_missing_phone`,
          type: 'missing-phone',
          category: 'Data',
          severity: 'warning',
          title: `${missingPhone.length} member(s) missing phone number`,
          description:
            'Phone numbers are required for SMS alerts during incidents.',
          metrics: [
            { label: 'Missing Phone', value: missingPhone.length },
            {
              label: 'Alert Coverage',
              value: `${(((members.length - missingPhone.length) / members.length) * 100).toFixed(0)}%`,
            },
          ],
          suggestions: missingPhone
            .slice(0, 3)
            .map((m) => `Add phone number for ${m.name}`),
          actions: [
            {
              label: 'Update member contact info',
              actionId: 'edit_members',
              params: { memberIds: missingPhone.map((m) => m.id) },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      if (missingLocation.length > 0 && members.length > 3) {
        insights.push({
          id: `insight_${teamId}_missing_location`,
          type: 'missing-location',
          category: 'Data',
          severity: 'info',
          title: `${missingLocation.length} member(s) missing location`,
          description:
            'Location data helps with timezone accuracy and team diversity insights.',
          metrics: [
            { label: 'Missing Location', value: missingLocation.length },
            {
              label: 'Team Location Coverage',
              value: `${(((members.length - missingLocation.length) / members.length) * 100).toFixed(0)}%`,
            },
          ],
          suggestions: missingLocation
            .slice(0, 2)
            .map((m) => `Add location for ${m.name}`),
          actions: [
            {
              label: 'Update member locations',
              actionId: 'edit_members',
              params: { memberIds: missingLocation.map((m) => m.id) },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('Error checking missing user info:', error);
      return [];
    }
  }

  /**
   * Check for on-call assignment imbalance
   */
  private async checkTeamImbalance(
    teamId: string,
    members: Member[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      // Count assignments per member in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const assignments = this.getDb()
        .prepare(
          `SELECT au.userId, COUNT(*) as count FROM assignment_users au
         INNER JOIN date_assignments da ON au.assignmentId = da.id
         WHERE da.teamId = ? AND da.date >= ? 
         GROUP BY au.userId`
        )
        .all(teamId, thirtyDaysAgo) as any[];

      const assignmentMap: Record<string, number> = {};
      assignments.forEach((a) => {
        assignmentMap[a.userId] = a.count;
      });

      const totalAssignments = assignments.reduce((sum, a) => sum + a.count, 0);
      const avgAssignments =
        members.length > 0 ? totalAssignments / members.length : 0;

      // Find imbalanced members
      const overloaded = members.filter(
        (m) => (assignmentMap[m.id] || 0) > avgAssignments * 1.5
      );
      const never = members.filter((m) => !assignmentMap[m.id]);

      if (
        overloaded.length > 0 &&
        totalAssignments > members.length * 2
      ) {
        insights.push({
          id: `insight_${teamId}_overload`,
          type: 'member-overload',
          category: 'Balance',
          severity: 'warning',
          title: `Unbalanced on-call assignments detected`,
          description: `${overloaded.length} team member(s) have significantly more assignments than average.`,
          metrics: overloaded
            .slice(0, 3)
            .map((m) => ({
              label: m.name,
              value: `${assignmentMap[m.id] || 0} assignments`,
              trend: 'up' as const,
              trendValue: `${(((assignmentMap[m.id] || 0) / avgAssignments - 1) * 100).toFixed(0)}% above avg`,
            })),
          suggestions: [
            'Rotate on-call responsibilities more evenly',
            `Consider reducing ${overloaded[0]?.name}'s assignments to prevent burnout`,
            'Schedule rebalancing in next rotation cycle',
          ],
          actions: [
            {
              label: 'View assignment history',
              actionId: 'view_assignments',
              params: { teamId },
            },
            {
              label: 'Edit on-call schedule',
              actionId: 'edit_schedule',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      if (never.length > 0 && never.length < members.length && members.length > 2) {
        insights.push({
          id: `insight_${teamId}_no_assignments`,
          type: 'member-underutilized',
          category: 'Balance',
          severity: 'info',
          title: `${never.length} member(s) never assigned on-call`,
          description: `${never.map((m) => m.name).join(', ')} have no assignments in the last 30 days.`,
          suggestions: [
            'Include these members in upcoming rotations',
            'Verify they are active team members',
            'Consider if they should be part of on-call rotation',
          ],
          actions: [
            {
              label: 'Edit on-call schedule',
              actionId: 'edit_schedule',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('Error checking team imbalance:', error);
      return [];
    }
  }

  /**
   * Check SLA configuration issues
   */
  private async checkSLAConfiguration(
    teamId: string,
    members: Member[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      const slaSettings = this.getDb()
        .prepare(
          'SELECT * FROM team_sla_settings WHERE teamId = ? AND enabled = 1'
        )
        .get(teamId) as any;

      if (!slaSettings) {
        insights.push({
          id: `insight_${teamId}_no_sla`,
          type: 'sla-unrealistic',
          category: 'Configuration',
          severity: 'info',
          title: 'SLA tracking not configured',
          description:
            'Set up SLA targets to track incident response and resolution times.',
          suggestions: [
            'Configure response time targets by severity',
            'Set resolution time SLAs',
            'Enable SLA breach notifications',
          ],
          actions: [
            {
              label: 'Configure SLA',
              actionId: 'configure_sla',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
        return insights;
      }

      // Check if SLA timezone matches team coverage
      const memberTimezones = [
        ...new Set(members.map((m) => m.timezone).filter(Boolean)),
      ] as string[];

      if (
        memberTimezones.length > 0 &&
        !memberTimezones.includes(slaSettings.timezone)
      ) {
        insights.push({
          id: `insight_${teamId}_sla_tz_mismatch`,
          type: 'sla-timezone-mismatch',
          category: 'Configuration',
          severity: 'warning',
          title: 'SLA timezone mismatch',
          description: `SLA is configured for ${slaSettings.timezone} but team operates in ${memberTimezones.join(', ')}.`,
          suggestions: [
            `Update SLA timezone to match primary team timezone`,
            'This ensures SLA calculations align with actual team availability',
          ],
          actions: [
            {
              label: 'Update SLA settings',
              actionId: 'configure_sla',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('Error checking SLA configuration:', error);
      return [];
    }
  }

  /**
   * Check incident trends and patterns
   */
  private async checkIncidentTrends(teamId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Get incident counts
      const incidentsThis7Days = this.getDb()
        .prepare(
          `SELECT COUNT(*) as count FROM incidents 
         WHERE teamId = ? AND createdAt >= ?`
        )
        .get(teamId, sevenDaysAgo) as any;

      const incidentsLast7Days = this.getDb()
        .prepare(
          `SELECT COUNT(*) as count FROM incidents 
         WHERE teamId = ? AND createdAt >= ? AND createdAt < ?`
        )
        .get(teamId, fourteenDaysAgo, sevenDaysAgo) as any;

      const currentCount = incidentsThis7Days.count || 0;
      const previousCount = incidentsLast7Days.count || 0;

      if (currentCount > previousCount * 1.5 && currentCount > 5) {
        const percentIncrease = (
          ((currentCount - previousCount) / (previousCount || 1)) *
          100
        ).toFixed(0);
        insights.push({
          id: `insight_${teamId}_incident_spike`,
          type: 'incident-trend-spike',
          category: 'Trends',
          severity: 'warning',
          title: `Incident volume spike detected`,
          description: `Incidents up ${percentIncrease}% compared to previous week.`,
          metrics: [
            { label: 'This Week', value: currentCount },
            { label: 'Last Week', value: previousCount },
            { label: 'Increase', value: `${percentIncrease}%`, trend: 'up' },
          ],
          suggestions: [
            'Investigate root causes of increased incidents',
            'Consider increasing on-call team size temporarily',
            'Review and prioritize incident resolution',
            'Schedule post-incident reviews to prevent recurrence',
          ],
          actions: [
            {
              label: 'View recent incidents',
              actionId: 'view_incidents',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      // Check for SLA breaches
      const breachedIncidents = this.getDb()
        .prepare(
          `SELECT COUNT(*) as count FROM incidents 
         WHERE teamId = ? AND (slaResponseBreached = 1 OR slaResolutionBreached = 1)
         AND createdAt >= ?`
        )
        .get(teamId, sevenDaysAgo) as any;

      if ((breachedIncidents.count || 0) > 2) {
        insights.push({
          id: `insight_${teamId}_sla_breaches`,
          type: 'incident-resolution-slow',
          category: 'Trends',
          severity: 'warning',
          title: `${breachedIncidents.count} SLA breaches in last 7 days`,
          description: 'Multiple incidents exceeded their SLA targets.',
          metrics: [
            { label: 'SLA Breaches', value: breachedIncidents.count },
            { label: 'Period', value: 'Last 7 days' },
          ],
          suggestions: [
            'Review incident response procedures',
            'Consider expanding team capacity',
            'Evaluate if SLA targets are realistic',
            'Improve incident prioritization process',
          ],
          actions: [
            {
              label: 'View breached incidents',
              actionId: 'view_incidents',
              params: { teamId, filter: 'breached' },
            },
            {
              label: 'Review SLA settings',
              actionId: 'configure_sla',
              params: { teamId },
            },
          ],
          dismissible: true,
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('Error checking incident trends:', error);
      return [];
    }
  }

  /**
   * Helper: Get team members
   */
  private getTeamMembers(teamId: string): Member[] {
    try {
      const result = this.getDb()
        .prepare(
          `SELECT u.* FROM users u 
         INNER JOIN team_members tm ON u.id = tm.userId 
         WHERE tm.teamId = ? AND u.isActive = 1`
        )
        .all(teamId) as Member[];
      return result;
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  /**
   * Helper: Calculate timezone gap
   */
  private calculateTimezoneGap(
    timezones: string[]
  ): {
    duration: number;
    startTime: string;
    endTime: string;
    affectedRegions: string[];
    suggestedTimezone: string;
  } | null {
    try {
      // Calculate UTC hour coverage
      const covered: boolean[] = new Array(24).fill(false);

      timezones.forEach((tz) => {
        const offset = this.getUTCOffset(tz);
        // Mark business hours (9-17) as covered
        for (let i = 0; i < 8; i++) {
          covered[(9 + i + offset + 24) % 24] = true;
        }
      });

      let maxGap = 0;
      let gapStart = 0;

      let currentGap = 0;
      for (let i = 0; i < 24; i++) {
        if (!covered[i]) {
          currentGap++;
          if (currentGap > maxGap) {
            maxGap = currentGap;
            gapStart = i;
          }
        } else {
          currentGap = 0;
        }
      }

      if (maxGap >= 4) {
        const endHour = (gapStart + maxGap) % 24;
        return {
          duration: maxGap,
          startTime: `${gapStart}:00 UTC`,
          endTime: `${endHour}:00 UTC`,
          affectedRegions: ['APAC', 'Middle East'],
          suggestedTimezone: 'Asia/Singapore',
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating timezone gap:', error);
      return null;
    }
  }

  /**
   * Helper: Get UTC offset from timezone
   */
  private getUTCOffset(timezone: string): number {
    const offsets: Record<string, number> = {
      UTC: 0,
      'US/Eastern': -5,
      'US/Central': -6,
      'US/Mountain': -7,
      'US/Pacific': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Europe/Moscow': 3,
      'Asia/Dubai': 4,
      'Asia/Kolkata': 5.5,
      'Asia/Bangkok': 7,
      'Asia/Shanghai': 8,
      'Asia/Tokyo': 9,
      'Australia/Sydney': 11,
    };
    return offsets[timezone] || 0;
  }

  /**
   * Filter out dismissed insights
   */
  private filterDismissedInsights(
    insights: Insight[],
    userId: string,
    teamId: string
  ): Insight[] {
    try {
      // TODO: Query insight_dismissals table when implemented
      // For now, return all insights
      return insights;
    } catch (error) {
      console.error('Error filtering dismissed insights:', error);
      return insights;
    }
  }
}

export const insightService = new InsightService();
