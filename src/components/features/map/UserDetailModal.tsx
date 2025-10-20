// Client portal modal for user detail
"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail } from 'lucide-react';
import { UserCard } from '@/components/shared';

interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: 'admin' | 'user' | 'viewer';
  city?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  onCall?: boolean;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  referenceTime: Date;
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  referenceTime,
}: UserDetailModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
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
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/40 dark:border-white/20">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            User Details
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
        <div className="relative">
          <UserCard
            className="p-4"
            user={{ ...user, email: user.email || '' }}
            size="md"
            showEmail={true}
            showLocation={true}
            showRole={true}
            referenceTime={referenceTime}
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/40 dark:border-white/20 space-y-2">
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </a>
          )}
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
