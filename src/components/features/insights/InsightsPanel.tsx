'use client';

import { useEffect, useState } from 'react';
import { Insight } from '@/types';
import InsightCard from './InsightCard';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';

interface InsightsPanelProps {
  teamId: string;
  onAction?: (actionId: string, params?: any) => void;
}

export default function InsightsPanel({
  teamId,
  onAction,
}: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState<
    'all' | 'critical' | 'warning' | 'info' | 'success'
  >('all');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}/insights`);
        if (!response.ok) throw new Error('Failed to fetch insights');
        const data = await response.json();
        setInsights(data.insights || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load insights');
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchInsights();
    }
  }, [teamId]);

  const handleDismiss = (insightId: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(insightId);
    setDismissedIds(newDismissed);
    // TODO: Save dismissal to backend
  };

  const filteredInsights =
    filter === 'all'
      ? insights.filter((i) => !dismissedIds.has(i.id))
      : insights.filter(
          (i) => i.severity === filter && !dismissedIds.has(i.id)
        );

  const severityCounts = {
    critical: insights.filter((i) => i.severity === 'critical').length,
    warning: insights.filter((i) => i.severity === 'warning').length,
    info: insights.filter((i) => i.severity === 'info').length,
    success: insights.filter((i) => i.severity === 'success').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Generating insights...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-900 dark:text-red-100">{error}</span>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          No insights available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Everything looks good! Check back later for new insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <FilterTab
          label="All"
          count={insights.length}
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {severityCounts.critical > 0 && (
          <FilterTab
            label="Critical"
            count={severityCounts.critical}
            isActive={filter === 'critical'}
            onClick={() => setFilter('critical')}
            severity="critical"
          />
        )}
        {severityCounts.warning > 0 && (
          <FilterTab
            label="Warning"
            count={severityCounts.warning}
            isActive={filter === 'warning'}
            onClick={() => setFilter('warning')}
            severity="warning"
          />
        )}
        {severityCounts.info > 0 && (
          <FilterTab
            label="Info"
            count={severityCounts.info}
            isActive={filter === 'info'}
            onClick={() => setFilter('info')}
            severity="info"
          />
        )}
      </div>

      {/* Insights */}
      {filteredInsights.length > 0 ? (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No {filter} insights at this time.
          </p>
        </div>
      )}
    </div>
  );
}

interface FilterTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  severity?: 'critical' | 'warning' | 'info';
}

function FilterTab({
  label,
  count,
  isActive,
  onClick,
  severity,
}: FilterTabProps) {
  // Use explicit inline styles for colors since they're dynamic
  let bgColor = '';
  let textColor = '';
  let borderColor = '';

  if (isActive) {
    // Active states with explicit colors
    if (severity === 'critical') {
      bgColor = 'rgb(239, 68, 68, 0.4)'; // red-500/40
      textColor = 'rgb(127, 29, 29)'; // red-900
      borderColor = 'rgb(220, 38, 38, 0.6)'; // red-600/60
    } else if (severity === 'warning') {
      bgColor = 'rgb(234, 179, 8, 0.4)'; // yellow-500/40
      textColor = 'rgb(113, 63, 18)'; // yellow-900
      borderColor = 'rgb(202, 138, 4, 0.6)'; // yellow-600/60
    } else if (severity === 'info') {
      bgColor = 'rgb(59, 130, 246, 0.4)'; // blue-500/40
      textColor = 'rgb(30, 58, 138)'; // blue-900
      borderColor = 'rgb(37, 99, 235, 0.6)'; // blue-600/60
    } else {
      bgColor = 'rgb(59, 130, 246, 0.4)'; // primary-500/40
      textColor = 'rgb(30, 58, 138)'; // primary-900
      borderColor = 'rgb(37, 99, 235, 0.6)'; // primary-600/60
    }
  } else {
    // Inactive states - gray theme
    bgColor = 'rgb(209, 213, 219, 0.5)'; // gray-300/50
    textColor = 'rgb(17, 24, 39)'; // gray-900
    borderColor = 'rgb(107, 114, 128, 0.5)'; // gray-500/50
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
    borderColor: borderColor,
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
  };

  return (
    <button
      onClick={onClick}
      className="border px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer hover:opacity-90"
      style={buttonStyle}
    >
      {label} ({count})
    </button>
  );
}
