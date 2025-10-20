'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/lib/auth';
import { Shield, Edit2, X, UserPlus } from 'lucide-react';
import { Pagination } from '@/components/shared';
import { AuthProviderBadge, RoleBadge } from '@/lib/utils/badges';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user' | 'viewer'>('user');
  
  // Create user state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user' | 'viewer'>('user');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      fetchUsers();
      setCurrentPage(1); // Reset to first page when modal opens
    }
  }, [isOpen, user]);
  
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when items per page changes
  }, [itemsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      await fetchUsers();
      setEditingUser(null);
      setError('');
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      await fetchUsers();
      setShowCreateUser(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen || !user || user.role !== 'admin') return null;

  // Pagination logic
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
          {/* Header */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-white/40 dark:border-white/20 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateUser(true)}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            ) : (
              <>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Auth Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {userItem.avatarUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={userItem.avatarUrl}
                                  alt={userItem.name}
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                                  {userItem.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {userItem.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={userItem.role} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AuthProviderBadge provider={userItem.authProvider as 'local' | 'oauth' | 'ldap'} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            userItem.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
                          }`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingUser(userItem);
                              setEditRole(userItem.role);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit User Role
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Change role for <strong className="text-gray-900 dark:text-white">{editingUser.name}</strong>
              </p>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'admin' | 'user' | 'viewer')}
                className="input"
              >
                <option value="viewer">Viewer</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><strong>Admin:</strong> Full access to all features</p>
                <p><strong>User:</strong> Can manage their own content</p>
                <p><strong>Viewer:</strong> Read-only access</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="btn-primary"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New User
              </h3>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserRole('user');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="newName" className="label">Name</label>
                <input
                  type="text"
                  id="newName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="newEmail" className="label">Email</label>
                <input
                  type="email"
                  id="newEmail"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="label">Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">At least 8 characters</p>
              </div>

              <div>
                <label htmlFor="newRole" className="label">Role</label>
                <select
                  id="newRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user' | 'viewer')}
                  className="input"
                >
                  <option value="viewer">Viewer</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUserName('');
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserRole('user');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
