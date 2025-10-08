import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Shadow, Member } from '@/types';
import { format, addMonths } from 'date-fns';
import ShadowMemberSelector from './ShadowMemberSelector';
import ShadowMembersManager from './ShadowMembersManager';

interface ShadowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shadow: Omit<Shadow, 'id'>) => void;
  onSaveBulk?: (shadows: Omit<Shadow, 'id'>[]) => void;
  shadow?: Shadow;
  title: string;
  members: Member[];
  existingShadows?: Shadow[];
}

export default function ShadowFormModal({ 
  isOpen, 
  onClose, 
  onSave,
  onSaveBulk,
  shadow, 
  title, 
  members,
  existingShadows = []
}: ShadowFormModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    shadowUserIds: [] as string[],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
  });

  // Update form data when shadow changes (editing single shadow)
  useEffect(() => {
    if (shadow) {
      setFormData({
        userId: shadow.userId,
        shadowUserIds: [shadow.shadowUserId],
        startDate: format(new Date(shadow.startDate), 'yyyy-MM-dd'),
        endDate: shadow.endDate ? format(new Date(shadow.endDate), 'yyyy-MM-dd') : format(addMonths(new Date(shadow.startDate), 3), 'yyyy-MM-dd'),
      });
    } else {
      setFormData({
        userId: '',
        shadowUserIds: [],
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
      });
    }
  }, [shadow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      alert('Please select a primary member');
      return;
    }
    if (formData.shadowUserIds.length === 0) {
      alert('Please select at least one shadow member');
      return;
    }
    if (formData.shadowUserIds.includes(formData.userId)) {
      alert('Primary member cannot be their own shadow');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date');
      return;
    }

    // If editing existing shadow (only one shadow member), use single save
    if (shadow && formData.shadowUserIds.length === 1) {
      onSave({
        userId: formData.userId,
        shadowUserId: formData.shadowUserIds[0],
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
    } else if (onSaveBulk) {
      // Creating new shadows or editing with multiple shadows - create one record per shadow member
      const shadows = formData.shadowUserIds.map(shadowUserId => ({
        userId: formData.userId,
        shadowUserId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      }));
      onSaveBulk(shadows);
    }
    
    onClose();
    // Reset form
    setFormData({ 
      userId: '', 
      shadowUserIds: [], 
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd')
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Shadow assignments</strong> pair an experienced member (mentor) with one or more people learning the role.
            </p>
          </div>

          <ShadowMemberSelector
            members={members}
            selectedMemberId={formData.userId}
            onSelect={(userId) => setFormData(prev => ({ ...prev, userId }))}
            label="Primary Member (Mentor)"
            placeholder="Select primary member..."
            excludeIds={[]}
          />

          <ShadowMembersManager
            members={members}
            selectedShadowIds={formData.shadowUserIds}
            onChange={(shadowUserIds) => setFormData(prev => ({ ...prev, shadowUserIds }))}
            excludeIds={formData.userId ? [formData.userId] : []}
            primaryMemberId={formData.userId}
            existingShadows={existingShadows}
          />

          <div>
            <label htmlFor="startDate" className="label">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="label">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Typical shadow period is 1-3 months
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
              {shadow ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
