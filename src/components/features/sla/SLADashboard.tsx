'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Users as UsersIcon,
  Calendar,
  BarChart3,
  Download,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { ChartToggle } from '@/components/shared';
import type { ChartType } from '@/components/shared/ChartToggle';
import SLAIndicator from './SLAIndicator';
import { TeamSLAConfig } from '@/components/features/teams';
import { formatMinutes } from '@/lib/utils/sla';
import { LoadingSpinner, Button, Card } from '@/components/ui';

interface SLAStats {
  summary: {
    totalOpenIncidents: number;
    atRiskCount: number;
    breachedCount: number;
    healthyCount: number;
    responseCompliance: number;
    resolutionCompliance: number;
    avgResponseTimeMinutes: number | null;
    avgResolutionTimeMinutes: number | null;
  };
  historical: {
    totalClosed: number;
    responseBreaches: number;
    resolutionBreaches: number;
  };
  teamBreakdown: Array<{
    teamId: string;
    teamName: string;
    teamColor: string;
    totalIncidents: number;
    responseCompliance: number;
    resolutionCompliance: number;
  }>;
  atRiskIncidents?: any[];
  breachedIncidents?: any[];
}

interface Team {
  id: string;
  name: string;
  color: string;
}

interface TrendData {
  date: string;
  totalIncidents: number;
  closedIncidents: number;
  responseCompliance: number;
  resolutionCompliance: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

interface TrendsResponse {
  summary: {
    startDate: string;
    endDate: string;
    totalIncidents: number;
    totalClosed: number;
    avgResponseCompliance: number;
    avgResolutionCompliance: number;
  };
  trends: TrendData[];
  teamTrends?: {
    [teamId: string]: {
      teamName: string;
      teamColor: string;
      trends: TrendData[];
    };
  };
}

export default function SLADashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [dateRange, setDateRange] = useState('30'); // days
  
  // Chart type toggles
  const [incidentChartType, setIncidentChartType] = useState<ChartType>('line');
  const [complianceChartType, setComplianceChartType] = useState<ChartType>('line');
  const [timeChartType, setTimeChartType] = useState<ChartType>('line');

  useEffect(() => {
    const fetchAllData = async () => {
      setRefreshing(true);
      await Promise.all([fetchData(), fetchTrends()]);
      setRefreshing(false);
    };
    
    fetchAllData();
    fetchTeams();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
      fetchTrends();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTeamId, dateRange]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        includeDetails: 'true',
      });
      
      if (selectedTeamId) {
        params.append('teamId', selectedTeamId);
      }
      
      if (dateRange) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        params.append('startDate', startDate.toISOString());
      }
      
      const response = await fetch(`/api/sla/stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching SLA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const params = new URLSearchParams({
        days: dateRange,
      });
      
      if (selectedTeamId) {
        params.append('teamId', selectedTeamId);
      }
      
      const response = await fetch(`/api/sla/trends?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      }
    } catch (error) {
      console.error('Error fetching SLA trends:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" center />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load SLA statistics
      </div>
    );
  }

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600 dark:text-green-400';
    if (compliance >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplianceBgColor = (compliance: number) => {
    if (compliance >= 95) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (compliance >= 85) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!stats || !trends) return;

    // Prepare summary data
    const overallCompliance = ((stats.summary.responseCompliance + stats.summary.resolutionCompliance) / 2).toFixed(1);
    
    const summaryRows = [
      ['SLA Dashboard Export'],
      [`Team: ${selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name || 'Unknown' : 'All Teams'}`],
      [`Date Range: Last ${dateRange} Days`],
      [`Export Date: ${new Date().toLocaleString()}`],
      [],
      ['Summary Metrics'],
      ['Metric', 'Value'],
      ['Open Incidents', stats.summary.totalOpenIncidents],
      ['At Risk Incidents', stats.summary.atRiskCount],
      ['Breached Incidents', stats.summary.breachedCount],
      ['Healthy Incidents', stats.summary.healthyCount],
      ['Response SLA Compliance', `${stats.summary.responseCompliance.toFixed(1)}%`],
      ['Resolution SLA Compliance', `${stats.summary.resolutionCompliance.toFixed(1)}%`],
      ['Overall SLA Compliance', `${overallCompliance}%`],
      ['Avg Response Time', stats.summary.avgResponseTimeMinutes ? `${stats.summary.avgResponseTimeMinutes.toFixed(1)} min` : 'N/A'],
      ['Avg Resolution Time', stats.summary.avgResolutionTimeMinutes ? `${stats.summary.avgResolutionTimeMinutes.toFixed(1)} min` : 'N/A'],
      [],
      ['Trend Data'],
      ['Date', 'Total Incidents', 'Response Compliance %', 'Resolution Compliance %', 'Avg Response Time (min)', 'Avg Resolution Time (min)'],
    ];

    // Add trend data rows
    trends.trends.forEach((trend) => {
      summaryRows.push([
        trend.date,
        trend.totalIncidents?.toString() || '0',
        trend.responseCompliance?.toString() || '100',
        trend.resolutionCompliance?.toString() || '100',
        trend.avgResponseTime?.toString() || '0',
        trend.avgResolutionTime?.toString() || '0',
      ]);
    });

    // Convert to CSV
    const csv = summaryRows.map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sla-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-7 h-7" />
            SLA Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time SLA monitoring and performance metrics
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          {refreshing && <LoadingSpinner size="sm" />}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="input text-sm"
            disabled={refreshing}
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input text-sm"
            disabled={refreshing}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <Button
            variant="secondary"
            onClick={exportToCSV}
            icon={<Download className="w-4 h-4" />}
            disabled={refreshing || !stats || !trends}
            title="Export to CSV"
          >
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Incidents */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open Incidents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.summary.totalOpenIncidents}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-green-600 dark:text-green-400">{stats.summary.healthyCount} healthy</span>
            <span className="text-yellow-600 dark:text-yellow-400">{stats.summary.atRiskCount} at risk</span>
            <span className="text-red-600 dark:text-red-400">{stats.summary.breachedCount} breached</span>
          </div>
        </div>

        {/* Response Compliance */}
        <div className={`card border-2 ${getComplianceBgColor(stats.summary.responseCompliance)}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Response SLA</p>
              <p className={`text-3xl font-bold mt-1 ${getComplianceColor(stats.summary.responseCompliance)}`}>
                {stats.summary.responseCompliance}%
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Avg: {stats.summary.avgResponseTimeMinutes ? formatMinutes(stats.summary.avgResponseTimeMinutes) : 'N/A'}
              </div>
            </div>
            <div className="w-20 h-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="greenGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
                    </linearGradient>
                    <linearGradient id="yellowGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
                      <stop offset="100%" stopColor="rgba(245, 158, 11, 0.4)" />
                    </linearGradient>
                    <linearGradient id="redGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={stats.summary.totalOpenIncidents > 0 ? [
                      { 
                        name: 'Healthy', 
                        value: stats.summary.healthyCount || 0,
                      },
                      { 
                        name: 'At Risk', 
                        value: stats.summary.atRiskCount || 0,
                      },
                      { 
                        name: 'Breached', 
                        value: stats.summary.breachedCount || 0,
                      },
                    ].filter(item => item.value > 0) : [
                      { 
                        name: 'No Data', 
                        value: 1,
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={stats.summary.totalOpenIncidents > 0 ? 2 : 0}
                    dataKey="value"
                  >
                    {stats.summary.totalOpenIncidents > 0 ? (
                      <>
                        <Cell fill="url(#greenGlass)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth={1.5} />
                        <Cell fill="url(#yellowGlass)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth={1.5} />
                        <Cell fill="url(#redGlass)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth={1.5} />
                      </>
                    ) : (
                      <Cell fill="url(#greenGlass)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth={1.5} />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resolution Compliance */}
        <div className={`card border-2 ${getComplianceBgColor(stats.summary.resolutionCompliance)}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolution SLA</p>
              <p className={`text-3xl font-bold mt-1 ${getComplianceColor(stats.summary.resolutionCompliance)}`}>
                {stats.summary.resolutionCompliance}%
              </p>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Avg: {stats.summary.avgResolutionTimeMinutes ? formatMinutes(stats.summary.avgResolutionTimeMinutes) : 'N/A'}
              </div>
            </div>
            <div className="w-20 h-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="greenGlass2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
                    </linearGradient>
                    <linearGradient id="redGlass2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={stats.historical.totalClosed > 0 ? [
                      { 
                        name: 'Met', 
                        value: Math.max(0, stats.historical.totalClosed - stats.historical.resolutionBreaches),
                      },
                      { 
                        name: 'Breached', 
                        value: stats.historical.resolutionBreaches || 0,
                      },
                    ].filter(item => item.value > 0) : [
                      { 
                        name: 'No Data', 
                        value: 1,
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={stats.historical.totalClosed > 0 ? 2 : 0}
                    dataKey="value"
                  >
                    {stats.historical.totalClosed > 0 ? (
                      <>
                        <Cell fill="url(#greenGlass2)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth={1.5} />
                        <Cell fill="url(#redGlass2)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth={1.5} />
                      </>
                    ) : (
                      <Cell fill="url(#greenGlass2)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth={1.5} />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Historical Data */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Closed Incidents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.historical.totalClosed}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Last {dateRange} days
          </div>
        </div>
      </div>

      {/* At-Risk and Breached Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breached Incidents */}
        {stats.breachedIncidents && stats.breachedIncidents.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Breached SLA ({stats.breachedIncidents.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.breachedIncidents.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.team?.name} • {item.severity}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 whitespace-nowrap">
                      BREACHED
                    </span>
                  </div>
                  {item.slaStatus && (
                    <div className="mt-2">
                      <SLAIndicator
                        incident={item}
                        slaSettings={item.slaStatus}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At-Risk Incidents */}
        {stats.atRiskIncidents && stats.atRiskIncidents.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              At Risk ({stats.atRiskIncidents.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.atRiskIncidents.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.team?.name} • {item.severity}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 whitespace-nowrap">
                      AT RISK
                    </span>
                  </div>
                  {item.slaStatus && (
                    <div className="mt-2">
                      <SLAIndicator
                        incident={item}
                        slaSettings={item.slaStatus}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trends Line Charts */}
      {trends && trends.trends.length > 0 && (
        <div className="card" key={`${selectedTeamId}-${dateRange}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            SLA Trends Over Time
          </h3>
          
          {/* Incidents Trend */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incident Volume
              </h4>
              <ChartToggle 
                value={incidentChartType}
                onChange={setIncidentChartType}
              />
            </div>
            {selectedTeamId ? (
              <div 
                className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
              <ResponsiveContainer width="100%" height={250}>
                {incidentChartType === 'line' ? (
                  <LineChart data={trends.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalIncidents" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Total Incidents"
                      dot={false}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="closedIncidents" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Closed Incidents"
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={trends.trends}>
                    <defs>
                      <linearGradient id="blueBarGlass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
                      </linearGradient>
                      <linearGradient id="greenBarGlass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="totalIncidents" 
                      fill="url(#blueBarGlass)" 
                      name="Total Incidents"
                      radius={[4, 4, 0, 0]}
                      stroke="rgba(59, 130, 246, 0.8)"
                      strokeWidth={1}
                    />
                    <Bar 
                      dataKey="closedIncidents" 
                      fill="url(#greenBarGlass)" 
                      name="Closed Incidents"
                      radius={[4, 4, 0, 0]}
                      stroke="rgba(16, 185, 129, 0.8)"
                      strokeWidth={1}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
              </div>
            ) : trends.teamTrends && (
              (() => {
                // Merge team data by date
                const mergedData: any = {};
                Object.entries(trends.teamTrends).forEach(([teamId, teamData]: [string, any]) => {
                  teamData.trends.forEach((trend: any) => {
                    if (!mergedData[trend.date]) {
                      mergedData[trend.date] = { date: trend.date };
                    }
                    mergedData[trend.date][teamData.teamName] = trend.totalIncidents;
                  });
                });
                const chartData = Object.values(mergedData);

                return (
                  <div 
                    className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
                    style={{
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                  <ResponsiveContainer width="100%" height={250}>
                    {incidentChartType === 'line' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Legend />
                        {Object.entries(trends.teamTrends).map(([teamId, teamData]: [string, any]) => (
                          <Line 
                            key={teamId}
                            type="monotone" 
                            dataKey={teamData.teamName}
                            stroke={teamData.teamColor} 
                            strokeWidth={2}
                            name={teamData.teamName}
                            dot={false}
                            activeDot={{ r: 6, fill: teamData.teamColor }}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <defs>
                          {Object.entries(trends.teamTrends).map(([teamId, teamData]: [string, any], index) => {
                            const gradientId = `teamGrad${index}`;
                            const hexColor = teamData.teamColor;
                            return (
                              <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={`${hexColor}99`} />
                                <stop offset="100%" stopColor={`${hexColor}66`} />
                              </linearGradient>
                            );
                          })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Legend />
                        {Object.entries(trends.teamTrends).map(([teamId, teamData]: [string, any], index) => (
                          <Bar 
                            key={teamId}
                            dataKey={teamData.teamName}
                            fill={`url(#teamGrad${index})`}
                            name={teamData.teamName}
                            radius={[4, 4, 0, 0]}
                            stroke={`${teamData.teamColor}cc`}
                            strokeWidth={1}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                  </div>
                );
              })()
            )}
          </div>

          {/* SLA Compliance Trend */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                SLA Compliance Rate
              </h4>
              <ChartToggle 
                value={complianceChartType}
                onChange={setComplianceChartType}
              />
            </div>
            <div 
              className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
            <ResponsiveContainer width="100%" height={250}>
              {complianceChartType === 'line' ? (
                <LineChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="responseCompliance" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Response SLA %"
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolutionCompliance" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Resolution SLA %"
                    dot={false}
                    activeDot={{ r: 6, fill: '#8b5cf6' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={trends.trends}>
                  <defs>
                    <linearGradient id="blueCompGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
                    </linearGradient>
                    <linearGradient id="purpleCompGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
                      <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="responseCompliance" 
                    fill="url(#blueCompGlass)" 
                    name="Response SLA %"
                    radius={[4, 4, 0, 0]}
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth={1}
                  />
                  <Bar 
                    dataKey="resolutionCompliance" 
                    fill="url(#purpleCompGlass)" 
                    name="Resolution SLA %"
                    radius={[4, 4, 0, 0]}
                    stroke="rgba(139, 92, 246, 0.8)"
                    strokeWidth={1}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
            </div>
          </div>

          {/* Response Time Trend */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Average Response & Resolution Time (minutes)
              </h4>
              <ChartToggle 
                value={timeChartType}
                onChange={setTimeChartType}
              />
            </div>
            <div 
              className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
            <ResponsiveContainer width="100%" height={250}>
              {timeChartType === 'line' ? (
                <LineChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => `${Math.round(value)} min`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgResponseTime" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Avg Response Time"
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgResolutionTime" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Avg Resolution Time"
                    dot={false}
                    activeDot={{ r: 6, fill: '#f59e0b' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={trends.trends}>
                  <defs>
                    <linearGradient id="greenTimeGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
                    </linearGradient>
                    <linearGradient id="amberTimeGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
                      <stop offset="100%" stopColor="rgba(245, 158, 11, 0.4)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => `${Math.round(value)} min`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="avgResponseTime" 
                    fill="url(#greenTimeGlass)" 
                    name="Avg Response Time"
                    radius={[4, 4, 0, 0]}
                    stroke="rgba(16, 185, 129, 0.8)"
                    strokeWidth={1}
                  />
                  <Bar 
                    dataKey="avgResolutionTime" 
                    fill="url(#amberTimeGlass)" 
                    name="Avg Resolution Time"
                    radius={[4, 4, 0, 0]}
                    stroke="rgba(245, 158, 11, 0.8)"
                    strokeWidth={1}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Team Breakdown */}
      {stats.teamBreakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Team
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Incidents
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Response SLA
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Resolution SLA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.teamBreakdown.map((team) => (
                  <tr key={team.teamId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: team.teamColor }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {team.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {team.totalIncidents}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${getComplianceColor(team.responseCompliance)}`}>
                        {team.responseCompliance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${getComplianceColor(team.resolutionCompliance)}`}>
                        {team.resolutionCompliance}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
