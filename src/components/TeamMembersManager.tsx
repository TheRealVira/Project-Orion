import { useState, useMemo } from 'react';
import { Search, UserPlus, X, Crown } from 'lucide-react';
import { Member } from '@/types';
import Avatar from './Avatar';
import AddTeamMembersModal from './AddTeamMembersModal';

interface TeamMembersManagerProps {
  members: Member[]; // All members in the system
  selectedMemberIds: string[]; // Currently selected team member IDs
  ownerIds: string[]; // Currently selected owner IDs
  onMembersChange: (memberIds: string[]) => void;
  onOwnerToggle: (memberId: string) => void;
}

export default function TeamMembersManager({
  members,
  selectedMemberIds,
  ownerIds,
  onMembersChange,
  onOwnerToggle
}: TeamMembersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Get currently selected members
  const selectedMembers = useMemo(() => {
    return members.filter(m => selectedMemberIds.includes(m.id));
  }, [members, selectedMemberIds]);

  // Get available members (not yet in team)
  const availableMembers = useMemo(() => {
    return members.filter(m => !selectedMemberIds.includes(m.id));
  }, [members, selectedMemberIds]);

  // Filter selected members based on search
  const filteredSelectedMembers = useMemo(() => {
    if (!searchQuery.trim()) return selectedMembers;
    
    const query = searchQuery.toLowerCase();
    return selectedMembers.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }, [selectedMembers, searchQuery]);

  const handleAddMembers = (memberIds: string[]) => {
    onMembersChange([...selectedMemberIds, ...memberIds]);
  };

  const handleRemoveMember = (memberId: string) => {
    onMembersChange(selectedMemberIds.filter(id => id !== memberId));
  };

  return (
    <div>
      <label className="label">
        Team Members *
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Add members to this team and assign owners
      </p>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="input pl-9 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center space-x-2 whitespace-nowrap min-h-[44px] sm:min-h-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Members</span>
        </button>
      </div>

      {/* Member List */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-96 overflow-hidden flex flex-col">
        {selectedMemberIds.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No members in this team yet
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Member</span>
            </button>
          </div>
        ) : filteredSelectedMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No members found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            {filteredSelectedMembers.map(member => {
              const isOwner = ownerIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar
                      src={member.avatarUrl}
                      alt={member.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    {/* Owner Toggle */}
                    <label className="flex items-center space-x-1.5 text-xs text-yellow-700 dark:text-yellow-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwner}
                        onChange={() => onOwnerToggle(member.id)}
                        className="w-3.5 h-3.5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <Crown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Owner</span>
                    </label>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove from team"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMemberIds.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <Crown className="w-3 h-3 text-yellow-500" />
          Team owners can edit team settings and assignments
        </p>
      )}

      {/* Add Members Modal */}
      <AddTeamMembersModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMembers}
        availableMembers={availableMembers}
      />
    </div>
  );
}
