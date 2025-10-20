'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

const alertTemplates = {
  prometheus: {
    name: 'Prometheus Alert',
    payload: {
      alerts: [
        {
          fingerprint: 'prom_12345',
          labels: {
            alertname: 'HighCPUUsage',
            severity: 'critical',
            instance: 'server-01',
            job: 'node-exporter',
            team: 'Operations',
          },
          annotations: {
            summary: 'High CPU usage detected',
            description: 'CPU usage is above 90% for more than 5 minutes on server-01',
          },
          startsAt: new Date().toISOString(),
          generatorURL: 'http://prometheus:9090/graph?g0.expr=...',
        },
      ],
    },
  },
  grafana: {
    name: 'Grafana Alert',
    payload: {
      title: 'Disk Space Critical',
      message: 'Disk usage on /var/log is at 95%',
      state: 'alerting',
      ruleId: 1,
      ruleName: 'Disk Space Monitor',
      ruleUrl: 'https://grafana.example.com/d/disk-dashboard',
      tags: ['Product A', 'infrastructure', 'disk', 'critical'],
    },
  },
  dynatrace: {
    name: 'Dynatrace Problem',
    payload: {
      ProblemID: 'DT-12345',
      ProblemTitle: 'Response time degradation',
      ProblemDetails: {
        text: 'Response time increased by 300% in the last 10 minutes',
      },
      ProblemSeverity: 'ERROR',
      ImpactLevel: 'SERVICE',
      AffectedEntities: ['SERVICE-001', 'HOST-002'],
      Tags: ['Product B', 'production', 'api', 'performance'],
    },
  },
  generic: {
    name: 'Generic Alert',
    payload: {
      source: 'custom-monitor',
      title: 'Database Connection Pool Exhausted',
      description: 'All database connections are in use. New requests are being queued.',
      severity: 'high',
      team: 'Product A',
      tags: ['database', 'connection-pool'],
    },
  },
};

interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated?: () => void;
}

export default function WebhookTesterModal({ isOpen, onClose, onIncidentCreated }: WebhookTesterModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof alertTemplates>('prometheus');
  const [payload, setPayload] = useState(JSON.stringify(alertTemplates.prometheus.payload, null, 2));
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleTemplateChange = (template: keyof typeof alertTemplates) => {
    setSelectedTemplate(template);
    setPayload(JSON.stringify(alertTemplates[template].payload, null, 2));
    setResponse(null);
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setResponse(null);

      const res = await fetch('/api/webhooks/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });

      // Call callback to refresh incidents list
      if ((res.status === 200 || res.status === 201) && onIncidentCreated) {
        setTimeout(() => {
          onIncidentCreated();
        }, 500);
      }
    } catch (error: any) {
      setResponse({
        status: 'error',
        error: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Webhook</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send test alerts to create incidents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Input */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Alert Templates
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(alertTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTemplateChange(key as keyof typeof alertTemplates)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTemplate === key
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Payload (JSON)</label>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="input font-mono text-xs"
                  rows={16}
                />
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Alert'}
              </button>
            </div>

            {/* Right Panel - Response */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Response
              </h3>

              {!response ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
                  Send an alert to see the response
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        response.status === 201 || response.status === 200
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : response.status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {response.status} {response.statusText}
                    </span>
                  </div>

                  <div>
                    <label className="label">Response Body</label>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs max-h-80">
                      {JSON.stringify(response.data || response, null, 2)}
                    </pre>
                  </div>

                  {response.data?.id && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✅ Incident created successfully! The incident list will refresh automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
