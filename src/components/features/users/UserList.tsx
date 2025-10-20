import { useState } from 'react';
import { Member, Team } from '@/types';
import { UserCircle } from 'lucide-react';
import UserFormModal from './UserFormModal';
import { Table } from '@/components/shared';
import { ConfirmationModal } from '@/components/ui';
import { UserDetailModal } from '@/components/features/map';
import { WorldMap } from '@/components/features/map';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateUser, canEditUser, canDeleteUser } from '@/lib/utils/permissions';

interface UserListProps {
  members: Member[];
  teams: Team[];
  onCreateMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMember: (id: string, member: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

export default function UserList({ members, teams, onCreateMember, onUpdateMember, onDeleteMember }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);

  const handleCreate = (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    onCreateMember(memberData);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleUpdate = (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMember) {
      onUpdateMember(editingMember.id, memberData);
    }
  };

  const handleDelete = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      onDeleteMember(memberToDelete.id);
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            Users
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and access permissions
          </p>
        </div>
        {canCreateUser(currentUser) && (
          <button 
            type="button"
            className="btn-primary w-full sm:w-auto"
            onClick={() => setIsModalOpen(true)}
          >
            Add User
          </button>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingMember ? handleUpdate : handleCreate}
        member={editingMember}
        title={editingMember ? 'Edit User' : 'Add User'}
      />

      {/* World Map */}
      <div className="card p-0 overflow-visible" style={{ height: '600px' }}>
        <WorldMap users={filteredMembers} />
      </div>

      {/* User Table */}
      <div className="card">
        <Table
          data={members}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'phone', label: 'Phone', sortable: true },
            { key: 'role', label: 'Role', sortable: true },
            { key: 'authProvider', label: 'Authentication', sortable: true },
            { key: 'city', label: 'City', sortable: true },
            { key: 'country', label: 'Country', sortable: true },
          ]}
          itemsPerPage={20}
          onFilterChange={setFilteredMembers}
          onRowClick={(user: Member) => setSelectedUser(user)}
          onEdit={
            currentUser
              ? (user: Member) => {
                  if (canEditUser(currentUser, user.id)) {
                    handleEdit(user);
                  }
                }
              : undefined
          }
          onDelete={
            currentUser
              ? (user: Member) => {
                  if (canDeleteUser(currentUser, user.id)) {
                    handleDelete(user);
                  }
                }
              : undefined
          }
          showActions={members.some(member => canEditUser(currentUser, member.id) || canDeleteUser(currentUser, member.id))}
          emptyMessage="No users found"
          avatarField="avatarUrl"
          nameField="name"
          statusField={undefined}
        />
      </div>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${memberToDelete?.name}?`}
        description="This action cannot be undone. The user account will be permanently removed."
        confirmText="Delete User"
        cancelText="Cancel"
        isDangerous={true}
      />

      <UserDetailModal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        user={selectedUser!}
        referenceTime={new Date()}
      />
    </div>
  );
}
