'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy webhook tester page redirect
 * The webhook tester functionality has been migrated to a modal on the Incidents page
 * This page now redirects users to the new location
 */
export default function WebhookTesterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to incidents tab
    router.push('/?tab=incidents');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Redirecting...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The webhook tester has been moved to the Incidents page.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          You'll be redirected automatically.
        </p>
      </div>
    </div>
  );
}

/**
 * OLD CODE REMOVED
 * The webhook tester modal component is now located at:
 * src/components/WebhookTesterModal.tsx
 */
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
      tags: ['infrastructure', 'disk', 'critical'],
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
      Tags: ['production', 'api', 'performance'],
    },
  },
  generic: {
    name: 'Generic Alert',
    payload: {
      source: 'custom-monitor',
      title: 'Database Connection Pool Exhausted',
      description: 'All database connections are in use. New requests are being queued.',
      severity: 'high',
      tags: ['database', 'connection-pool'],
    },
  },
};

export default function WebhookTester() {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof alertTemplates>('prometheus');
  const [payload, setPayload] = useState(JSON.stringify(alertTemplates.prometheus.payload, null, 2));
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('/api/webhooks/alerts');

  // Set webhook URL on client side only to avoid hydration errors
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/alerts`);
  }, []);

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
    } catch (error: any) {
      setResponse({
        status: 'error',
        error: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhook Tester</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Test the incident management system by sending sample alerts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Alert Templates
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(alertTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key as keyof typeof alertTemplates)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTemplate === key
                        ? 'bg-blue-600 text-white'
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
                className="input font-mono text-sm"
                rows={20}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Alert'}
            </button>
          </div>

          {/* Right Panel - Response */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Response
            </h2>

            {!response ? (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
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
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : response.status === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                </div>

                <div>
                  <label className="label">Response Body</label>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(response.data || response, null, 2)}
                  </pre>
                </div>

                {response.data?.id && (
                  <a
                    href="/?tab=incidents"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    View in Incidents
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Webhook URL
          </h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <code className="text-sm font-mono text-gray-900 dark:text-white">
              POST {webhookUrl}
            </code>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Use this URL in your monitoring systems (Prometheus Alertmanager, Grafana, Dynatrace, etc.) to send alerts to Project Orion.
          </p>
        </div>
      </div>
    </div>
  );
}
