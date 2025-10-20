'use client';

import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Table, Avatar } from '@/components/shared';
import { ConfirmationModal } from '@/components/ui';
import TeamFormModal from './TeamFormModal';
import { Team, Member } from '@/types';
import { User } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface TeamsListProps {
  teams?: Team[];
  members?: Member[];
  users?: User[];
}

export default function TeamsList({ teams = [], members = [], users = [] }: TeamsListProps) {
  const { user: currentUser } = useAuth();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const columns = useMemo(() => [
    {
      key: 'name' as const,
      label: 'Team Name',
      render: (value: string, team: Team) => (
        <div className="flex items-center gap-3">
          <Avatar
            alt={team.name}
            src={(team as any).avatarUrl}
            size="sm"
            bgColor={team.color}
            useInlineStyle={true}
          />
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: 'description' as const,
      label: 'Description',
      render: (value: string) => (
        <div className="text-sm">{value || '-'}</div>
      ),
    },
    {
      key: 'memberIds' as const,
      label: 'Members',
      render: (_value: string[] | undefined, team: Team) => (
        <div className="text-sm">
          {team.memberIds?.length || 0} members
        </div>
      ),
    },
  ], []);

  const handleCreate = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleUpdate = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTeam?.id) return;

    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingTeam(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    
    try {
      const response = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsDeleteConfirmOpen(false);
        setTeamToDelete(null);
        window.location.reload();
      } else {
        alert('Failed to delete team');
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Error deleting team');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-gray-700 dark:text-gray-300" />
            <h1 className="text-3xl font-bold">Teams</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your organization teams
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          Create Team
        </button>
      </div>

      <div className="card">
        <Table
          data={teams}
          columns={columns}
          itemsPerPage={10}
          emptyMessage="No teams found"
          showInsights={true}
          insightsEndpoint={(teamId) => `/api/teams/${teamId}/insights`}
          onEdit={
            currentUser?.role === 'admin'
              ? handleEditTeam
              : undefined
          }
          onDelete={
            currentUser?.role === 'admin'
              ? handleDeleteTeam
              : undefined
          }
          showActions={currentUser?.role === 'admin'}
        />
      </div>

      <TeamFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        title="Create Team"
        members={members}
        users={users}
      />

      {editingTeam && (
        <TeamFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTeam(null);
          }}
          onSave={handleUpdate}
          team={editingTeam}
          title="Edit Team"
          members={members}
          users={users}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        message={`Are you sure you want to delete ${teamToDelete?.name}?`}
        description="This action cannot be undone. The team and all associated data will be permanently removed."
        confirmText="Delete Team"
        cancelText="Cancel"
        isDangerous={true}
      />
    </div>
  );
}

