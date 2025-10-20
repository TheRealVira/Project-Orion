'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { LocationInput } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Member } from '@/types';
import { canChangeUserRole } from '@/lib/utils/permissions';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void; // Used for member creation/update
  member?: Member | null; // Member being edited (null for new member)
  title: string;
}

export default function UserFormModal({ isOpen, onClose, onSave, member, title }: UserFormModalProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
    city: '',
    country: '',
    timezone: '',
    latitude: '',
    longitude: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form data when member changes (for editing)
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        avatarUrl: member.avatarUrl || '',
        password: '', // Don't populate password when editing
        role: member.role || 'user',
        city: member.city || '',
        country: member.country || '',
        timezone: member.timezone || '',
        latitude: member.latitude?.toString() || '',
        longitude: member.longitude?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatarUrl: '',
        password: '',
        role: 'user',
        city: '',
        country: '',
        timezone: '',
        latitude: '',
        longitude: '',
      });
    }
  }, [member]);

  const handleLocationChange = useCallback((data: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      latitude: data.latitude?.toString() || '',
      longitude: data.longitude?.toString() || '',
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password for new members
    if (!member && !formData.password) {
      alert('Password is required for new members');
      return;
    }
    
    if (!member && formData.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    // Convert latitude/longitude to numbers if provided
    const saveData: any = { ...formData };
    if (formData.latitude) saveData.latitude = parseFloat(formData.latitude);
    if (formData.longitude) saveData.longitude = parseFloat(formData.longitude);
    
    if (onSave) {
      onSave(saveData);
    }
    
    // Don't close here - let the parent component close after successful save
    // onClose() should be called by the parent after they've successfully saved
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/40 dark:border-white/20 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="+1-555-0123"
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="label">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              className="input"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password {!member && '*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!member}
              className="input"
              placeholder={member ? 'Leave blank to keep current' : 'Minimum 8 characters'}
            />
            {!member && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 8 characters required
              </p>
            )}
            {member && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep current password
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="label">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={!canChangeUserRole(currentUser)}
              className="input disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="viewer">Viewer - View only access</option>
              <option value="user">User - Standard access</option>
              <option value="admin">Admin - Full access</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {canChangeUserRole(currentUser)
                ? 'Role determines system permissions'
                : 'Only admins can change user roles'}
            </p>
          </div>

          {/* Location Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Location</h3>
            
            <LocationInput
              city={formData.city}
              country={formData.country}
              onLocationChange={handleLocationChange}
              label="Search Location"
              placeholder="e.g., New York, USA or London, UK"
            />

            {formData.timezone && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Timezone:</strong> {formData.timezone.replace('_', ' ')}
                </p>
                {formData.latitude && formData.longitude && (
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-3 sm:pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-4 sm:pb-0 -mx-4 sm:-mx-0 px-4 sm:px-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 min-h-[44px]"
            >
              {member ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
