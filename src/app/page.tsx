'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Calendar, Users, UserPlus, Eye, BarChart3, Sparkles, Bell } from 'lucide-react';
import { DateAssignmentView, Member, Team, DateAssignment, Shadow } from '@/types';
import { 
  memberService, 
  teamService, 
  assignmentService, 
  shadowService 
} from '@/lib/services';
import CalendarView from '@/components/CalendarView';
import UserList from '@/components/UserList';
import TeamList from '@/components/TeamList';
import ShadowList from '@/components/ShadowList';
import AnalyticsView from '@/components/AnalyticsView';
import IncidentList from '@/components/IncidentList';
import UserProfile from '@/components/UserProfile';
import MemberFormModal from '@/components/MemberFormModal';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'members' | 'teams' | 'shadows' | 'analytics' | 'incidents'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shadows, setShadows] = useState<Shadow[]>([]);
  const [assignments, setAssignments] = useState<DateAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<DateAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]); // User[] from @/lib/auth
  const [loading, setLoading] = useState(true);

  const refresh = () => setRefreshKey(prev => prev + 1);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [membersData, teamsData, shadowsData] = await Promise.all([
          memberService.getAllMembers(),
          teamService.getAllTeams(),
          shadowService.getAllShadows(),
        ]);
        
        setMembers(membersData);
        setTeams(teamsData);
        setShadows(shadowsData);
        
        // Fetch users for team ownership (same endpoint as members now)
        try {
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            // API returns array directly, not wrapped in object
            setUsers(Array.isArray(usersData) ? usersData : []);
          }
        } catch (error) {
          console.error('Error loading users:', error);
        }

        // Load assignments for the current week
        const weekStart = startOfWeek(selectedDate);
        const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
        const assignmentsPromises = weekDates.map(date => assignmentService.getAssignmentsByDate(date));
        const assignmentsArrays = await Promise.all(assignmentsPromises);
        const weekAssignments = assignmentsArrays.flat();
        setAssignments(weekAssignments);
        
        // Load all assignments for analytics (this is a simple approach; for production, 
        // you might want to load on-demand or implement server-side filtering)
        const allAssignmentsData = await assignmentService.getAllAssignments();
        setAllAssignments(allAssignmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey, selectedDate]);

  const assignmentViews: DateAssignmentView[] = assignments.map(a => 
    assignmentService.getAssignmentView(a, members, teams, shadows)
  );

  const allAssignmentViews: DateAssignmentView[] = allAssignments.map(a => 
    assignmentService.getAssignmentView(a, members, teams, shadows)
  );

  // Member handlers
  const handleCreateMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await memberService.createMember(memberData);
      refresh();
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member');
    }
  };

  const handleUpdateMember = async (id: string, memberData: Partial<Member>) => {
    try {
      await memberService.updateMember(id, memberData);
      refresh();
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await memberService.deleteMember(id);
      refresh();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    }
  };

  // Profile edit handler
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (currentUser) {
      await handleUpdateMember(currentUser.id, memberData);
      setIsEditingProfile(false);
    }
  };

  const handleCloseProfileModal = () => {
    setIsEditingProfile(false);
  };

  // Team handlers
  const handleCreateTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, ownerIds?: string[]) => {
    try {
      // Automatically add the current user as a member and owner
      const memberIds = teamData.memberIds || [];
      if (currentUser && !memberIds.includes(currentUser.id)) {
        memberIds.push(currentUser.id);
      }
      
      // Automatically add creator as owner, plus any additional owners selected
      const allOwnerIds = new Set(ownerIds || []);
      if (currentUser) {
        allOwnerIds.add(currentUser.id);
      }
      
      const updatedTeamData = {
        ...teamData,
        memberIds,
        ownerIds: Array.from(allOwnerIds)
      };
      
      await teamService.createTeam(updatedTeamData);
      refresh();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const handleUpdateTeam = async (id: string, teamData: Partial<Team>, ownerIds?: string[]) => {
    try {
      // Include ownerIds in the team data to be sent to the API
      const updateData = {
        ...teamData,
        ...(ownerIds !== undefined && { ownerIds })
      };
      await teamService.updateTeam(id, updateData);
      refresh();
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await teamService.deleteTeam(id);
      refresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  // Assignment handlers
  const handleCreateAssignment = async (assignmentData: Omit<DateAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await assignmentService.createAssignment(assignmentData);
      refresh();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const handleUpdateAssignment = async (id: string, assignmentData: Partial<DateAssignment>) => {
    try {
      await assignmentService.updateAssignment(id, assignmentData);
      refresh();
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      refresh();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  // Shadow handlers
  const handleCreateShadow = async (shadowData: Omit<Shadow, 'id'>) => {
    try {
      // Check if this shadow assignment already exists
      const isDuplicate = shadows.some(existingShadow => 
        existingShadow.userId === shadowData.userId && 
        existingShadow.shadowUserId === shadowData.shadowUserId
      );

      if (isDuplicate) {
        alert('This shadow assignment already exists');
        return;
      }

      await shadowService.createShadow(shadowData);
      refresh();
    } catch (error) {
      console.error('Error creating shadow:', error);
      alert('Failed to create shadow assignment');
    }
  };

  const handleCreateShadowsBulk = async (shadowsToCreate: Omit<Shadow, 'id'>[]) => {
    try {
      // Filter out duplicates by checking existing shadows
      const uniqueShadows = shadowsToCreate.filter(newShadow => {
        // Check if this exact combination already exists
        const isDuplicate = shadows.some(existingShadow => 
          existingShadow.userId === newShadow.userId && 
          existingShadow.shadowUserId === newShadow.shadowUserId
        );
        return !isDuplicate;
      });

      if (uniqueShadows.length === 0) {
        alert('All selected shadow assignments already exist');
        return;
      }

      if (uniqueShadows.length < shadowsToCreate.length) {
        const skipped = shadowsToCreate.length - uniqueShadows.length;
        console.log(`Skipping ${skipped} duplicate shadow assignment(s)`);
      }

      await Promise.all(uniqueShadows.map(shadowData => shadowService.createShadow(shadowData)));
      
      if (uniqueShadows.length < shadowsToCreate.length) {
        const skipped = shadowsToCreate.length - uniqueShadows.length;
        alert(`Created ${uniqueShadows.length} shadow assignment(s). Skipped ${skipped} duplicate(s).`);
      }
      
      refresh();
    } catch (error) {
      console.error('Error creating shadow assignments:', error);
      alert('Failed to create shadow assignments');
    }
  };

  const handleUpdateShadow = async (id: string, shadowData: Partial<Shadow>) => {
    try {
      await shadowService.updateShadow(id, shadowData);
      refresh();
    } catch (error) {
      console.error('Error updating shadow:', error);
      alert('Failed to update shadow assignment');
    }
  };

  const handleDeleteShadow = async (id: string) => {
    try {
      await shadowService.deleteShadow(id);
      refresh();
    } catch (error) {
      console.error('Error deleting shadow:', error);
      alert('Failed to delete shadow assignment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading Project Orion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Project Orion
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <UserProfile onEditProfile={handleEditProfile} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-4 sm:mt-6 sticky top-[68px] sm:top-[92px] z-30 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-2">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'calendar' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'members' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'teams' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Teams</span>
            </button>
            <button
              onClick={() => setActiveTab('shadows')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'shadows' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Shadowing</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'analytics' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                ${activeTab === 'incidents' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Incidents</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-8">
        {activeTab === 'calendar' && (
          <CalendarView 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            assignments={assignmentViews}
            teams={teams}
            members={members}
            shadows={shadows}
            onCreateAssignment={handleCreateAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}
        {activeTab === 'members' && (
          <UserList 
            members={members}
            onCreateMember={handleCreateMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        )}
        {activeTab === 'teams' && (
          <TeamList 
            teams={teams} 
            members={members}
            users={users}
            onCreateTeam={handleCreateTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}
        {activeTab === 'shadows' && (
          <ShadowList 
            shadows={shadows}
            members={members}
            onCreateShadow={handleCreateShadow}
            onCreateShadowsBulk={handleCreateShadowsBulk}
            onUpdateShadow={handleUpdateShadow}
            onDeleteShadow={handleDeleteShadow}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView 
            members={members}
            teams={teams}
            assignments={allAssignmentViews}
          />
        )}
        {activeTab === 'incidents' && (
          <IncidentList />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Project Orion - On-Call Companion Dashboard</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
              <a 
                href="https://github.com/TheRealVira/Project-Orion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>View Source</span>
              </a>
              
              <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
              
              <span>
                Built with ❤️ by{' '}
                <a 
                  href="https://vira.solutions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Ing. Johanna Rührig
                </a>
              </span>
              
              <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
              
              <a 
                href="https://ko-fi.com/vira" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#13C3FF" d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
                </svg>
                <span>Support</span>
              </a>
              
              <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
              
              <a 
                href="https://github.com/TheRealVira/Project-Orion/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                MIT Licensed
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Edit Modal */}
      {currentUser && (
        <MemberFormModal
          isOpen={isEditingProfile}
          onClose={handleCloseProfileModal}
          onSave={handleUpdateProfile}
          member={members.find(m => m.id === currentUser.id)}
          title="Edit Profile"
        />
      )}
    </div>
  );
}
