import { useState, useMemo } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Member } from '@/types';
import { Avatar } from '@/components/shared';

interface AddTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberIds: string[]) => void;
  availableMembers: Member[]; // Members not yet in the team
  title?: string;
}

export default function AddTeamMembersModal({
  isOpen,
  onClose,
  onAdd,
  availableMembers,
  title = 'Add Team Members'
}: AddTeamMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Filter available members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers;
    
    const query = searchQuery.toLowerCase();
    return availableMembers.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }, [availableMembers, searchQuery]);

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map(m => m.id));
    }
  };

  const handleAdd = () => {
    if (selectedMemberIds.length === 0) {
      alert('Please select at least one member');
      return;
    }
    onAdd(selectedMemberIds);
    setSelectedMemberIds([]);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedMemberIds([]);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {availableMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                All members are already in this team
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No members found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMemberIds.length} of {filteredMembers.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {selectedMemberIds.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Members */}
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => handleToggleMember(member.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
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
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary flex-1 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedMemberIds.length === 0}
            className="btn-primary flex-1 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
