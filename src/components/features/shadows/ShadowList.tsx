import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Shadow, Member } from '@/types';
import { format } from 'date-fns';
import ShadowFormModal from './ShadowFormModal';
import { Pagination, Avatar } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateShadow, canEditShadow, canDeleteShadow } from '@/lib/utils/permissions';

interface ShadowListProps {
  shadows: Shadow[];
  members: Member[];
  onCreateShadow: (shadow: Omit<Shadow, 'id'>) => void;
  onCreateShadowsBulk?: (shadows: Omit<Shadow, 'id'>[]) => void;
  onUpdateShadow: (id: string, shadow: Partial<Shadow>) => void;
  onDeleteShadow: (id: string) => void;
}

export default function ShadowList({ 
  shadows, 
  members,
  onCreateShadow,
  onCreateShadowsBulk,
  onUpdateShadow, 
  onDeleteShadow 
}: ShadowListProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShadow, setEditingShadow] = useState<Shadow | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const handleEdit = (shadow: Shadow) => {
    setEditingShadow(shadow);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this shadow assignment?')) {
      onDeleteShadow(id);
    }
  };

  const handleSave = (shadowData: Omit<Shadow, 'id'>) => {
    if (editingShadow) {
      onUpdateShadow(editingShadow.id, shadowData);
    } else {
      onCreateShadow(shadowData);
    }
  };

  const handleSaveBulk = (shadows: Omit<Shadow, 'id'>[]) => {
    if (onCreateShadowsBulk) {
      onCreateShadowsBulk(shadows);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShadow(undefined);
  };

  const getMemberById = (id: string) => members.find(m => m.id === id);

  // Filter shadows based on search query
  const filteredShadows = useMemo(() => {
    if (!searchQuery.trim()) return shadows;
    
    const query = searchQuery.toLowerCase();
    return shadows.filter(shadow => {
      const primary = getMemberById(shadow.userId);
      const shadowMember = getMemberById(shadow.shadowUserId);
      
      return (
        (primary && primary.name.toLowerCase().includes(query)) ||
        (shadowMember && shadowMember.name.toLowerCase().includes(query))
      );
    });
  }, [shadows, searchQuery, members]);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);
  
  // Pagination logic
  const totalItems = filteredShadows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShadows = filteredShadows.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ShadowFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        onSaveBulk={handleSaveBulk}
        shadow={editingShadow}
        title={editingShadow ? 'Edit Shadow Assignment' : 'Create Shadow Assignment'}
        members={members}
        existingShadows={shadows}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 sm:w-7 sm:h-7" />
            Shadow Assignments
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pair experienced members with learners for knowledge transfer
          </p>
        </div>
        {canCreateShadow(currentUser) && (
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary w-full sm:w-auto">
            Add Shadow
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search shadows by member name..."
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

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {searchQuery ? (
          <span>Found {totalItems} shadow {totalItems === 1 ? 'assignment' : 'assignments'}</span>
        ) : (
          <span>{totalItems} total shadow {totalItems === 1 ? 'assignment' : 'assignments'}</span>
        )}
      </div>

      {filteredShadows.length === 0 ? (
        <div className="card text-center py-12">
          <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No shadow assignments found' : 'No Shadow Assignments'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Create shadow assignments to help new members learn from experienced ones.'}
          </p>
          {!searchQuery && canCreateShadow(currentUser) && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
              Create First Shadow Assignment
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedShadows.map(shadow => {
            const primary = getMemberById(shadow.userId);
            const shadowMember = getMemberById(shadow.shadowUserId);
            
            if (!primary || !shadowMember) return null;

            return (
              <div key={shadow.id} className="card group hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="relative">
                      <Avatar 
                        src={primary.avatarUrl} 
                        alt={primary.name}
                        size="xl"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <Avatar 
                          src={shadowMember.avatarUrl} 
                          alt={shadowMember.name}
                          size="lg"
                          className="border-2 border-white dark:border-gray-800"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Shadow Assignment
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        Active
                      </div>
                    </div>
                  </div>
                  {(canEditShadow(currentUser, shadow.shadowUserId, shadow.userId) || canDeleteShadow(currentUser, shadow.shadowUserId, shadow.userId)) && (
                    <div className="flex space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {canEditShadow(currentUser, shadow.shadowUserId, shadow.userId) && (
                        <button
                          type="button"
                          onClick={() => handleEdit(shadow)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                      {canDeleteShadow(currentUser, shadow.shadowUserId, shadow.userId) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(shadow.id)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Primary (Mentor)
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar 
                          src={primary.avatarUrl} 
                          alt={primary.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                            {primary.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {primary.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-1">
                    <div className="text-gray-400">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Shadow (Learning)
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar 
                          src={shadowMember.avatarUrl} 
                          alt={shadowMember.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                            {shadowMember.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {shadowMember.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs">
                      <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Start:</span> {format(new Date(shadow.startDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">End:</span> {shadow.endDate ? format(new Date(shadow.endDate), 'MMM d, yyyy') : 'Ongoing'}
                      </div>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
