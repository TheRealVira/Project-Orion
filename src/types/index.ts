/**
 * Represents a user account (formerly team member) who can be assigned to on-call duties
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'admin' | 'user' | 'viewer';
  authProvider?: 'local' | 'oauth' | 'ldap';
  authProviderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a team that groups members together
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for UI distinction
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a shadowing relationship where one member shadows another
 */
export interface Shadow {
  id: string;
  userId: string; // The primary user (previously memberId)
  shadowUserId: string; // The user who is shadowing (previously shadowMemberId)
  startDate: Date;
  endDate?: Date; // Optional end date for temporary shadowing
}

/**
 * Represents a team assignment for a specific date
 */
export interface DateAssignment {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  teamId: string;
  memberIds: string[]; // Members from the team assigned for this date
  shadowIds: string[]; // Shadow relationships active for this assignment
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * View model combining assignment with team and member details
 */
export interface DateAssignmentView extends DateAssignment {
  team: Team;
  members: Member[];
  shadows: Array<{
    primary: Member;
    shadow: Member;
  }>;
}

/**
 * Alert/Incident status
 */
export type IncidentStatus = 'new' | 'in_progress' | 'closed';

/**
 * Alert/Incident severity
 */
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Represents an incoming alert/incident
 */
export interface Incident {
  id: string;
  fingerprint: string; // For deduplication (hash of key fields)
  source: string; // grafana, prometheus, dynatrace, etc.
  sourceId?: string; // External alert ID from the source system
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  teamId: string;
  assignedToId?: string; // Current responder member ID
  tags: string[];
  metadata: Record<string, any>; // Original alert payload
  createdAt: Date;
  acknowledgedAt?: Date;
  inProgressAt?: Date;
  closedAt?: Date;
  updatedAt: Date;
}

/**
 * View model combining incident with team and member details
 */
export interface IncidentView extends Incident {
  team: Team;
  assignedTo?: Member;
}

/**
 * Represents a note/comment on an incident
 */
export interface IncidentNote {
  id: string;
  incidentId: string;
  memberId: string | null;
  content: string;
  createdAt: Date;
}

/**
 * View model combining note with member details
 * member is null for system-generated notes
 */
export interface IncidentNoteView extends IncidentNote {
  member: Member | null;
}

/**
 * Notification sent for an incident
 */
export interface IncidentNotification {
  id: string;
  incidentId: string;
  memberId: string;
  channel: 'email' | 'sms' | 'slack' | 'push';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

/**
 * Escalation policy for a team
 */
export interface EscalationPolicy {
  id: string;
  teamId: string;
  name: string;
  enabled: boolean;
  layers: EscalationLayer[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Single layer in an escalation policy
 */
export interface EscalationLayer {
  level: number; // 1, 2, 3, etc.
  memberIds: string[];
  waitMinutes: number; // How long to wait before escalating to next layer
  notificationChannels: string[]; // email, sms, etc.
}
