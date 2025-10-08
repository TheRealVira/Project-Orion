'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info, Clock, User, Users as UsersIcon, MessageSquare, Send } from 'lucide-react';
import type { Incident, Team, Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { canManageIncidents } from '@/lib/permissions';
import Avatar from '@/components/Avatar';

interface IncidentView extends Incident {
  team: Team | null;
  assignedTo: Member | null;
}

interface IncidentNote {
  id: string;
  incidentId: string;
  content: string;
  createdAt: string;
  member: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface IncidentDetailProps {
  incidentId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const severityConfig = {
  critical: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', icon: AlertCircle },
  high: { color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', icon: AlertTriangle },
  medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800', icon: Info },
  low: { color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', icon: Info },
};

const statusConfig = {
  new: { label: 'New', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  closed: { label: 'Closed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export default function IncidentDetail({ incidentId, onClose, onUpdate }: IncidentDetailProps) {
  const { user: currentUser } = useAuth();
  const [incident, setIncident] = useState<IncidentView | null>(null);
  const [notes, setNotes] = useState<IncidentNote[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  
  const canManage = canManageIncidents(currentUser);

  useEffect(() => {
    fetchData();
  }, [incidentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incidentRes, notesRes, membersRes] = await Promise.all([
        fetch(`/api/incidents/${incidentId}`),
        fetch(`/api/incidents/${incidentId}/notes`),
        fetch('/api/users'),
      ]);

      const [incidentData, notesData, membersData] = await Promise.all([
        incidentRes.json(),
        notesRes.json(),
        membersRes.json(),
      ]);

      setIncident(incidentData);
      setNotes(notesData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching incident details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating incident status:', error);
    }
  };

  const handleAssign = async (memberId: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: memberId }),
      });

      if (response.ok) {
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error assigning incident:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !currentUser) return;

    try {
      setSubmittingNote(true);
      const response = await fetch(`/api/incidents/${incidentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: noteContent.trim(),
        }),
      });

      if (response.ok) {
        setNoteContent('');
        fetchData();
      } else {
        const errorData = await response.json();
        console.error('Error adding note:', errorData);
        alert(`Failed to add note: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  const SeverityIcon = severityConfig[incident.severity].icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg border-2 ${severityConfig[incident.severity].color}`}>
              <SeverityIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{incident.title}</h2>
                <span className={`text-xs px-2 py-1 rounded ${statusConfig[incident.status].color}`}>
                  {statusConfig[incident.status].label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                <span className="font-medium">{incident.severity.toUpperCase()}</span>
                <span>•</span>
                <span>{incident.source}</span>
                {incident.sourceId && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-xs">{incident.sourceId}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        {incident.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{incident.description}</p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Team */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Team</label>
            {incident.team ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: incident.team.color }}
                />
                <span className="text-gray-900 dark:text-white">{incident.team.name}</span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Not assigned</span>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Assigned To</label>
            {incident.assignedTo ? (
              <span className="text-gray-900 dark:text-white">{incident.assignedTo.name}</span>
            ) : canManage ? (
              <select
                onChange={(e) => handleAssign(e.target.value)}
                className="input text-sm"
                defaultValue=""
              >
                <option value="" disabled>Assign to...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Not assigned</span>
            )}
          </div>

          {/* Created */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Created</label>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="w-4 h-4" />
              <span>{new Date(incident.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Acknowledged */}
          {incident.acknowledgedAt && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Acknowledged</label>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock className="w-4 h-4" />
                <span>{new Date(incident.acknowledgedAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Closed */}
          {incident.closedAt && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Closed</label>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock className="w-4 h-4" />
                <span>{new Date(incident.closedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {incident.tags && incident.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {incident.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            {incident.status === 'new' && (
              <button
                type="button"
                onClick={() => handleStatusChange('in_progress')}
                className="btn-primary"
              >
                Start Working
              </button>
            )}
            {incident.status === 'in_progress' && (
              <button
                type="button"
                onClick={() => handleStatusChange('closed')}
                className="btn-primary"
              >
                Close Incident
              </button>
            )}
            {incident.status === 'closed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('new')}
                className="btn-secondary"
              >
                Reopen Incident
              </button>
            )}
          </div>
        )}

        {/* Notes Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notes & Timeline
          </h3>

          {/* Add Note Form */}
          {canManage && (
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="input flex-1"
                  disabled={submittingNote}
              />
              <button
                type="submit"
                disabled={submittingNote || !noteContent.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No notes yet. Add the first note to start the timeline.
              </p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    {note.member ? (
                      <Avatar
                        src={note.member.avatarUrl}
                        alt={note.member.name}
                        size="lg"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">S</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {note.member ? note.member.name : 'System'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
