import { Member, Team, DateAssignment, Shadow, DateAssignmentView } from '@/types';

/**
 * Service for managing users (formerly members) with API backend
 */
export class MemberService {
  async getAllMembers(): Promise<Member[]> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async getMemberById(id: string): Promise<Member | undefined> {
    const members = await this.getAllMembers();
    return members.find(m => m.id === id);
  }

  async createMember(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  }

  async updateMember(id: string, data: Partial<Member>): Promise<Member | undefined> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 404) return undefined;
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  }

  async deleteMember(id: string): Promise<boolean> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error('Failed to delete user');
    }
    return true;
  }
}

/**
 * Service for managing teams with API backend
 */
export class TeamService {
  async getAllTeams(): Promise<Team[]> {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const teams = await this.getAllTeams();
    return teams.find(t => t.id === id);
  }

  async createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined> {
    const response = await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error('Failed to update team');
    }
    return response.json();
  }

  async deleteTeam(id: string): Promise<boolean> {
    const response = await fetch(`/api/teams/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error('Failed to delete team');
    }
    return true;
  }
}

/**
 * Service for managing shadowing relationships with API backend
 */
export class ShadowService {
  async getAllShadows(): Promise<Shadow[]> {
    const response = await fetch('/api/shadows');
    if (!response.ok) throw new Error('Failed to fetch shadows');
    return response.json();
  }

  async getShadowById(id: string): Promise<Shadow | undefined> {
    const shadows = await this.getAllShadows();
    return shadows.find(s => s.id === id);
  }

  async getShadowsForMember(memberId: string): Promise<Shadow[]> {
    const shadows = await this.getAllShadows();
    return shadows.filter(s => s.userId === memberId || s.shadowUserId === memberId);
  }

  async createShadow(shadow: Omit<Shadow, 'id'>): Promise<Shadow> {
    const response = await fetch('/api/shadows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shadow),
    });
    if (!response.ok) throw new Error('Failed to create shadow');
    return response.json();
  }

  async updateShadow(id: string, shadow: Partial<Shadow>): Promise<Shadow> {
    const response = await fetch(`/api/shadows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shadow),
    });
    if (!response.ok) throw new Error('Failed to update shadow');
    return response.json();
  }

  async deleteShadow(id: string): Promise<void> {
    const response = await fetch(`/api/shadows/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete shadow');
  }
}

/**
 * Service for managing date assignments with API backend
 */
export class AssignmentService {
  async getAllAssignments(): Promise<DateAssignment[]> {
    const response = await fetch('/api/assignments');
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  }

  async getAssignmentsByDate(date: string): Promise<DateAssignment[]> {
    const response = await fetch(`/api/assignments?date=${encodeURIComponent(date)}`);
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  }

  async getAssignmentById(id: string): Promise<DateAssignment | undefined> {
    const assignments = await this.getAllAssignments();
    return assignments.find(a => a.id === id);
  }

  async createAssignment(data: Omit<DateAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DateAssignment> {
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
  }

  async updateAssignment(id: string, data: Partial<DateAssignment>): Promise<DateAssignment | undefined> {
    const response = await fetch(`/api/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error('Failed to update assignment');
    }
    return response.json();
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const response = await fetch(`/api/assignments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error('Failed to delete assignment');
    }
    return true;
  }

  getAssignmentView(assignment: DateAssignment, members: Member[], teams: Team[], shadows: Shadow[]): DateAssignmentView {
    const team = teams.find(t => t.id === assignment.teamId)!;
    const assignedMembers = assignment.memberIds.map(id => members.find(m => m.id === id)!).filter(Boolean);
    const assignedShadows = assignment.shadowIds
      .map(shadowId => {
        const shadow = shadows.find(s => s.id === shadowId);
        if (!shadow) return null;
        const primary = members.find(m => m.id === shadow.userId);
        const shadowMember = members.find(m => m.id === shadow.shadowUserId);
        if (!primary || !shadowMember) return null;
        return { primary, shadow: shadowMember };
      })
      .filter((s): s is { primary: Member; shadow: Member } => s !== null);

    return {
      ...assignment,
      team,
      members: assignedMembers,
      shadows: assignedShadows,
    };
  }
}

// Export singleton instances
export const memberService = new MemberService();
export const teamService = new TeamService();
export const shadowService = new ShadowService();
export const assignmentService = new AssignmentService();

// Export incident services
export { incidentService, incidentNoteService, escalationPolicyService, generateFingerprint } from './incidentService';
