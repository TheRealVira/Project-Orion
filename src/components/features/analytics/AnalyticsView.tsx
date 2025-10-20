import { useState, useMemo } from 'react';
import { Member, Team, DateAssignmentView } from '@/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, getDay } from 'date-fns';
import { BarChart3, Calendar, TrendingUp, Award, Filter, X, Download } from 'lucide-react';
import { Avatar } from '@/components/shared';

interface AnalyticsViewProps {
  members: Member[];
  teams: Team[];
  assignments: DateAssignmentView[];
}

type DateRange = 'this-month' | 'last-month' | 'this-year' | 'custom';

export default function AnalyticsView({ members, teams, assignments }: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  // Get date range based on selection
  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    
    switch (dateRange) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case 'this-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: parseISO(customStartDate), 
          end: parseISO(customEndDate) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Get available teams based on date range and selected members
  const availableTeams = useMemo(() => {
    const { start, end } = getDateRange();
    
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = parseISO(assignment.date);
      return isWithinInterval(assignmentDate, { start, end });
    });

    // If members are selected, only show teams those members are in
    if (selectedMembers.length > 0) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.members.some(member => selectedMembers.includes(member.id))
      );
    }

    const teamIds = new Set(filteredAssignments.map(a => a.team.id));
    return teams.filter(team => teamIds.has(team.id));
  }, [teams, assignments, dateRange, customStartDate, customEndDate, selectedMembers]);

  // Get available members based on date range and selected teams
  const availableMembers = useMemo(() => {
    const { start, end } = getDateRange();
    
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = parseISO(assignment.date);
      return isWithinInterval(assignmentDate, { start, end });
    });

    // If teams are selected, only show members in those teams
    if (selectedTeams.length > 0) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.team && selectedTeams.includes(assignment.team.id)
      );
    }

    const memberIds = new Set<string>();
    filteredAssignments.forEach(assignment => {
      assignment.members.forEach(member => {
        memberIds.add(member.id);
      });
    });
    
    return members.filter(member => memberIds.has(member.id));
  }, [members, assignments, dateRange, customStartDate, customEndDate, selectedTeams]);

  // Toggle filter functions
  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const clearFilters = () => {
    setSelectedTeams([]);
    setSelectedMembers([]);
  };

  // Helper function to escape CSV fields
  const escapeCSV = (field: string): string => {
    // Always wrap in quotes for maximum compatibility, escape internal quotes
    return `"${field.replace(/"/g, '""')}"`;
  };

  // Export to CSV function
  const exportToCSV = () => {
    const { start, end } = getDateRange();
    const dateRangeStr = `${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`;
    
    // Build filter info
    const filterInfo: string[] = [`Date Range: ${dateRangeStr}`];
    if (selectedTeams.length > 0) {
      const teamNames = teams.filter(t => selectedTeams.includes(t.id)).map(t => t.name).join(', ');
      filterInfo.push(`Filtered Teams: ${teamNames}`);
    }
    if (selectedMembers.length > 0) {
      const memberNames = members.filter(m => selectedMembers.includes(m.id)).map(m => m.name).join(', ');
      filterInfo.push(`Filtered Members: ${memberNames}`);
    }
    
    // Create CSV header
    const headers = ['Member Name', 'Email', 'Total Assignments', 'Teams', 'Shadows as Mentor', 'Shadows as Learner'];
    
    // Create CSV rows
    const rows: string[][] = statistics.memberStats.map(stat => [
      stat.member.name,
      stat.member.email,
      stat.assignmentCount.toString(),
      stat.teamBreakdown.map(tb => `${tb.team}`).join('; '),
      stat.shadowsAsMentor.toString(),
      stat.shadowsAsLearner.toString()
    ]);
    
    // Combine all parts with proper CSV escaping
    const csvLines: string[] = [
      'Project Orion Analytics Export',
      '',
      ...filterInfo,
      '',
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
      '',
      'Summary Statistics',
      `Total Assignments,${statistics.totalAssignments}`,
      `Average per Member,${statistics.averagePerMember.toFixed(2)}`,
      `Max Assignments,${statistics.maxAssignments}`,
      `Total Members,${statistics.memberStats.length}`
    ];
    const csvContent = csvLines.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orion-analytics-${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate assignment statistics
  const statistics = useMemo(() => {
    const { start, end } = getDateRange();
    
    // Filter assignments within date range
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = parseISO(assignment.date);
      return isWithinInterval(assignmentDate, { start, end });
    });

    // Apply team filter
    if (selectedTeams.length > 0) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.team && selectedTeams.includes(assignment.team.id)
      );
    }

    // Apply member filter
    if (selectedMembers.length > 0) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.members.some(member => selectedMembers.includes(member.id))
      );
    }

    // Count assignments per member
    const memberCounts = new Map<string, number>();
    const memberTeamCounts = new Map<string, Map<string, number>>();
    const memberWeekdayCounts = new Map<string, number[]>(); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    
    filteredAssignments.forEach(assignment => {
      const assignmentDate = parseISO(assignment.date);
      const dayOfWeek = getDay(assignmentDate); // 0 (Sunday) to 6 (Saturday)
      
      assignment.members.forEach(member => {
        // Total count
        memberCounts.set(member.id, (memberCounts.get(member.id) || 0) + 1);
        
        // Per-team count
        if (!memberTeamCounts.has(member.id)) {
          memberTeamCounts.set(member.id, new Map());
        }
        const teamCounts = memberTeamCounts.get(member.id)!;
        const teamName = assignment.team?.name || 'No Team';
        teamCounts.set(teamName, (teamCounts.get(teamName) || 0) + 1);
        
        // Weekday count
        if (!memberWeekdayCounts.has(member.id)) {
          memberWeekdayCounts.set(member.id, [0, 0, 0, 0, 0, 0, 0]);
        }
        const weekdayCounts = memberWeekdayCounts.get(member.id)!;
        weekdayCounts[dayOfWeek] += 1;
      });
    });

    // Calculate shadow counts
    const shadowCounts = new Map<string, { asMentor: number; asLearner: number }>();
    
    filteredAssignments.forEach(assignment => {
      assignment.shadows.forEach(shadowPair => {
        // Count primary member as mentor
        const mentorStats = shadowCounts.get(shadowPair.primary.id) || { asMentor: 0, asLearner: 0 };
        mentorStats.asMentor += 1;
        shadowCounts.set(shadowPair.primary.id, mentorStats);
        
        // Count shadow member as learner
        const learnerStats = shadowCounts.get(shadowPair.shadow.id) || { asMentor: 0, asLearner: 0 };
        learnerStats.asLearner += 1;
        shadowCounts.set(shadowPair.shadow.id, learnerStats);
      });
    });

    // Filter members based on selected filters
    let filteredMembers = members;
    
    // Apply member filter
    if (selectedMembers.length > 0) {
      filteredMembers = filteredMembers.filter(member => selectedMembers.includes(member.id));
    }
    
    // Apply team filter - only show members who have assignments in the selected teams
    if (selectedTeams.length > 0) {
      const membersInSelectedTeams = new Set<string>();
      filteredAssignments.forEach(assignment => {
        assignment.members.forEach(member => {
          membersInSelectedTeams.add(member.id);
        });
      });
      filteredMembers = filteredMembers.filter(member => membersInSelectedTeams.has(member.id));
    }

    // Build member statistics
    const memberStats = filteredMembers.map(member => {
      const assignmentCount = memberCounts.get(member.id) || 0;
      const teamCounts = memberTeamCounts.get(member.id);
      const shadowStats = shadowCounts.get(member.id) || { asMentor: 0, asLearner: 0 };
      const weekdayCounts = memberWeekdayCounts.get(member.id) || [0, 0, 0, 0, 0, 0, 0];
      
      return {
        member,
        assignmentCount,
        teamBreakdown: teamCounts ? Array.from(teamCounts.entries()).map(([team, count]) => ({ team, count })) : [],
        shadowsAsMentor: shadowStats.asMentor,
        shadowsAsLearner: shadowStats.asLearner,
        weekdayBreakdown: weekdayCounts, // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
      };
    }).sort((a, b) => b.assignmentCount - a.assignmentCount);

    const totalAssignments = filteredAssignments.length;
    const averagePerMember = filteredMembers.length > 0 ? totalAssignments / filteredMembers.length : 0;
    const maxAssignments = Math.max(...memberStats.map(s => s.assignmentCount), 0);

    return {
      memberStats,
      totalAssignments,
      averagePerMember,
      maxAssignments,
      dateRange: { start, end },
    };
  }, [members, assignments, dateRange, customStartDate, customEndDate, selectedTeams, selectedMembers]);

  const activeFilterCount = selectedTeams.length + selectedMembers.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />
            Assignment Analytics
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            View assignment statistics and workload distribution
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Date Range Filter */}
            <div>
              <label className="label mb-2">Date Range</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDateRange('this-month')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    dateRange === 'this-month'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('last-month')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    dateRange === 'last-month'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('this-year')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    dateRange === 'this-year'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  This Year
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('custom')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    dateRange === 'custom'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Custom
                </button>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              )}

              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-3">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(statistics.dateRange.start, 'MMM d, yyyy')} - {format(statistics.dateRange.end, 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Team Filter */}
            <div>
              <label className="label mb-2">
                Teams {selectedTeams.length > 0 && `(${selectedTeams.length} selected)`}
                {availableTeams.length < teams.length && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({availableTeams.length} of {teams.length} available)
                  </span>
                )}
              </label>
              {availableTeams.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {teams.length === 0 ? 'No teams available' : 'No teams match the current filters'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTeams.map(team => (
                    <button
                      type="button"
                      key={team.id}
                      onClick={() => toggleTeam(team.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedTeams.includes(team.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Member Filter */}
            <div>
              <label className="label mb-2">
                Members {selectedMembers.length > 0 && `(${selectedMembers.length} selected)`}
                {availableMembers.length < members.length && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({availableMembers.length} of {members.length} available)
                  </span>
                )}
              </label>
              {availableMembers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {members.length === 0 ? 'No members available' : 'No members match the current filters'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableMembers.map(member => (
                    <button
                      type="button"
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        selectedMembers.includes(member.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Avatar src={member.avatarUrl} alt={member.name} size="xs" />
                      {member.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Assignments</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.totalAssignments}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average per Member</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.averagePerMember.toFixed(1)}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Most Assignments</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.maxAssignments}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Statistics Table */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Assignment Distribution by Member
        </h3>

        {statistics.memberStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No assignment data for this period
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {statistics.memberStats.map((stat, index) => {
              const percentage = statistics.maxAssignments > 0 
                ? (stat.assignmentCount / statistics.maxAssignments) * 100 
                : 0;
              
              // Show "Top Contributor" badge for all members with the highest assignment count
              const isTopContributor = stat.assignmentCount > 0 && stat.assignmentCount === statistics.maxAssignments;

              return (
                <div key={stat.member.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 sm:pb-4 last:pb-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar 
                        src={stat.member.avatarUrl} 
                        alt={stat.member.name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                            {stat.member.name}
                          </h4>
                          {isTopContributor && (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded">
                              Top Contributor
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {stat.member.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.assignmentCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        assignments
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 mb-2 backdrop-blur-md border border-gray-300/50 dark:border-gray-600/50">
                    <div
                      className="h-2 rounded-full transition-all duration-500 bg-primary-500/60 dark:bg-primary-400/70"
                      style={{ 
                        width: `${percentage}%`,
                        backdropFilter: 'blur(12px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                      }}
                    />
                  </div>

                  {/* Weekday Breakdown Matrix */}
                  <div className="mt-2 overflow-x-auto">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distribution by Weekday:
                    </div>
                    <div className="inline-flex gap-1 min-w-full">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                        // Reorder from [Sun, Mon, Tue, Wed, Thu, Fri, Sat] to [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
                        const dayIndex = idx === 6 ? 0 : idx + 1;
                        const count = stat.weekdayBreakdown[dayIndex];
                        const hasAssignments = count > 0;
                        
                        return (
                          <div
                            key={day}
                            className={`flex-1 min-w-[40px] sm:min-w-[50px] px-2 py-1.5 rounded text-center border ${
                              hasAssignments
                                ? 'bg-primary-500/40 dark:bg-primary-400/50 border-primary-600/60 dark:border-primary-300/50 text-primary-900 dark:text-white font-semibold'
                                : 'bg-gray-300/50 dark:bg-gray-600/50 border-gray-500/50 dark:border-gray-400/50 text-gray-500 dark:text-gray-400'
                            }`}
                            style={{
                              backdropFilter: 'blur(12px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                              boxShadow: hasAssignments 
                                ? 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                                : 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                            }}
                          >
                            <div className="text-[10px] sm:text-xs">{day}</div>
                            <div className="text-xs sm:text-sm font-bold">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {stat.teamBreakdown.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Teams:</span>
                        <span>{stat.teamBreakdown.map(tb => `${tb.team} (${tb.count})`).join(', ')}</span>
                      </div>
                    )}
                    {(stat.shadowsAsMentor > 0 || stat.shadowsAsLearner > 0) && (
                      <div className="flex items-center gap-2">
                        {stat.shadowsAsMentor > 0 && (
                          <span>🎓 Mentored: {stat.shadowsAsMentor}</span>
                        )}
                        {stat.shadowsAsLearner > 0 && (
                          <span>🔍 Learning: {stat.shadowsAsLearner}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
