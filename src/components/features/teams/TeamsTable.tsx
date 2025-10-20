'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { Team, Member, Insight } from '@/types';
import { Edit, Trash2, Search, ChevronDown, Loader2 } from 'lucide-react';
import TeamFormModal from './TeamFormModal';
import TeamSLAConfig from './TeamSLAConfig';
import { Avatar, Pagination } from '@/components/shared';
import { User } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateTeam, canEditTeam, canDeleteTeam } from '@/lib/utils/permissions';
import { Button, EmptyState } from '@/components/ui';
import InsightCard from '@/components/features/insights/InsightCard';

interface TeamTableProps {
  teams: Team[];
  members: Member[];
  users: User[];
  onCreateTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => void;
  onUpdateTeam: (id: string, team: Partial<Team>, ownerIds?: string[]) => void;
  onDeleteTeam: (id: string) => void;
}

interface TeamWithInsights extends Team {
  insights?: Insight[];
  insightsLoading?: boolean;
  criticalCount?: number;
  warningCount?: number;
  infoCount?: number;
}

export default function TeamsTable({
  teams,
  members,
  users,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamTableProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamOwnerships, setTeamOwnerships] = useState<Record<string, string[]>>({});
  const [slaConfigTeamId, setSlaConfigTeamId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [teamsWithInsights, setTeamsWithInsights] = useState<Map<string, TeamWithInsights>>(new Map());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch team ownerships
  useEffect(() => {
    const fetchTeamOwnerships = async () => {
      try {
        const response = await fetch('/api/team-owners');
        if (response.ok) {
          const data = await response.json();
          setTeamOwnerships(data);
        }
      } catch (error) {
        console.error('Failed to fetch team ownerships:', error);
      }
    };

    fetchTeamOwnerships();
  }, []);

  // Fetch insights for expanded team
  useEffect(() => {
    if (!expandedTeamId) return;

    const fetchInsights = async () => {
      try {
        setTeamsWithInsights(prev => {
          const updated = new Map(prev);
          const team = updated.get(expandedTeamId) || teams.find(t => t.id === expandedTeamId);
          if (team) {
            updated.set(expandedTeamId, { ...team, insightsLoading: true });
          }
          return updated;
        });

        const response = await fetch(`/api/teams/${expandedTeamId}/insights`);
        if (response.ok) {
          const data = await response.json();
          const insights = data.insights || [];

          setTeamsWithInsights(prev => {
            const updated = new Map(prev);
            const team = updated.get(expandedTeamId) || teams.find(t => t.id === expandedTeamId);
            if (team) {
              updated.set(expandedTeamId, {
                ...team,
                insights,
                insightsLoading: false,
                criticalCount: insights.filter((i: Insight) => i.severity === 'critical').length,
                warningCount: insights.filter((i: Insight) => i.severity === 'warning').length,
                infoCount: insights.filter((i: Insight) => i.severity === 'info').length,
              });
            }
            return updated;
          });
        }
      } catch (error) {
        console.error(`Failed to fetch insights for team ${expandedTeamId}:`, error);
        setTeamsWithInsights(prev => {
          const updated = new Map(prev);
          const team = updated.get(expandedTeamId) || teams.find(t => t.id === expandedTeamId);
          if (team) {
            updated.set(expandedTeamId, { ...team, insightsLoading: false });
          }
          return updated;
        });
      }
    };

    fetchInsights();
  }, [expandedTeamId, teams]);

  const getTeamMembers = (team: Team): Member[] => {
    return team.memberIds
      .map(id => members.find(m => m.id === id))
      .filter((m): m is Member => m !== undefined);
  };

  const handleCreate = (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => {
    onCreateTeam(teamData, ownerIds);
    setIsModalOpen(false);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleUpdate = (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => {
    if (editingTeam) {
      onUpdateTeam(editingTeam.id, teamData, ownerIds);
      setIsModalOpen(false);
      setEditingTeam(undefined);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      onDeleteTeam(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(undefined);
  };

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;

    const query = searchQuery.toLowerCase();
    return teams.filter(team => {
      const teamMembers = getTeamMembers(team);
      return (
        team.name.toLowerCase().includes(query) ||
        (team.description && team.description.toLowerCase().includes(query)) ||
        teamMembers.some(member => member.name.toLowerCase().includes(query))
      );
    });
  }, [teams, searchQuery, members]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

  if (!currentUser || !canCreateTeam(currentUser)) {
    return <EmptyState title="Unauthorized" description="You don't have permission to view teams." />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Create */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams, members, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        {currentUser && canCreateTeam(currentUser) && (
          <Button
            onClick={() => {
              setEditingTeam(undefined);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            Create Team
          </Button>
        )}
      </div>

      {/* Teams Table */}
      {filteredTeams.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100/50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-8">
                  {/* Expand column */}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Critical
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Warning
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTeams.map((team) => {
                const teamWithInsights = teamsWithInsights.get(team.id);
                const teamMembers = getTeamMembers(team);
                const isExpanded = expandedTeamId === team.id;

                return (
                  <Fragment key={team.id}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedTeamId(isExpanded ? null : team.id)
                      }
                    >
                      <td className="px-4 py-3 text-sm">
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {team.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 3).map((member) => (
                            <Avatar
                              key={member.id}
                              src={member.avatarUrl}
                              alt={member.name}
                              size="md"
                            />
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-primary-500/40 dark:bg-primary-400/50 flex items-center justify-center text-xs font-semibold text-primary-900 dark:text-white border border-primary-600/60 dark:border-primary-300/50" title={`+${teamMembers.length - 3} more members`}>
                              +{teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {teamWithInsights?.criticalCount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/40 dark:bg-red-500/40 text-red-900 dark:text-red-100 border border-red-600/60 dark:border-red-400/60">
                            {teamWithInsights.criticalCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {teamWithInsights?.warningCount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/40 dark:bg-amber-500/40 text-amber-900 dark:text-amber-100 border border-amber-600/60 dark:border-amber-400/60">
                            {teamWithInsights.warningCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {teamWithInsights?.infoCount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/40 dark:bg-blue-500/40 text-blue-900 dark:text-blue-100 border border-blue-600/60 dark:border-blue-400/60">
                            {teamWithInsights.infoCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                        {currentUser && canEditTeam(currentUser, team.id, teamOwnerships) && (
                          <button
                            onClick={() => handleEdit(team)}
                            className="inline-flex items-center gap-1 text-xs btn-primary"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {currentUser && canDeleteTeam(currentUser, team.id, teamOwnerships) && (
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="inline-flex items-center gap-1 text-xs bg-red-500/40 dark:bg-red-400/50 text-red-900 dark:text-white rounded-lg hover:bg-red-500/50 dark:hover:bg-red-400/60 transition-all duration-200 border border-red-600/60 dark:border-red-300/50 font-semibold px-3 py-1.5"
                            style={{
                              backdropFilter: 'blur(12px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded row with insights */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="space-y-4">
                            {/* Team Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                  Team Members ({teamMembers.length})
                                </h4>
                                <div className={`flex flex-wrap gap-2 ${teamMembers.length > 8 ? 'max-h-40 overflow-y-auto pr-2 scrollbar-hide' : ''}`}>
                                  {teamMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-glass-light dark:bg-glass-dark border border-glass-light dark:border-glass-dark text-gray-900 dark:text-gray-100"
                                    >
                                      <Avatar src={member.avatarUrl} alt={member.name} size="sm" />
                                      <span className="whitespace-nowrap">{member.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                  Description
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {team.description || 'No description provided'}
                                </p>
                              </div>
                            </div>

                            {/* Insights Section */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Insights
                              </h4>
                              {teamWithInsights?.insightsLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Loading insights...
                                  </span>
                                </div>
                              ) : teamWithInsights?.insights && teamWithInsights.insights.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {teamWithInsights.insights.map((insight) => (
                                    <InsightCard
                                      key={insight.id}
                                      insight={insight}
                                      onDismiss={() => {
                                        // Handle dismiss if needed
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  No insights for this team yet
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No teams found"
          description={searchQuery ? 'Try adjusting your search criteria.' : 'Create your first team to get started.'}
          action={
            currentUser && canCreateTeam(currentUser) ? (
              <Button
                onClick={() => {
                  setEditingTeam(undefined);
                  setIsModalOpen(true);
                }}
                className="btn-primary"
              >
                Create Team
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Pagination - only show if more than one page */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTeams.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      <TeamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingTeam ? handleUpdate : handleCreate}
        team={editingTeam}
        members={members}
        users={users}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
      />

      {slaConfigTeamId && (
        <TeamSLAConfig
          isOpen={!!slaConfigTeamId}
          onClose={() => setSlaConfigTeamId(null)}
          teamId={slaConfigTeamId}
        />
      )}
    </div>
  );
}
