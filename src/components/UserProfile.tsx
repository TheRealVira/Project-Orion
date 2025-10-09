'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings } from 'lucide-react';
import UserCard from './UserCard';
import Avatar from './Avatar';

interface UserProfileProps {
  onEditProfile?: () => void;
}

export default function UserProfile({ onEditProfile }: UserProfileProps) {
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  // Show loading skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="hidden sm:block space-y-1">
          <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Avatar 
          src={user.avatarUrl} 
          alt={user.name}
          size="md"
        />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </div>
        </div>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <UserCard 
                user={user}
                size="lg"
                showEmail={true}
                showPhone={false}
                showRole={true}
                showAuthProvider={true}
              />
            </div>

            <div className="py-2">
              <button
                type="button"
                onClick={() => {
                  if (onEditProfile) {
                    onEditProfile();
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
