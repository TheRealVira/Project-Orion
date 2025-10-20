'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { TeamSLASettings } from '@/types';

interface TeamSLAConfigProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const defaultSettings: Omit<TeamSLASettings, 'id' | 'createdAt' | 'updatedAt' | 'teamId'> = {
  responseTimeCritical: 15,
  responseTimeHigh: 30,
  responseTimeMedium: 60,
  responseTimeLow: 240,
  resolutionTimeCritical: 240,
  resolutionTimeHigh: 480,
  resolutionTimeMedium: 1440,
  resolutionTimeLow: 2880,
  businessHoursOnly: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '17:00',
  businessDays: [1, 2, 3, 4, 5], // Monday to Friday
  timezone: 'UTC',
  enabled: true,
};

export default function TeamSLAConfig({ teamId, isOpen, onClose, onSave }: TeamSLAConfigProps) {
  const [settings, setSettings] = useState<Omit<TeamSLASettings, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  
  // Store display values as strings for better typing experience
  const [displayValues, setDisplayValues] = useState({
    responseTimeCritical: '0.25',
    responseTimeHigh: '0.5',
    responseTimeMedium: '1',
    responseTimeLow: '4',
    resolutionTimeCritical: '4',
    resolutionTimeHigh: '8',
    resolutionTimeMedium: '24',
    resolutionTimeLow: '48',
  });

  useEffect(() => {
    if (isOpen && teamId) {
      fetchSettings();
    }
  }, [isOpen, teamId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/sla`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setHasExisting(true);
        // Update display values
        setDisplayValues({
          responseTimeCritical: (data.responseTimeCritical / 60).toFixed(2),
          responseTimeHigh: (data.responseTimeHigh / 60).toFixed(2),
          responseTimeMedium: (data.responseTimeMedium / 60).toFixed(2),
          responseTimeLow: (data.responseTimeLow / 60).toFixed(2),
          resolutionTimeCritical: (data.resolutionTimeCritical / 60).toFixed(2),
          resolutionTimeHigh: (data.resolutionTimeHigh / 60).toFixed(2),
          resolutionTimeMedium: (data.resolutionTimeMedium / 60).toFixed(2),
          resolutionTimeLow: (data.resolutionTimeLow / 60).toFixed(2),
        });
      } else if (response.status === 404) {
        // No settings yet, use defaults
        setSettings(defaultSettings);
        setHasExisting(false);
        // Set default display values
        setDisplayValues({
          responseTimeCritical: '0.25',
          responseTimeHigh: '0.5',
          responseTimeMedium: '1',
          responseTimeLow: '4',
          resolutionTimeCritical: '4',
          resolutionTimeHigh: '8',
          resolutionTimeMedium: '24',
          resolutionTimeLow: '48',
        });
      }
    } catch (error) {
      console.error('Error fetching SLA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/teams/${teamId}/sla`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        if (onSave) onSave();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to save SLA settings: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving SLA settings:', error);
      alert('Failed to save SLA settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      businessDays: prev.businessDays.includes(day)
        ? prev.businessDays.filter(d => d !== day)
        : [...prev.businessDays, day].sort(),
    }));
  };

  // Handler for response/resolution time inputs
  const handleTimeChange = (field: keyof typeof displayValues, value: string) => {
    // Allow typing (including empty string and partial decimals)
    setDisplayValues(prev => ({ ...prev, [field]: value }));
    
    // Update settings only if value is valid
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const minutes = Math.round(numValue * 60);
      const settingsField = field as keyof Pick<typeof settings, 
        'responseTimeCritical' | 'responseTimeHigh' | 'responseTimeMedium' | 'responseTimeLow' |
        'resolutionTimeCritical' | 'resolutionTimeHigh' | 'resolutionTimeMedium' | 'resolutionTimeLow'>;
      setSettings(prev => ({ ...prev, [settingsField]: minutes }));
    }
  };

  const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);
  const hoursToMinutes = (hours: number) => Math.round(hours * 60);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]">
        <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-white/40 dark:border-white/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              SLA Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Enable/Disable SLA */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Enable SLA Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track response and resolution times for incidents
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`p-2 rounded-lg transition-colors ${
                  settings.enabled
                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {settings.enabled ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Response Time Targets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Response Time Targets (hours)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Critical <span className="text-red-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={displayValues.responseTimeCritical}
                    onChange={(e) => handleTimeChange('responseTimeCritical', e.target.value)}
                    className="input"
                    placeholder="0.25"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.responseTimeCritical} minutes
                  </p>
                </div>
                <div>
                  <label className="label">
                    High <span className="text-orange-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={displayValues.responseTimeHigh}
                    onChange={(e) => handleTimeChange('responseTimeHigh', e.target.value)}
                    className="input"
                    placeholder="0.5"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.responseTimeHigh} minutes
                  </p>
                </div>
                <div>
                  <label className="label">
                    Medium <span className="text-yellow-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={displayValues.responseTimeMedium}
                    onChange={(e) => handleTimeChange('responseTimeMedium', e.target.value)}
                    className="input"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.responseTimeMedium} minutes
                  </p>
                </div>
                <div>
                  <label className="label">
                    Low <span className="text-blue-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={displayValues.responseTimeLow}
                    onChange={(e) => handleTimeChange('responseTimeLow', e.target.value)}
                    className="input"
                    placeholder="4"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.responseTimeLow} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Time Targets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resolution Time Targets (hours)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Critical <span className="text-red-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={displayValues.resolutionTimeCritical}
                    onChange={(e) => handleTimeChange('resolutionTimeCritical', e.target.value)}
                    className="input"
                    placeholder="4"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.resolutionTimeCritical} minutes ({(settings.resolutionTimeCritical / 60 / 24).toFixed(1)} days)
                  </p>
                </div>
                <div>
                  <label className="label">
                    High <span className="text-orange-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={displayValues.resolutionTimeHigh}
                    onChange={(e) => handleTimeChange('resolutionTimeHigh', e.target.value)}
                    className="input"
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.resolutionTimeHigh} minutes ({(settings.resolutionTimeHigh / 60 / 24).toFixed(1)} days)
                  </p>
                </div>
                <div>
                  <label className="label">
                    Medium <span className="text-yellow-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={displayValues.resolutionTimeMedium}
                    onChange={(e) => handleTimeChange('resolutionTimeMedium', e.target.value)}
                    className="input"
                    placeholder="24"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.resolutionTimeMedium} minutes ({(settings.resolutionTimeMedium / 60 / 24).toFixed(1)} days)
                  </p>
                </div>
                <div>
                  <label className="label">
                    Low <span className="text-blue-600">●</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={displayValues.resolutionTimeLow}
                    onChange={(e) => handleTimeChange('resolutionTimeLow', e.target.value)}
                    className="input"
                    placeholder="48"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {settings.resolutionTimeLow} minutes ({(settings.resolutionTimeLow / 60 / 24).toFixed(1)} days)
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours Settings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Business Hours
                </h3>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, businessHoursOnly: !prev.businessHoursOnly }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    settings.businessHoursOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {settings.businessHoursOnly ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {settings.businessHoursOnly && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Start Time</label>
                      <input
                        type="time"
                        value={settings.businessHoursStart}
                        onChange={(e) => setSettings(prev => ({ ...prev, businessHoursStart: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input
                        type="time"
                        value={settings.businessHoursEnd}
                        onChange={(e) => setSettings(prev => ({ ...prev, businessHoursEnd: e.target.value }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label mb-2">Business Days</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { day: 0, label: 'Sun' },
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                      ].map(({ day, label }) => (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            settings.businessDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      className="input"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New York (EST/EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="America/Denver">America/Denver (MST/MDT)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">About SLA Tracking</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>Response time starts when an incident is created</li>
                  <li>Resolution time starts when an incident is created</li>
                  <li>Business hours affect calculation only if enabled</li>
                  <li>Notifications are sent when SLA targets are at risk (80%) or breached</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
