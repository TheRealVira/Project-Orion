'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SLADashboard } from '@/components/features/sla';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';

export default function SLAPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports'>('dashboard');
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Update tab indicator position when activeTab changes
  useLayoutEffect(() => {
    const updateIndicator = () => {
      const tabs = ['dashboard', 'analytics', 'reports'];
      const activeIndex = tabs.indexOf(activeTab);
      const activeButton = tabRefs.current[activeIndex];
      const container = tabContainerRef.current;
      
      if (activeButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        
        if (buttonRect.width > 0) {
          setTabIndicatorStyle({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    };

    updateIndicator();
    const timer1 = setTimeout(updateIndicator, 10);
    const timer2 = setTimeout(updateIndicator, 50);
    const timer3 = setTimeout(updateIndicator, 100);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

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
        <div className="mb-6 glass-nav p-4">
          <nav 
            ref={tabContainerRef}
            className="relative flex space-x-4"
          >
            {/* Animated sliding indicator */}
            <div
              className="absolute top-0 bottom-0 bg-primary-500/40 dark:bg-primary-400/50 rounded-lg transition-all duration-300 ease-in-out pointer-events-none z-20 border border-primary-600/60 dark:border-primary-300/50"
              style={{
                left: `${tabIndicatorStyle.left}px`,
                width: `${tabIndicatorStyle.width}px`,
                display: tabIndicatorStyle.width > 0 ? 'block' : 'none',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              }}
            >
              {/* Top edge gradient for glass refraction effect */}
              <div
                className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/30 to-transparent"
              />
            </div>

            <button
              ref={el => { tabRefs.current[0] = el; }}
              onClick={() => setActiveTab('dashboard')}
              className={`relative py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 z-30 ${
                activeTab === 'dashboard' 
                  ? 'text-primary-900 dark:text-white font-semibold' 
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </div>
            </button>

            <button
              ref={el => { tabRefs.current[1] = el; }}
              onClick={() => setActiveTab('analytics')}
              className={`relative py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 z-30 ${
                activeTab === 'analytics' 
                  ? 'text-primary-900 dark:text-white font-semibold' 
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </div>
            </button>

            <button
              ref={el => { tabRefs.current[2] = el; }}
              onClick={() => setActiveTab('reports')}
              className={`relative py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 z-30 ${
                activeTab === 'reports' 
                  ? 'text-primary-900 dark:text-white font-semibold' 
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
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
