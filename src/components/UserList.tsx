import { useState, useMemo } from 'react';
import { Member } from '@/types';
import { Mail, Phone, Edit, Trash2, UserCircle, Search, Shield } from 'lucide-react';
import MemberFormModal from './MemberFormModal';
import Avatar from './Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateUser, canEditUser, canDeleteUser } from '@/lib/permissions';

interface UserListProps {
  members: Member[];
  onCreateMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMember: (id: string, member: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

type RoleFilter = 'all' | 'admin' | 'user' | 'viewer';

export default function UserList({ members, onCreateMember, onUpdateMember, onDeleteMember }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      onDeleteMember(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  // Filter users based on search query and role
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        (member.phone && member.phone.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [members, searchQuery, roleFilter]);

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

      {/* Role Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Users
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('admin')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'admin'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Admins
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('user')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'user'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('viewer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'viewer'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Viewers
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
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

      <MemberFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingMember ? handleUpdate : handleCreate}
        member={editingMember}
        title={editingMember ? 'Edit User' : 'Add User'}
      />

      {/* Results count */}
      {(searchQuery || roleFilter !== 'all') && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filteredMembers.length} {filteredMembers.length === 1 ? 'user' : 'users'}
          {roleFilter !== 'all' && ` with role: ${roleFilter}`}
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="card text-center py-12">
          <UserCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || roleFilter !== 'all' ? 'No users found' : 'No users yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first user to get started.'}
          </p>
          {!searchQuery && roleFilter === 'all' && canCreateUser(currentUser) && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
              Add User
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMembers.map(member => (
          <div key={member.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <Avatar 
                  src={member.avatarUrl} 
                  alt={member.name}
                  size="xl"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {member.name}
                </h3>
                <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <a 
                      href={`mailto:${member.email}`}
                      className="hover:text-primary-600 truncate"
                    >
                      {member.email}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : member.role === 'user'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {(member.role || 'user').charAt(0).toUpperCase() + (member.role || 'user').slice(1)}
                    </span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <a 
                        href={`tel:${member.phone}`}
                        className="hover:text-primary-600"
                      >
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {(canEditUser(currentUser, member.id) || canDeleteUser(currentUser, member.id)) && (
              <div className="flex space-x-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                {canEditUser(currentUser, member.id) && (
                  <button
                    type="button"
                    onClick={() => handleEdit(member)}
                    className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px] sm:min-h-0"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Edit</span>
                  </button>
                )}
                {canDeleteUser(currentUser, member.id) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors min-h-[44px] sm:min-h-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
