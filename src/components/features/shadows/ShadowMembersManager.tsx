'use client';

import { useState, useMemo } from 'react';
import { Member, Shadow } from '@/types';
import { Search, X, UserPlus, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/shared';

interface ShadowMembersManagerProps {
  members: Member[];
  selectedShadowIds: string[];
  onChange: (shadowIds: string[]) => void;
  excludeIds?: string[];
  primaryMemberId?: string;
  existingShadows?: Shadow[];
}

export default function ShadowMembersManager({
  members,
  selectedShadowIds,
  onChange,
  excludeIds = [],
  primaryMemberId = '',
  existingShadows = []
}: ShadowMembersManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedShadows = members.filter(m => selectedShadowIds.includes(m.id));

  // Check if a shadow assignment already exists
  const isExistingShadow = (memberId: string): boolean => {
    if (!primaryMemberId) return false;
    return existingShadows.some(
      shadow => shadow.userId === primaryMemberId && shadow.shadowUserId === memberId
    );
  };

  const availableMembers = useMemo(() => {
    let filtered = members.filter(
      m => !selectedShadowIds.includes(m.id) && !excludeIds.includes(m.id)
    );
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [members, selectedShadowIds, searchQuery, excludeIds]);

  const handleAdd = (memberId: string) => {
    onChange([...selectedShadowIds, memberId]);
    setIsAdding(false);
    setSearchQuery('');
  };

  const handleRemove = (memberId: string) => {
    onChange(selectedShadowIds.filter(id => id !== memberId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Shadow Members (Learning) *</label>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          Add Shadow
        </button>
      </div>

      {/* Selected Shadows List */}
      {selectedShadows.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No shadow members selected. Click &quot;Add Shadow&quot; to add members who will learn from the primary member.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedShadows.map(shadow => (
            <div
              key={shadow.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar 
                  src={shadow.avatarUrl} 
                  alt={shadow.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {shadow.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {shadow.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(shadow.id)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                title="Remove shadow member"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Shadow members will learn from the primary member during the specified period
      </p>

      {/* Add Shadow Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Shadow Member
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-2">
              {availableMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? 'No members found' : 'No more members available'}
                </div>
              ) : (
                availableMembers.map(member => {
                  const alreadyExists = isExistingShadow(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAdd(member.id)}
                      className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors text-left ${
                        alreadyExists 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Avatar 
                        src={member.avatarUrl} 
                        alt={member.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.name}
                          </div>
                          {alreadyExists && (
                            <span title="Already assigned as shadow">
                              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.email}
                        </div>
                        {alreadyExists && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                            Already assigned as shadow
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
