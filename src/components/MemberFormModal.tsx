import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { canChangeUserRole } from '@/lib/permissions';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => void;
  member?: Member;
  title: string;
}

export default function MemberFormModal({ isOpen, onClose, onSave, member, title }: MemberFormModalProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
  });

  // Update form data when member changes (for editing)
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        avatarUrl: member.avatarUrl || '',
        password: '', // Don't populate password when editing
        role: member.role || 'user', // Use actual role from member, default to 'user' if not set
      });
    } else {
      setFormData({ name: '', email: '', phone: '', avatarUrl: '', password: '', role: 'user' });
    }
  }, [member]);

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
    
    onSave(formData);
    onClose();
    // Reset form
    setFormData({ name: '', email: '', phone: '', avatarUrl: '', password: '', role: 'user' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-xl max-w-md w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
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
