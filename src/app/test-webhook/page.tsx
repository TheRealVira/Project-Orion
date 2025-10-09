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
