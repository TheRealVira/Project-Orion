import { useState, useMemo, useEffect } from 'react';
import { Team, Member } from '@/types';
import { Users as UsersIcon, Edit, Trash2, Search, Clock } from 'lucide-react';
import TeamFormModal from './TeamFormModal';
import TeamSLAConfig from './TeamSLAConfig';
import { Pagination, Avatar } from '@/components/shared';
import { User } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateTeam, canEditTeam, canDeleteTeam } from '@/lib/utils/permissions';
import { Button, EmptyState } from '@/components/ui';

interface TeamListProps {
  teams: Team[];
  members: Member[];
  users: User[];
  onCreateTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => void;
  onUpdateTeam: (id: string, team: Partial<Team>, ownerIds?: string[]) => void;
  onDeleteTeam: (id: string) => void;
}

export default function TeamList({ teams, members, users, onCreateTeam, onUpdateTeam, onDeleteTeam }: TeamListProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamOwnerships, setTeamOwnerships] = useState<Record<string, string[]>>({});
  const [slaConfigTeamId, setSlaConfigTeamId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  const getTeamMembers = (team: Team): Member[] => {
    return team.memberIds
      .map(id => members.find(m => m.id === id))
      .filter((m): m is Member => m !== undefined);
  };

  const handleCreate = (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => {
    onCreateTeam(teamData, ownerIds);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleUpdate = (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => {
    if (editingTeam) {
      onUpdateTeam(editingTeam.id, teamData, ownerIds);
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
  }, [searchQuery, itemsPerPage]);
  
  // Pagination logic
  const totalItems = filteredTeams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            Teams
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize members into teams for on-call assignments
          </p>
        </div>
        {canCreateTeam(currentUser) && (
          <Button 
            variant="primary"
            fullWidth={false}
            className="w-full sm:w-auto"
            onClick={() => setIsModalOpen(true)}
          >
            Add Team
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search teams by name, description, or member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10 w-full"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      <TeamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingTeam ? handleUpdate : handleCreate}
        team={editingTeam}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
        members={members}
        users={users}
      />

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {searchQuery ? (
          <span>Found {totalItems} {totalItems === 1 ? 'team' : 'teams'}</span>
        ) : (
          <span>{totalItems} total {totalItems === 1 ? 'team' : 'teams'}</span>
        )}
      </div>

      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-12 h-12" />}
          title={searchQuery ? 'No teams found' : 'No teams yet'}
          description={searchQuery ? 'Try adjusting your search terms' : 'Create your first team to get started.'}
          action={
            !searchQuery && canCreateTeam(currentUser) ? (
              <Button onClick={() => setIsModalOpen(true)}>
                Create Team
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {paginatedTeams.map(team => {
          const teamMembers = getTeamMembers(team);
          
          return (
            <div key={team.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${team.color}30` }}
                >
                  <UsersIcon 
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: team.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h3>
                  {team.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {team.description}
                    </p>
                  )}
                  
                  {/* Team Owners */}
                  {teamOwnerships[team.id] && teamOwnerships[team.id].length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Owners:</span>
                      <span>
                        {teamOwnerships[team.id]
                          .map(ownerId => users.find(u => u.id === ownerId)?.name || 'Unknown')
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Members ({teamMembers.length})
                  </span>
                </div>
                
                {teamMembers.length > 0 ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    {teamMembers.map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <Avatar 
                          src={member.avatarUrl} 
                          alt={member.name}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic text-center py-3 sm:py-4">
                    No members assigned to this team
                  </div>
                )}
              </div>

              {(canEditTeam(currentUser, team.id, teamOwnerships) || canDeleteTeam(currentUser, team.id, teamOwnerships)) && (
                <div className="space-y-2 mt-3 sm:mt-4">
                  <div className="flex space-x-2">
                    {canEditTeam(currentUser, team.id, teamOwnerships) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(team)}
                          className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm btn-secondary min-h-[44px] sm:min-h-0"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlaConfigTeamId(team.id)}
                          className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm btn-primary min-h-[44px] sm:min-h-0"
                        >
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>SLA</span>
                        </button>
                      </>
                    )}
                    {canDeleteTeam(currentUser, team.id, teamOwnerships) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(team.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-red-500/40 dark:bg-red-400/50 text-red-900 dark:text-white border border-red-600/60 dark:border-red-300/50 hover:bg-red-500/50 dark:hover:bg-red-400/60 font-semibold rounded-xl transition-all min-h-[44px] sm:min-h-0"
                        style={{
                          backdropFilter: 'blur(12px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
        
        {/* Pagination */}
        <div className="card p-0 overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
        </>
      )}

      {/* SLA Configuration Modal */}
      {slaConfigTeamId && (
        <TeamSLAConfig
          teamId={slaConfigTeamId}
          isOpen={true}
          onClose={() => setSlaConfigTeamId(null)}
        />
      )}
    </div>
  );
}
