"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Table } from '@/components/shared';

interface UsersListModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  users: T[];
  onUserClick: (user: T) => void;
  referenceTime: Date;
}

export default function UsersListModal<T = any>({
  isOpen,
  onClose,
  users,
  onUserClick,
  referenceTime,
}: UsersListModalProps<T>) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-gray-400/50 dark:bg-gray-600/50 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/40 dark:border-white/20 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Users at this location ({users.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition-all duration-200 hover:bg-white/30 dark:hover:bg-white/10 rounded-lg backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <Table
            data={users as unknown as Record<string, any>[]}
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'email', label: 'Email', sortable: true },
              { key: 'role', label: 'Role', sortable: true },
              { key: 'city', label: 'City', sortable: true },
            ]}
            itemsPerPage={8}
            showPagination={users.length > 8}
            emptyMessage="No users at this location"
            avatarField="avatarUrl"
            nameField="name"
            onRowClick={onUserClick as unknown as (row: Record<string, any>) => void}
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/40 dark:border-white/20 sticky bottom-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
