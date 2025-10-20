'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';
import { Insight } from '@/types';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (insightId: string) => void;
  onAction?: (actionId: string, params?: any) => void;
}

const severityConfig = {
  critical: {
    bgColor: 'bg-red-500/40 dark:bg-red-500/40',
    borderColor: 'border-red-600/60 dark:border-red-400/60',
    textColor: 'text-red-900 dark:text-red-100',
    badgeBg: 'bg-red-500/20 dark:bg-red-600/30',
    buttonBg: 'bg-red-500/40 dark:bg-red-500/40 border border-red-600/60 dark:border-red-400/60 text-red-900 dark:text-red-100 hover:bg-red-500/50 dark:hover:bg-red-500/50',
    icon: AlertCircle,
    label: 'Critical',
  },
  warning: {
    bgColor: 'bg-amber-500/40 dark:bg-amber-500/40',
    borderColor: 'border-amber-600/60 dark:border-amber-400/60',
    textColor: 'text-amber-900 dark:text-amber-100',
    badgeBg: 'bg-amber-500/20 dark:bg-amber-600/30',
    buttonBg: 'bg-amber-500/40 dark:bg-amber-500/40 border border-amber-600/60 dark:border-amber-400/60 text-amber-900 dark:text-amber-100 hover:bg-amber-500/50 dark:hover:bg-amber-500/50',
    icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    bgColor: 'bg-blue-500/40 dark:bg-blue-500/40',
    borderColor: 'border-blue-600/60 dark:border-blue-400/60',
    textColor: 'text-blue-900 dark:text-blue-100',
    badgeBg: 'bg-blue-500/20 dark:bg-blue-600/30',
    buttonBg: 'bg-blue-500/40 dark:bg-blue-500/40 border border-blue-600/60 dark:border-blue-400/60 text-blue-900 dark:text-blue-100 hover:bg-blue-500/50 dark:hover:bg-blue-500/50',
    icon: Info,
    label: 'Info',
  },
  success: {
    bgColor: 'bg-green-500/40 dark:bg-green-500/40',
    borderColor: 'border-green-600/60 dark:border-green-400/60',
    textColor: 'text-green-900 dark:text-green-100',
    badgeBg: 'bg-green-500/20 dark:bg-green-600/30',
    buttonBg: 'bg-green-500/40 dark:bg-green-500/40 border border-green-600/60 dark:border-green-400/60 text-green-900 dark:text-green-100 hover:bg-green-500/50 dark:hover:bg-green-500/50',
    icon: CheckCircle,
    label: 'Success',
  },
};

export default function InsightCard({
  insight,
  onDismiss,
  onAction,
}: InsightCardProps) {
  const config = severityConfig[insight.severity];
  const IconComponent = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 transition-all hover:shadow-md`}
      style={{
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <IconComponent
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.textColor}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${config.textColor}`}>
                  {insight.title}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${config.badgeBg} ${config.textColor} border ${config.borderColor}`}
                >
                  {config.label}
                </span>
              </div>
              <p className={`text-sm mt-1 ${config.textColor}`}>
                {insight.description}
              </p>
            </div>

            {/* Dismiss Button */}
            {insight.dismissible && onDismiss && (
              <button
                onClick={() => onDismiss(insight.id)}
                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-white/10 transition-colors flex-shrink-0 ${config.textColor}`}
                title="Dismiss this insight"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Metrics */}
          {insight.metrics && insight.metrics.length > 0 && (
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 p-3 bg-white/20 dark:bg-black/10 rounded`}>
              {insight.metrics.map((metric, idx) => (
                <div key={idx}>
                  <p className={`text-xs ${config.textColor}`}>
                    {metric.label}
                  </p>
                  <p className={`text-sm font-semibold ${config.textColor}`}>
                    {metric.value}
                  </p>
                  {metric.trend && (
                    <p className={`text-xs ${config.textColor}`}>
                      {metric.trend === 'up' && '📈'}{' '}
                      {metric.trend === 'down' && '📉'}{' '}
                      {metric.trendValue}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {insight.suggestions && insight.suggestions.length > 0 && (
            <ul
              className={`mt-3 space-y-1 text-sm list-disc list-inside ${config.textColor}`}
            >
              {insight.suggestions.slice(0, 3).map((suggestion, idx) => (
                <li key={idx}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {insight.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onAction?.(action.actionId, action.params)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                    idx === 0
                      ? config.buttonBg
                      : `bg-gray-300/50 dark:bg-gray-600/50 border border-gray-500/50 dark:border-gray-400/50 text-gray-900 dark:text-white`
                  }`}
                  style={idx === 0 ? { backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' } : undefined}
                >
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
