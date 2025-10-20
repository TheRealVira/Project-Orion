'use client';

import { useEffect, useState, Fragment } from 'react';
import { Insight, Team } from '@/types';
import { Search, ChevronLeft, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import InsightCard from './InsightCard';

interface TeamInsightsSummary {
  team: Team;
  insights: Insight[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  successCount: number;
  totalCount: number;
}

const ITEMS_PER_PAGE = 10;

export default function TeamsInsightsView() {
  const [teamsSummary, setTeamsSummary] = useState<TeamInsightsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamsInsights = async () => {
      try {
        setLoading(true);
        // Fetch all teams first
        const teamsResponse = await fetch('/api/teams');
        if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
        const teams = await teamsResponse.json();

        // Fetch insights for each team
        const summaries: TeamInsightsSummary[] = [];
        for (const team of teams) {
          try {
            const insightsResponse = await fetch(`/api/teams/${team.id}/insights`);
            if (insightsResponse.ok) {
              const insightsData = await insightsResponse.json();
              const insights = insightsData.insights || [];

              const summary: TeamInsightsSummary = {
                team,
                insights,
                criticalCount: insights.filter((i: Insight) => i.severity === 'critical').length,
                warningCount: insights.filter((i: Insight) => i.severity === 'warning').length,
                infoCount: insights.filter((i: Insight) => i.severity === 'info').length,
                successCount: insights.filter((i: Insight) => i.severity === 'success').length,
                totalCount: insights.length,
              };
              summaries.push(summary);
            }
          } catch (err) {
            console.error(`Failed to fetch insights for team ${team.id}:`, err);
          }
        }

        setTeamsSummary(summaries);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams insights:', err);
        setError('Failed to load team insights');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsInsights();
  }, []);

  // Filter teams by search query
  const filteredTeams = teamsSummary.filter(summary =>
    summary.team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTeams = filteredTeams.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading insights...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <span className="text-red-900 dark:text-red-100">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300/50 dark:border-white/10 bg-white/50 dark:bg-gray-700/50 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Teams Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-8">
                {/* Expand button column */}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Team Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Critical
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Warning
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Info
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Success
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTeams.map((summary) => (
              <Fragment key={summary.team.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedTeamId(expandedTeamId === summary.team.id ? null : summary.team.id)}
                >
                  <td className="px-6 py-4 text-sm">
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        expandedTeamId === summary.team.id ? 'rotate-180' : ''
                      }`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {summary.team.name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {summary.criticalCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        {summary.criticalCount}
                      </span>
                    )}
                    {summary.criticalCount === 0 && (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {summary.warningCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        {summary.warningCount}
                      </span>
                    )}
                    {summary.warningCount === 0 && (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {summary.infoCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {summary.infoCount}
                      </span>
                    )}
                    {summary.infoCount === 0 && (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {summary.successCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        {summary.successCount}
                      </span>
                    )}
                    {summary.successCount === 0 && (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {summary.totalCount}
                  </td>
                </tr>
                {/* Expanded row with insights */}
                {expandedTeamId === summary.team.id && (
                  <tr className="bg-gray-100/50 dark:bg-gray-800/20 border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="space-y-3">
                        {summary.insights.length > 0 ? (
                          summary.insights.map((insight) => (
                            <InsightCard
                              key={insight.id}
                              insight={insight}
                              onDismiss={() => {
                                // Handle dismiss if needed
                              }}
                            />
                          ))
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            No insights for this team
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results */}
      {filteredTeams.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No teams match your search.' : 'No teams found.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredTeams.length)} of {filteredTeams.length} teams
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-primary-500/40 dark:bg-primary-400/50 text-primary-900 dark:text-white border border-primary-600/60 dark:border-primary-300/50'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
