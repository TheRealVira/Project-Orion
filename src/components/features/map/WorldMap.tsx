'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, Globe } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { Avatar } from '@/components/shared';
import SimpleWorldMap from './SimpleWorldMap';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'admin' | 'user' | 'viewer';
  city?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  onCall?: boolean;
}

interface WorldMapProps {
  users?: User[];
}

export default function WorldMap({ users: propUsers }: WorldMapProps = {}) {
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!propUsers);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!propUsers) {
      fetchUsers();
    }
  }, [propUsers]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setFetchedUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const users = propUsers || fetchedUsers;

  const usersWithLocation = users.filter(
    (user) => user.latitude && user.longitude
  );

  const usersByTimezone = users.reduce((acc, user) => {
    if (!user.timezone) return acc;
    if (!acc[user.timezone]) acc[user.timezone] = [];
    acc[user.timezone].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner size="xl" center />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Map */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden" style={{ borderRadius: '16px' }}>
        <div className="h-[600px] relative">
          {usersWithLocation.length > 0 ? (
            <SimpleWorldMap users={usersWithLocation} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Locations Yet
                </h3>
                <p className="text-sm text-gray-400">
                  Team members can add their location in Settings to appear on the map.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
