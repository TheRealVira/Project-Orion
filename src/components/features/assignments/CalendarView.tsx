import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { DateAssignmentView, DateAssignment, Team, Member, Shadow } from '@/types';
import AssignmentFormModal from './AssignmentFormModal';
import { Avatar } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateAssignment, canEditAssignment, canDeleteAssignment } from '@/lib/utils/permissions';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  assignments: DateAssignmentView[];
  teams: Team[];
  members: Member[];
  shadows: Shadow[];
  onCreateAssignment: (assignment: Omit<DateAssignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAssignment: (id: string, assignment: Partial<DateAssignment>) => void;
  onDeleteAssignment: (id: string) => void;
}

export default function CalendarView({ 
  selectedDate, 
  onDateChange, 
  assignments: allAssignments,
  teams,
  members,
  shadows,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment
}: CalendarViewProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DateAssignment | undefined>();
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(format(startOfWeek(selectedDate), 'yyyy-MM-dd'));
  const [exportEndDate, setExportEndDate] = useState(format(addDays(startOfWeek(selectedDate), 6), 'yyyy-MM-dd'));
  const [teamOwnerships, setTeamOwnerships] = useState<Record<string, string[]>>({});

  // Fetch team ownerships
  useEffect(() => {
    const fetchTeamOwnerships = async () => {
      try {
        const response = await fetch('/api/team-owners');
        if (response.ok) {
          const data = await response.json();
          setTeamOwnerships(data);
        }
      } catch (error) {
        console.error('Failed to fetch team ownerships:', error);
      }
    };
    
    fetchTeamOwnerships();
  }, []);

  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => onDateChange(addDays(selectedDate, -7));
  const goToNextWeek = () => onDateChange(addDays(selectedDate, 7));
  const goToToday = () => onDateChange(new Date());

  const handleCreateForDate = (date: Date) => {
    setModalDefaultDate(format(date, 'yyyy-MM-dd'));
    setEditingAssignment(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (assignment: DateAssignmentView) => {
    setEditingAssignment(assignment);
    setModalDefaultDate(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, skipConfirmation = false) => {
    if (skipConfirmation || confirm('Are you sure you want to delete this assignment?')) {
      onDeleteAssignment(id);
    }
  };

  const handleSave = (assignmentData: any) => {
    // If assignmentData includes an ID, we're updating that specific assignment
    // This handles the case where user switches teams in the modal
    if (assignmentData.id) {
      const { id, ...dataWithoutId } = assignmentData;
      onUpdateAssignment(id, dataWithoutId);
    } else {
      onCreateAssignment(assignmentData);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(undefined);
    setModalDefaultDate(undefined);
  };

  const handleLoadExisting = (existingAssignment: DateAssignment) => {
    // Convert DateAssignment to DateAssignmentView format for editing
    const assignmentView = allAssignments.find(a => a.id === existingAssignment.id);
    if (assignmentView) {
      setEditingAssignment(assignmentView);
    }
  };

  // Helper function to escape CSV fields
  const escapeCSV = (field: string): string => {
    // Always wrap in quotes for maximum compatibility, escape internal quotes
    return `"${field.replace(/"/g, '""')}"`;
  };

  // Export calendar to CSV with date range
  const exportToCSV = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRangeStr = `${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`;
    
    // Calculate all days in range
    const daysInRange: Date[] = [];
    let currentDay = start;
    while (currentDay <= end) {
      daysInRange.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }
    
    // Create CSV header
    const headers = ['Date', 'Day', 'Team', 'Members', 'Shadows'];
    
    // Create CSV rows for each day
    const rows: string[][] = [];
    daysInRange.forEach(day => {
      const dayAssignments = allAssignments.filter(a => isSameDay(new Date(a.date), day));
      
      if (dayAssignments.length === 0) {
        rows.push([format(day, 'yyyy-MM-dd'), format(day, 'EEEE'), '-', '-', '-']);
      } else {
        dayAssignments.forEach((assignment, index) => {
          const memberNames = assignment.members.map(m => m.name).join('; ');
          const shadowPairs = assignment.shadows.map(s => `${s.primary.name} → ${s.shadow.name}`).join('; ');
          
          rows.push([
            index === 0 ? format(day, 'yyyy-MM-dd') : '',
            index === 0 ? format(day, 'EEEE') : '',
            assignment.team?.name || 'No Team',
            memberNames,
            shadowPairs || '-'
          ]);
        });
      }
    });
    
    // Combine header and rows with proper CSV escaping
    const csvLines: string[] = [
      `Project Orion Calendar Export - ${dateRangeStr}`,
      '',
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];
    const csvContent = csvLines.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orion-calendar-${format(start, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClick = () => {
    setExportStartDate(format(weekStart, 'yyyy-MM-dd'));
    setExportEndDate(format(addDays(weekStart, 6), 'yyyy-MM-dd'));
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    exportToCSV(exportStartDate, exportEndDate);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <AssignmentFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={handleDelete}
        assignment={editingAssignment}
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        teams={teams}
        members={members}
        shadows={shadows}
        defaultDate={modalDefaultDate}
        allAssignments={allAssignments}
        onLoadExisting={handleLoadExisting}
      />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage on-call assignments for the week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleExportClick} 
            className="btn-secondary flex items-center gap-2"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button type="button" onClick={goToToday} className="btn-secondary">
            Today
          </button>
          <button type="button" onClick={goToPreviousWeek} className="btn-secondary p-2" title="Previous Week">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={goToNextWeek} className="btn-secondary p-2" title="Next Week">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg w-full max-w-md p-6 border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Export Calendar
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Export will include all assignments from {format(new Date(exportStartDate), 'MMM d, yyyy')} to {format(new Date(exportEndDate), 'MMM d, yyyy')}.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportConfirm}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Week Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        {days.map(day => {
          const dateString = format(day, 'yyyy-MM-dd');
          const dayAssignments = allAssignments.filter(a => a.date === dateString);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={dateString}
              onClick={() => onDateChange(day)}
              className={`
                card cursor-pointer transition-all hover:shadow-lg min-h-[180px] sm:min-h-[200px]
                ${isSelected ? 'ring-2 ring-primary-500' : ''}
                ${isToday ? 'border-primary-400 dark:border-primary-600' : ''}
              `}
            >
              <div className="space-y-2 sm:space-y-3">
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${isToday ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  {isToday && (
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Assignments */}
                {dayAssignments.length > 0 ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    {dayAssignments.map(assignment => (
                      <div
                        key={assignment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canEditAssignment(currentUser, assignment.teamId, teamOwnerships)) {
                            handleEdit(assignment);
                          }
                        }}
                        className={`p-2 sm:p-2.5 rounded-lg text-sm group relative min-h-[44px] ${
                          canEditAssignment(currentUser, assignment.teamId, teamOwnerships) 
                            ? 'cursor-pointer hover:opacity-90 transition-opacity' 
                            : 'cursor-default'
                        }`}
                        style={{ 
                          backgroundColor: assignment.team ? `${assignment.team.color}20` : '#e5e7eb20',
                          borderLeft: assignment.team ? `3px solid ${assignment.team.color}` : '3px solid #9ca3af'
                        }}
                      >
                        <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate pr-16 sm:pr-0">
                          {assignment.team ? assignment.team.name : 'No Team'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1 mt-1">
                          {assignment.members.map(member => (
                            <div key={member.id} className="flex items-center space-x-1.5 sm:space-x-2">
                              <Avatar 
                                src={member.avatarUrl} 
                                alt={member.name}
                                size="sm"
                              />
                              <span className="truncate text-xs">{member.name}</span>
                            </div>
                          ))}
                          {assignment.shadows.map(shadow => (
                            <div key={shadow.shadow.id} className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500">
                              <Avatar 
                                src={shadow.shadow.avatarUrl} 
                                alt={shadow.shadow.name}
                                size="sm"
                                className="opacity-70"
                              />
                              <span className="truncate text-xs">🔍 {shadow.shadow.name}</span>
                            </div>
                          ))}
                        </div>
                        {(canEditAssignment(currentUser, assignment.teamId, teamOwnerships) || canDeleteAssignment(currentUser, assignment.teamId, teamOwnerships)) && (
                          <div className="absolute top-1 right-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex space-x-1">
                            {canEditAssignment(currentUser, assignment.teamId, teamOwnerships) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(assignment);
                                }}
                                className="p-1.5 sm:p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm sm:shadow-none"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              </button>
                            )}
                            {canDeleteAssignment(currentUser, assignment.teamId, teamOwnerships) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(assignment.id);
                                }}
                                className="p-1.5 sm:p-1 bg-white dark:bg-gray-700 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 shadow-sm sm:shadow-none"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                    No assignments
                  </div>
                )}
                
                {/* Add Assignment Button */}
                {canCreateAssignment(currentUser) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateForDate(day);
                    }}
                    className="w-full mt-2 py-1 px-2 text-xs flex items-center justify-center space-x-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Assignment</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {allAssignments.filter(a => a.date === format(selectedDate, 'yyyy-MM-dd')).length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Details for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-4">
            {allAssignments.filter(a => a.date === format(selectedDate, 'yyyy-MM-dd')).map(assignment => (
              <div key={assignment.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: assignment.team?.color || '#9ca3af' }}
                  />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {assignment.team?.name || 'No Team'}
                  </h4>
                </div>
                {assignment.team?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {assignment.team.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">On-Call:</span>
                    <div className="mt-1 space-y-1">
                      {assignment.members.map(member => (
                        <div key={member.id} className="text-sm text-gray-900 dark:text-white">
                          • {member.name} ({member.email})
                        </div>
                      ))}
                    </div>
                  </div>
                  {assignment.shadows.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shadowing:</span>
                      <div className="mt-1 space-y-1">
                        {assignment.shadows.map(shadow => (
                          <div key={shadow.shadow.id} className="text-sm text-gray-600 dark:text-gray-400">
                            • {shadow.shadow.name} is shadowing {shadow.primary.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {assignment.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {assignment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
