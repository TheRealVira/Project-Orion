import { Incident, IncidentView, IncidentNote, IncidentNoteView, IncidentNotification, EscalationPolicy, Member, Team } from '@/types';
import crypto from 'crypto';

// Generate fingerprint for deduplication
export function generateFingerprint(source: string, title: string, metadata: Record<string, any>): string {
  const key = `${source}:${title}:${JSON.stringify(metadata)}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

// Incident CRUD operations
export const incidentService = {
  // Create a new incident
  async createIncident(data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Promise<Incident> {
    const response = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create incident');
    return response.json();
  },

  // Get all incidents
  async getAllIncidents(): Promise<Incident[]> {
    const response = await fetch('/api/incidents');
    if (!response.ok) throw new Error('Failed to fetch incidents');
    return response.json();
  },

  // Get incident by ID
  async getIncidentById(id: string): Promise<Incident> {
    const response = await fetch(`/api/incidents/${id}`);
    if (!response.ok) throw new Error('Failed to fetch incident');
    return response.json();
  },

  // Update incident
  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const response = await fetch(`/api/incidents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update incident');
    return response.json();
  },

  // Delete incident
  async deleteIncident(id: string): Promise<void> {
    const response = await fetch(`/api/incidents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete incident');
  },

  // Change incident status
  async changeStatus(id: string, status: 'new' | 'in_progress' | 'closed'): Promise<Incident> {
    const updates: Partial<Incident> = { status };
    
    if (status === 'in_progress') {
      updates.inProgressAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
    }
    
    return this.updateIncident(id, updates);
  },

  // Assign incident to member
  async assignIncident(id: string, memberId: string): Promise<Incident> {
    return this.updateIncident(id, { 
      assignedToId: memberId,
      acknowledgedAt: new Date()
    });
  },

  // Create incident view with related data
  getIncidentView(incident: Incident, members: Member[], teams: Team[]): IncidentView {
    const team = teams.find(t => t.id === incident.teamId);
    const assignedTo = incident.assignedToId 
      ? members.find(m => m.id === incident.assignedToId)
      : undefined;

    return {
      ...incident,
      team: team || { id: incident.teamId, name: 'Unknown Team', color: '#gray', memberIds: [], createdAt: new Date(), updatedAt: new Date() },
      assignedTo,
    };
  },
};

// Incident Notes operations
export const incidentNoteService = {
  // Get notes for an incident
  async getNotesByIncidentId(incidentId: string): Promise<IncidentNote[]> {
    const response = await fetch(`/api/incidents/${incidentId}/notes`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  },

  // Create a note
  async createNote(data: Omit<IncidentNote, 'id' | 'createdAt'>): Promise<IncidentNote> {
    const response = await fetch(`/api/incidents/${data.incidentId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create note');
    return response.json();
  },

  // Delete a note
  async deleteNote(incidentId: string, noteId: string): Promise<void> {
    const response = await fetch(`/api/incidents/${incidentId}/notes/${noteId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete note');
  },

  // Create note view with member details
  getNoteView(note: IncidentNote, members: Member[]): IncidentNoteView {
    const member = note.memberId ? members.find(m => m.id === note.memberId) : null;
    return {
      ...note,
      member: member || null,
    };
  },
};

// Escalation Policy operations
export const escalationPolicyService = {
  // Get escalation policy for a team
  async getByTeamId(teamId: string): Promise<EscalationPolicy | null> {
    const response = await fetch(`/api/escalation-policies/team/${teamId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch escalation policy');
    return response.json();
  },

  // Create or update escalation policy
  async upsertPolicy(data: Omit<EscalationPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<EscalationPolicy> {
    const response = await fetch('/api/escalation-policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save escalation policy');
    return response.json();
  },

  // Delete escalation policy
  async deletePolicy(id: string): Promise<void> {
    const response = await fetch(`/api/escalation-policies/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete escalation policy');
  },
};
