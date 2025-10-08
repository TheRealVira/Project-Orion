'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle, Filter, User, Users as UsersIcon, Calendar, Webhook } from 'lucide-react';
import type { Incident, Team, Member } from '@/types';
import IncidentDetail from './IncidentDetail';
import WebhookTesterModal from './WebhookTesterModal';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

interface IncidentView extends Incident {
    team: Team | null;
    assignedTo: Member | null;
}

const severityConfig = {
    critical: { color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: AlertCircle },
    high: { color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', icon: AlertTriangle },
    medium: { color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', icon: Info },
    low: { color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', icon: Info },
};

const statusConfig = {
    new: { label: 'New', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    closed: { label: 'Closed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export default function IncidentList() {
    const { user: currentUser } = useAuth();
    const [incidents, setIncidents] = useState<IncidentView[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [showWebhookTester, setShowWebhookTester] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<string>('');
    const [teamFilter, setTeamFilter] = useState<string>('');
    const [assignedToFilter, setAssignedToFilter] = useState<string>('');
    const [dateRangeFilter, setDateRangeFilter] = useState<string>('24h');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, [statusFilter, severityFilter, teamFilter, assignedToFilter, dateRangeFilter, customStartDate, customEndDate]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (severityFilter) params.append('severity', severityFilter);
            if (teamFilter) params.append('teamId', teamFilter);
            if (assignedToFilter) params.append('assignedToId', assignedToFilter);

            // Add date range filter
            if (dateRangeFilter === 'custom' && customStartDate && customEndDate) {
                params.append('startDate', customStartDate);
                params.append('endDate', customEndDate);
            } else if (dateRangeFilter && dateRangeFilter !== 'all') {
                // Calculate date range based on preset
                const now = new Date();
                let startDate: Date;

                switch (dateRangeFilter) {
                    case '24h':
                        startDate = subDays(now, 1);
                        break;
                    case '7d':
                        startDate = subDays(now, 7);
                        break;
                    case '30d':
                        startDate = subDays(now, 30);
                        break;
                    default:
                        startDate = subDays(now, 1); // Default to 24h
                }

                params.append('startDate', startDate.toISOString());
                params.append('endDate', now.toISOString());
            }

            const [incidentsRes, teamsRes, membersRes] = await Promise.all([
                fetch(`/api/incidents?${params.toString()}`),
                fetch('/api/teams'),
                fetch('/api/users'),
            ]);

            const [incidentsData, teamsData, membersData] = await Promise.all([
                incidentsRes.json(),
                teamsRes.json(),
                membersRes.json(),
            ]);

            setIncidents(incidentsData);
            setTeams(teamsData);
            setMembers(membersData);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (incidentId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error updating incident status:', error);
        }
    };

    const handleAssign = async (incidentId: string, memberId: string) => {
        try {
            const response = await fetch(`/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedToId: memberId }),
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error assigning incident:', error);
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setSeverityFilter('');
        setTeamFilter('');
        setAssignedToFilter('');
        setDateRangeFilter('24h');
        setCustomStartDate('');
        setCustomEndDate('');
    };

    const activeFilterCount = [
        statusFilter,
        severityFilter,
        teamFilter,
        assignedToFilter,
        dateRangeFilter !== '24h' ? dateRangeFilter : '' // Only count if not default
    ].filter(Boolean).length;

    const getDateRangeLabel = () => {
        if (dateRangeFilter === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            return `${format(start, 'MMM d, yyyy HH:mm')} - ${format(end, 'MMM d, yyyy HH:mm')}`;
        } else if (dateRangeFilter === 'all') {
            return 'All time';
        } else {
            const labels: Record<string, string> = {
                '24h': 'Last 24 hours',
                '7d': 'Last 7 days',
                '30d': 'Last 30 days',
            };
            return labels[dateRangeFilter] || 'Last 24 hours';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-white-600" />
                        <h1 className="text-xl sm:text-2xl font-bold">Incidents</h1>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Monitor and respond to alerts from monitoring systems
                    </p>
                </div>

                {/* Test Webhook Button - Admin Only */}
                {currentUser?.role === 'admin' && (
                    <button
                        type="button"
                        onClick={() => setShowWebhookTester(true)}
                        className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                    >
                        <Webhook className="w-4 h-4" />
                        Test Webhook
                    </button>
                )}
            </div>

            {/* Filter Button */}
            <div className="flex gap-2 flex-wrap items-center">
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-secondary whitespace-nowrap"
                >
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                                {activeFilterCount}
                            </span>
                        )}
                    </h3>
                </button>

                {activeFilterCount > 0 && (
                    <button type="button" onClick={clearFilters} className="btn-secondary whitespace-nowrap">
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="card space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</label>
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                            <select
                                value={assignedToFilter}
                                onChange={(e) => setAssignedToFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-4 h-4" />
                            Date Range
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <select
                                    value={dateRangeFilter}
                                    onChange={(e) => setDateRangeFilter(e.target.value)}
                                    className="input"
                                >
                                    <option value="24h">Last 24 Hours (Default)</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                    <option value="all">All Time</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {dateRangeFilter === 'custom' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                                        <input
                                            type="datetime-local"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Date Range Indicator & Count */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Showing incidents from <strong className="text-gray-900 dark:text-white">{getDateRangeLabel()}</strong></span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Incidents List */}
            <div className="space-y-3">
                {incidents.length === 0 ? (
                    <div className="card text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No incidents found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All clear! 🎉</p>
                    </div>
                ) : (
                    incidents.map((incident) => {
                        const SeverityIcon = severityConfig[incident.severity].icon;

                        // Adjust styling based on status
                        const getCardStyle = () => {
                            if (incident.status === 'closed') {
                                // Closed: Subtle, muted appearance
                                return 'opacity-60 border-l-4 border-gray-400 dark:border-gray-600';
                            } else if (incident.status === 'in_progress') {
                                // In Progress: Medium urgency, blue border
                                return 'border-l-4 border-blue-500 dark:border-blue-400';
                            } else {
                                // New: Full severity colors
                                return `border-l-4 ${severityConfig[incident.severity].color}`;
                            }
                        };

                        return (
                            <div
                                key={incident.id}
                                className={`card ${getCardStyle()} cursor-pointer hover:shadow-lg transition-all`}
                                onClick={() => setSelectedIncidentId(incident.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <SeverityIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${incident.status === 'closed'
                                                ? 'text-gray-400 dark:text-gray-600'
                                                : incident.status === 'in_progress'
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : '' // Use severity color from config
                                            }`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{incident.title}</h3>
                                                <span className={`text-xs px-2 py-1 rounded ${statusConfig[incident.status].color}`}>
                                                    {statusConfig[incident.status].label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {incident.source}
                                                </span>
                                            </div>

                                            {incident.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                    {incident.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                                {incident.team && (
                                                    <div className="flex items-center gap-1">
                                                        <UsersIcon className="w-3 h-3" />
                                                        <span>{incident.team.name}</span>
                                                    </div>
                                                )}

                                                {incident.assignedTo && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        <span>{incident.assignedTo.name}</span>
                                                    </div>
                                                )}

                                                <span>
                                                    {new Date(incident.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {incident.status === 'new' && (
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(incident.id, 'in_progress')}
                                                className="btn-primary text-xs px-3 py-1.5"
                                            >
                                                Start
                                            </button>
                                        )}

                                        {incident.status === 'in_progress' && (
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(incident.id, 'closed')}
                                                className="btn-primary text-xs px-3 py-1.5"
                                            >
                                                Close
                                            </button>
                                        )}

                                        {!incident.assignedTo && members.length > 0 && (
                                            <select
                                                onChange={(e) => handleAssign(incident.id, e.target.value)}
                                                className="text-xs border border-gray-300 rounded px-2 py-1.5"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Assign...</option>
                                                {members.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Incident Detail Modal */}
            {selectedIncidentId && (
                <IncidentDetail
                    incidentId={selectedIncidentId}
                    onClose={() => setSelectedIncidentId(null)}
                    onUpdate={fetchData}
                />
            )}

            {/* Webhook Tester Modal - Admin Only */}
            <WebhookTesterModal
                isOpen={showWebhookTester}
                onClose={() => setShowWebhookTester(false)}
                onIncidentCreated={fetchData}
            />
        </div>
    );
}
