import { useState, useEffect, useRef } from 'react';
import { X, Eye } from 'lucide-react';
import { DateAssignment, Team, Member, Shadow } from '@/types';
import { format } from 'date-fns';
import { Avatar } from '@/components/shared';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Omit<DateAssignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string, skipConfirmation?: boolean) => void;
  assignment?: DateAssignment;
  title: string;
  teams: Team[];
  members: Member[];
  shadows: Shadow[];
  defaultDate?: string;
  allAssignments?: DateAssignment[];
  onLoadExisting?: (assignment: DateAssignment) => void;
}

export default function AssignmentFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  assignment, 
  title, 
  teams, 
  members,
  shadows,
  defaultDate,
  allAssignments = [],
  onLoadExisting
}: AssignmentFormModalProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    teamId: '',
    memberIds: [] as string[],
    shadowIds: [] as string[],
    notes: '',
  });
  
  // Track if form has been modified to prevent unwanted resets
  const isUserEditingRef = useRef(false);
  const initialAssignmentIdRef = useRef<string | undefined>(undefined);

  // Update form data when modal opens or assignment changes
  useEffect(() => {
    // Only reset form data if we're opening the modal with a new assignment or closing/opening
    if (assignment && assignment.id !== initialAssignmentIdRef.current) {
      initialAssignmentIdRef.current = assignment.id;
      isUserEditingRef.current = false;
      setFormData({
        date: assignment.date,
        teamId: assignment.teamId,
        memberIds: assignment.memberIds || [],
        shadowIds: assignment.shadowIds || [],
        notes: assignment.notes || '',
      });
    } else if (!assignment && initialAssignmentIdRef.current !== undefined) {
      // Switching from editing to creating
      initialAssignmentIdRef.current = undefined;
      isUserEditingRef.current = false;
      if (defaultDate) {
        setFormData({
          date: defaultDate,
          teamId: '',
          memberIds: [],
          shadowIds: [],
          notes: '',
        });
      } else {
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          teamId: '',
          memberIds: [],
          shadowIds: [],
          notes: '',
        });
      }
    }
  }, [assignment, defaultDate]);

  // Check for duplicate team assignments and auto-load existing assignment
  useEffect(() => {
    // Only check when creating new assignment (not editing) and user hasn't started editing
    if (!assignment && !isUserEditingRef.current && formData.teamId && formData.date && allAssignments.length > 0 && onLoadExisting) {
      const existingAssignment = allAssignments.find(
        a => a.teamId === formData.teamId && a.date === formData.date
      );
      
      if (existingAssignment) {
        // Automatically load the existing assignment for editing
        onLoadExisting(existingAssignment);
      }
    }
  }, [formData.teamId, formData.date, allAssignments, assignment, onLoadExisting]);

  const selectedTeam = teams.find(t => t.id === formData.teamId);
  const availableMembers = selectedTeam 
    ? members.filter(m => selectedTeam.memberIds.includes(m.id))
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId) {
      alert('Please select a team');
      return;
    }

    // Find which assignment we're actually editing based on current team + date
    const currentAssignment = allAssignments.find(
      a => a.teamId === formData.teamId && a.date === formData.date
    );

    // If editing an existing assignment and no members are selected, delete it
    // (shadows alone don't make sense without primary members)
    if (currentAssignment && formData.memberIds.length === 0) {
      if (onDelete) {
        onDelete(currentAssignment.id, true); // Skip confirmation when deleting via member removal
        onClose();
        // Reset form
        setFormData({ 
          date: format(new Date(), 'yyyy-MM-dd'), 
          teamId: '', 
          memberIds: [], 
          shadowIds: [], 
          notes: '' 
        });
      }
      return;
    }

    // For new assignments, require at least one member
    // Note: Shadows are optional and only shown after selecting primary members
    if (!currentAssignment && formData.memberIds.length === 0) {
      alert('Please select at least one team member for this assignment');
      return;
    }

    // Pass the correct assignment ID if updating, or undefined if creating
    const assignmentToSave = {
      ...formData,
      ...(currentAssignment ? { id: currentAssignment.id } : {})
    };

    onSave(assignmentToSave as any);
    onClose();
    // Reset form
    setFormData({ 
      date: format(new Date(), 'yyyy-MM-dd'), 
      teamId: '', 
      memberIds: [], 
      shadowIds: [], 
      notes: '' 
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'teamId') {
      // When team changes, check if there's an existing assignment for this team + date
      // If switching back to the original team, use the original assignment data
      let existingAssignmentForNewTeam = allAssignments.find(
        a => a.teamId === value && a.date === formData.date
      );
      
      // If we found the current assignment (switching back to original team), use it
      // Otherwise, if we found a different assignment, use that
      let newMemberIds: string[] = [];
      let newShadowIds: string[] = [];
      let newNotes = formData.notes;
      
      if (existingAssignmentForNewTeam) {
        newMemberIds = existingAssignmentForNewTeam.memberIds || [];
        newShadowIds = existingAssignmentForNewTeam.shadowIds || [];
        // Only update notes if it's a different assignment
        if (existingAssignmentForNewTeam.id !== assignment?.id) {
          newNotes = existingAssignmentForNewTeam.notes || formData.notes;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        teamId: value,
        memberIds: newMemberIds,
        shadowIds: newShadowIds,
        notes: newNotes,
      }));
      
      // Mark as editing only after team change to prevent duplicate detection from interfering
      isUserEditingRef.current = true;
    } else {
      isUserEditingRef.current = true; // Mark that user is actively editing
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const toggleMember = (memberId: string) => {
    isUserEditingRef.current = true; // Mark that user is actively editing
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }));
  };

  const toggleShadow = (shadowId: string) => {
    isUserEditingRef.current = true; // Mark that user is actively editing
    setFormData(prev => ({
      ...prev,
      shadowIds: prev.shadowIds.includes(shadowId)
        ? prev.shadowIds.filter(id => id !== shadowId)
        : [...prev.shadowIds, shadowId]
    }));
  };

  // Get active shadows for the selected date
  const activeShadows = shadows.filter(shadow => {
    const shadowStart = new Date(shadow.startDate);
    const shadowEnd = shadow.endDate ? new Date(shadow.endDate) : null;
    const assignmentDate = new Date(formData.date);
    
    return assignmentDate >= shadowStart && (!shadowEnd || assignmentDate <= shadowEnd);
  });

  // Only show shadows where the primary member is selected
  const relevantShadows = activeShadows.filter(shadow => 
    formData.memberIds.includes(shadow.userId)
  );

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
            <label htmlFor="date" className="label">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="teamId" className="label">
              Team *
            </label>
            <select
              id="teamId"
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {formData.teamId && (
            <div>
              <label className="label">
                Assign Members *
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Select at least one team member for this assignment
              </p>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <Avatar 
                        src={member.avatarUrl} 
                        alt={member.name}
                        size="md"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {member.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No members in this team
                  </p>
                )}
              </div>
              {!assignment?.id && formData.memberIds.length === 0 && availableMembers.length > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠ At least one member must be selected
                </p>
              )}
              {assignment?.id && formData.memberIds.length === 0 && availableMembers.length > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ℹ Saving with no members will delete this assignment
                </p>
              )}
            </div>
          )}

          {formData.memberIds.length > 0 && relevantShadows.length > 0 && (
            <div>
              <label className="label flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Add Shadows (Optional)</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Select shadow assignments active for this date
              </p>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {relevantShadows.map(shadow => {
                  const primaryMember = members.find(m => m.id === shadow.userId);
                  const shadowMember = members.find(m => m.id === shadow.shadowUserId);
                  
                  if (!primaryMember || !shadowMember) return null;
                  
                  return (
                    <label
                      key={shadow.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.shadowIds.includes(shadow.id)}
                        onChange={() => toggleShadow(shadow.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="relative">
                          <Avatar 
                            src={primaryMember.avatarUrl} 
                            alt={primaryMember.name}
                            size="md"
                          />
                          <div className="absolute -bottom-1 -right-1">
                            <Avatar 
                              src={shadowMember.avatarUrl} 
                              alt={shadowMember.name}
                              size="xs"
                              className="border border-white dark:border-gray-800"
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {shadowMember.name} shadowing {primaryMember.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Add any notes about this assignment..."
            />
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
              {assignment ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
