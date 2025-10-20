import { User } from '@/lib/auth';

/**
 * Permission utility functions for role-based access control
 * These functions are client-safe and don't access the database directly.
 * For server-side permission checks, use the team-ownership module.
 */

export type UserRole = 'admin' | 'user' | 'viewer';

/**
 * Check if a user owns a team (client-side check using team data)
 * For server-side checks, use isTeamOwner from team-ownership.ts
 */
function checkTeamOwnership(teamId: string, userId: string, teamOwnerships?: Record<string, string[]>): boolean {
  if (!teamOwnerships) return false;
  return teamOwnerships[teamId]?.includes(userId) || false;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user is a standard user
 */
export function isStandardUser(user: User | null): boolean {
  return user?.role === 'user';
}

/**
 * Check if user is a viewer
 */
export function isViewer(user: User | null): boolean {
  return user?.role === 'viewer';
}

/**
 * Check if user can edit another user
 * - Admins can edit anyone
 * - Users can edit themselves only
 * - Viewers cannot edit anyone
 */
export function canEditUser(currentUser: User | null, targetUserId: string): boolean {
  if (!currentUser) return false;
  
  // Admins can edit anyone
  if (isAdmin(currentUser)) return true;
  
  // Users can edit themselves
  if (isStandardUser(currentUser) && currentUser.id === targetUserId) return true;
  
  // Viewers cannot edit
  return false;
}

/**
 * Check if user can delete another user
 * - Admins can delete anyone
 * - Users can delete themselves only
 * - Viewers cannot delete anyone
 */
export function canDeleteUser(currentUser: User | null, targetUserId: string): boolean {
  if (!currentUser) return false;
  
  // Admins can delete anyone
  if (isAdmin(currentUser)) return true;
  
  // Users can delete themselves
  if (isStandardUser(currentUser) && currentUser.id === targetUserId) return true;
  
  // Viewers cannot delete
  return false;
}

/**
 * Check if user can change another user's role
 * - Only admins can change user roles
 */
export function canChangeUserRole(currentUser: User | null): boolean {
  return isAdmin(currentUser);
}

/**
 * Check if user can create a new user
 * - Only admins can create users
 */
export function canCreateUser(currentUser: User | null): boolean {
  return isAdmin(currentUser);
}

/**
 * Check if user can create teams
 * - Admins and standard users can create teams
 * - Viewers cannot create teams
 */
export function canCreateTeam(currentUser: User | null): boolean {
  if (!currentUser) return false;
  return isAdmin(currentUser) || isStandardUser(currentUser);
}

/**
 * Check if user can edit a team
 * - Admins can edit any team
 * - Users can edit teams they own
 * - Viewers cannot edit teams
 * 
 * @param currentUser - The current user
 * @param teamId - The team ID to check
 * @param teamOwnerships - Map of teamId to array of owner userIds
 */
export function canEditTeam(currentUser: User | null, teamId?: string, teamOwnerships?: Record<string, string[]>): boolean {
  if (!currentUser || !teamId) return false;
  
  // Admins can edit any team
  if (isAdmin(currentUser)) return true;
  
  // Users can edit teams they own
  if (isStandardUser(currentUser)) {
    return checkTeamOwnership(teamId, currentUser.id, teamOwnerships);
  }
  
  // Viewers cannot edit
  return false;
}

/**
 * Check if user can delete a team
 * - Admins can delete any team
 * - Users can delete teams they own
 * - Viewers cannot delete teams
 * 
 * @param currentUser - The current user
 * @param teamId - The team ID to check
 * @param teamOwnerships - Map of teamId to array of owner userIds
 */
export function canDeleteTeam(currentUser: User | null, teamId?: string, teamOwnerships?: Record<string, string[]>): boolean {
  if (!currentUser || !teamId) return false;
  
  // Admins can delete any team
  if (isAdmin(currentUser)) return true;
  
  // Users can delete teams they own
  if (isStandardUser(currentUser)) {
    return checkTeamOwnership(teamId, currentUser.id, teamOwnerships);
  }
  
  // Viewers cannot delete
  return false;
}

/**
 * Check if user can create assignments
 * - Admins and standard users can create assignments
 * - Viewers cannot create assignments
 */
export function canCreateAssignment(currentUser: User | null): boolean {
  if (!currentUser) return false;
  return isAdmin(currentUser) || isStandardUser(currentUser);
}

/**
 * Check if user can edit an assignment
 * - Admins can edit any assignment
 * - Standard users can edit any assignment
 * - Viewers cannot edit assignments
 * 
 * @param currentUser - The current user
 * @param teamId - The team ID associated with the assignment
 * @param teamOwnerships - Map of teamId to array of owner userIds
 */
export function canEditAssignment(currentUser: User | null, teamId?: string, teamOwnerships?: Record<string, string[]>): boolean {
  if (!currentUser) return false;
  
  // Admins can edit any assignment
  if (isAdmin(currentUser)) return true;
  
  // Standard users can edit any assignment
  if (isStandardUser(currentUser)) return true;
  
  // Viewers cannot edit
  return false;
}

/**
 * Check if user can delete an assignment
 * - Admins can delete any assignment
 * - Standard users can delete any assignment
 * - Viewers cannot delete assignments
 * 
 * @param currentUser - The current user
 * @param teamId - The team ID associated with the assignment
 * @param teamOwnerships - Map of teamId to array of owner userIds
 */
export function canDeleteAssignment(currentUser: User | null, teamId?: string, teamOwnerships?: Record<string, string[]>): boolean {
  if (!currentUser) return false;
  
  // Admins can delete any assignment
  if (isAdmin(currentUser)) return true;
  
  // Standard users can delete any assignment
  if (isStandardUser(currentUser)) return true;
  
  // Viewers cannot delete
  return false;
}

/**
 * Check if user can create shadows
 * - Admins and standard users can create shadows
 * - Viewers cannot create shadows
 */
export function canCreateShadow(currentUser: User | null): boolean {
  if (!currentUser) return false;
  return isAdmin(currentUser) || isStandardUser(currentUser);
}

/**
 * Check if user can edit a shadow
 * - Admins can edit any shadow
 * - Users can edit shadows where they are involved
 * - Viewers cannot edit shadows
 */
export function canEditShadow(currentUser: User | null, shadowUserId?: string, userId?: string): boolean {
  if (!currentUser) return false;
  
  // Admins can edit any shadow
  if (isAdmin(currentUser)) return true;
  
  // Users can edit shadows where they are involved
  if (isStandardUser(currentUser)) {
    return currentUser.id === shadowUserId || currentUser.id === userId;
  }
  
  // Viewers cannot edit
  return false;
}

/**
 * Check if user can delete a shadow
 * - Admins can delete any shadow
 * - Users can delete shadows where they are involved
 * - Viewers cannot delete shadows
 */
export function canDeleteShadow(currentUser: User | null, shadowUserId?: string, userId?: string): boolean {
  if (!currentUser) return false;
  
  // Admins can delete any shadow
  if (isAdmin(currentUser)) return true;
  
  // Users can delete shadows where they are involved
  if (isStandardUser(currentUser)) {
    return currentUser.id === shadowUserId || currentUser.id === userId;
  }
  
  // Viewers cannot delete
  return false;
}

/**
 * Check if user can manage incidents
 * - Admins and standard users can manage incidents
 * - Viewers can only view incidents
 */
export function canManageIncidents(currentUser: User | null): boolean {
  if (!currentUser) return false;
  return isAdmin(currentUser) || isStandardUser(currentUser);
}
