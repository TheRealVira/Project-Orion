'use client';

import { useState, useMemo } from 'react';
import { Member } from '@/types';
import { Search, X, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/shared';

interface ShadowMemberSelectorProps {
  members: Member[];
  selectedMemberId: string;
  onSelect: (memberId: string) => void;
  label: string;
  placeholder: string;
  excludeIds?: string[];
}

export default function ShadowMemberSelector({
  members,
  selectedMemberId,
  onSelect,
  label,
  placeholder,
  excludeIds = []
}: ShadowMemberSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const filteredMembers = useMemo(() => {
    let filtered = members.filter(m => !excludeIds.includes(m.id));
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [members, searchQuery, excludeIds]);

  const handleSelect = (memberId: string) => {
    onSelect(memberId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <label className="label">{label} *</label>
      
      {/* Selected Member Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input text-left flex items-center justify-between hover:border-primary-500 transition-colors"
      >
        {selectedMember ? (
          <div className="flex items-center gap-3">
            <Avatar 
              src={selectedMember.avatarUrl} 
              alt={selectedMember.name}
              size="md"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedMember.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMember.email}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <UserPlus className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Members List */}
            <div className="overflow-y-auto max-h-60">
              {filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No members found
                </div>
              ) : (
                filteredMembers.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelect(member.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <Avatar 
                      src={member.avatarUrl} 
                      alt={member.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.email}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
