import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Team, Member } from '@/types';
import { User } from '@/lib/auth';
import TeamMembersManager from './TeamMembersManager';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => void;
  team?: Team;
  title: string;
  members: Member[];
  users: User[];
}

export default function TeamFormModal({ isOpen, onClose, onSave, team, title, members, users }: TeamFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0ea5e9',
    memberIds: [] as string[],
  });
  
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Update form data when team changes (for editing)
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        color: team.color,
        memberIds: team.memberIds,
      });
      // Fetch existing owners
      fetchOwners(team.id);
    } else {
      setFormData({ name: '', description: '', color: '#0ea5e9', memberIds: [] });
      setOwnerIds([]);
    }
  }, [team]);

  const fetchOwners = async (teamId: string) => {
    try {
      setLoadingOwners(true);
      const response = await fetch('/api/team-owners');
      if (response.ok) {
        const data = await response.json();
        // data is a map of teamId -> userId[]
        const owners = data[teamId] || [];
        setOwnerIds(owners);
      }
    } catch (error) {
      console.error('Failed to fetch team owners:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, ownerIds);
    onClose();
    // Reset form
    setFormData({ name: '', description: '', color: '#0ea5e9', memberIds: [] });
    setOwnerIds([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleMembersChange = (memberIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      memberIds
    }));
    
    // Remove any owners that are no longer members
    setOwnerIds(prev => prev.filter(id => memberIds.includes(id)));
  };

  const handleOwnerToggle = (memberId: string) => {
    setOwnerIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
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
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Platform Team"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Team description..."
            />
          </div>

          <div>
            <label htmlFor="color" className="label">
              Team Color *
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={handleChange}
                name="color"
                className="input flex-1"
                placeholder="#0ea5e9"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Team Members Manager */}
          <TeamMembersManager
            members={members}
            selectedMemberIds={formData.memberIds}
            ownerIds={ownerIds}
            onMembersChange={handleMembersChange}
            onOwnerToggle={handleOwnerToggle}
          />

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
              {team ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
