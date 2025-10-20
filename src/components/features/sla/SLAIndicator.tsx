'use client';

import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Incident, TeamSLASettings, SLAStatus } from '@/types';
import { calculateSLAStatus, formatMinutes } from '@/lib/utils/sla';

interface SLAIndicatorProps {
  incident: Incident;
  slaSettings?: TeamSLASettings;
  size?: 'small' | 'large';
}

export default function SLAIndicator({ incident, slaSettings, size = 'small' }: SLAIndicatorProps) {
  // If no SLA settings or SLA is disabled, don't show anything
  if (!slaSettings || !slaSettings.enabled) {
    return null;
  }

  // Calculate current SLA status
  const slaStatus: SLAStatus = calculateSLAStatus(incident, slaSettings);

  const isSmall = size === 'small';
  
  // Determine colors based on SLA status
  const getResponseColor = () => {
    if (incident.firstResponseAt) {
      return slaStatus.isResponseBreached
        ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        : 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    }
    if (slaStatus.isResponseBreached) {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if (slaStatus.isResponseAtRisk) {
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  };

  const getResolutionColor = () => {
    if (incident.closedAt) {
      return slaStatus.isResolutionBreached
        ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        : 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    }
    if (slaStatus.isResolutionBreached) {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if (slaStatus.isResolutionAtRisk) {
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  };

  if (isSmall) {
    // Compact badge view for lists
    return (
      <div className="flex items-center space-x-1.5">
        {/* Response Time Badge */}
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getResponseColor()}`}>
          {incident.firstResponseAt ? (
            slaStatus.isResponseBreached ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )
          ) : slaStatus.isResponseBreached ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          <span className="font-medium">
            {incident.firstResponseAt
              ? slaStatus.isResponseBreached
                ? 'Resp. Late'
                : 'Resp. Met'
              : slaStatus.isResponseBreached
              ? 'Resp. Overdue'
              : formatMinutes(slaStatus.responseTimeRemaining)}
          </span>
        </div>

        {/* Resolution Time Badge */}
        {incident.status !== 'new' && (
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getResolutionColor()}`}>
            {incident.closedAt ? (
              slaStatus.isResolutionBreached ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )
            ) : slaStatus.isResolutionBreached ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            <span className="font-medium">
              {incident.closedAt
                ? slaStatus.isResolutionBreached
                  ? 'Resol. Late'
                  : 'Resol. Met'
                : slaStatus.isResolutionBreached
                ? 'Resol. Overdue'
                : formatMinutes(slaStatus.resolutionTimeRemaining)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Large detailed view for incident detail page
  return (
    <div className="space-y-3">
      {/* Response Time */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time to First Response
          </span>
          <span className={`text-sm font-semibold ${
            incident.firstResponseAt
              ? slaStatus.isResponseBreached
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
              : slaStatus.isResponseBreached
              ? 'text-red-600 dark:text-red-400'
              : slaStatus.isResponseAtRisk
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {incident.firstResponseAt
              ? slaStatus.isResponseBreached
                ? '⚠️ Breached'
                : '✓ Met'
              : slaStatus.isResponseBreached
              ? '⚠️ Overdue'
              : formatMinutes(slaStatus.responseTimeRemaining)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              incident.firstResponseAt
                ? slaStatus.isResponseBreached
                  ? 'bg-red-600'
                  : 'bg-green-600'
                : slaStatus.isResponseBreached
                ? 'bg-red-600'
                : slaStatus.isResponseAtRisk
                ? 'bg-orange-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, slaStatus.responseTimePercentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
          <span>Started: {new Date(incident.createdAt).toLocaleString()}</span>
          {incident.slaResponseDeadline && (
            <span>
              Target: {new Date(incident.slaResponseDeadline).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Resolution Time */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time to Resolution
          </span>
          <span className={`text-sm font-semibold ${
            incident.closedAt
              ? slaStatus.isResolutionBreached
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
              : slaStatus.isResolutionBreached
              ? 'text-red-600 dark:text-red-400'
              : slaStatus.isResolutionAtRisk
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {incident.closedAt
              ? slaStatus.isResolutionBreached
                ? '⚠️ Breached'
                : '✓ Met'
              : slaStatus.isResolutionBreached
              ? '⚠️ Overdue'
              : formatMinutes(slaStatus.resolutionTimeRemaining)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              incident.closedAt
                ? slaStatus.isResolutionBreached
                  ? 'bg-red-600'
                  : 'bg-green-600'
                : slaStatus.isResolutionBreached
                ? 'bg-red-600'
                : slaStatus.isResolutionAtRisk
                ? 'bg-orange-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, slaStatus.resolutionTimePercentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
          <span>Started: {new Date(incident.createdAt).toLocaleString()}</span>
          {incident.slaResolutionDeadline && (
            <span>
              Target: {new Date(incident.slaResolutionDeadline).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
