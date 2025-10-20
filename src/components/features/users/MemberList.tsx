import { useState, useMemo } from 'react';
import { Member } from '@/types';
import { Mail, Phone, Edit, Trash2, Users, Search } from 'lucide-react';
import UserFormModal from './UserFormModal';
import { Avatar } from '@/components/shared';

interface MemberListProps {
  members: Member[];
  onCreateMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMember: (id: string, member: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

export default function MemberList({ members, onCreateMember, onUpdateMember, onDeleteMember }: MemberListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (member.phone && member.phone.toLowerCase().includes(query))
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            Team Members
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage team members (user accounts with system access)
          </p>
        </div>
        <button 
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search members by name, email, or phone..."
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingMember ? handleUpdate : handleCreate}
        member={editingMember}
        title={editingMember ? 'Edit Member' : 'Add Member'}
      />

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No members found' : 'No members yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Add your first team member to get started.'}
          </p>
          {!searchQuery && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
              Add Member
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
            <div className="flex space-x-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleEdit(member)}
                className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px] sm:min-h-0"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(member.id)}
                className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors min-h-[44px] sm:min-h-0"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
