'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SLADashboard from '@/components/SLADashboard';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';

export default function SLAPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports'>('dashboard');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view SLA management</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </div>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <SLADashboard />}
        
        {activeTab === 'analytics' && (
          <div className="card text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced trend analysis and historical performance charts will be available here.
            </p>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reports Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate and download comprehensive SLA reports in PDF and CSV formats.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
