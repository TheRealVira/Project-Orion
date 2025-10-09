'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Key, Server, Github, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleIcon, MicrosoftIcon, GitLabIcon, KofiIcon } from '@/components/BrandIcons';
import AnimatedHeart from '@/components/AnimatedHeart';
import AnimatedSparkles from '@/components/AnimatedSparkles';

interface AuthConfig {
  local: boolean;
  ldap: boolean;
  oauth: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ local: true, ldap: false, oauth: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'local' | 'ldap'>('local');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Fetch auth configuration
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(config => {
        setAuthConfig(config);
        // Default to LDAP if available and local is not
        if (config.ldap && !config.local) {
          setAuthMethod('ldap');
        }
      })
      .catch(console.error);

    // Check for OAuth errors
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(getErrorMessage(oauthError));
    }
  }, [searchParams]);

  const getErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      missing_parameters: 'Authentication failed: missing parameters',
      invalid_state: 'Authentication failed: invalid state',
      provider_not_configured: 'OAuth provider is not configured',
      authentication_failed: 'Authentication failed',
      internal_error: 'An internal error occurred',
    };
    return messages[code] || 'An error occurred during authentication';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          authProvider: authMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Refresh user context and redirect to home page
      await refreshUser();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const getOAuthIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'google':
        return <GoogleIcon />;
      case 'microsoft':
        return <MicrosoftIcon />;
      case 'gitlab':
        return <GitLabIcon />;
      default:
        return <Key className="w-5 h-5" />;
    }
  };

  const getOAuthLabel = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Project Orion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            On-Call Companion Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Auth Method Tabs */}
          {authConfig.local && authConfig.ldap && (
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => setAuthMethod('local')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'local'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Mail className="w-4 h-4 inline-block mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('ldap')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'ldap'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Server className="w-4 h-4 inline-block mr-2" />
                LDAP
              </button>
            </div>
          )}

          {/* Login Form */}
          {(authConfig.local || authConfig.ldap) && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  {authMethod === 'ldap' ? 'Username' : 'Email'}
                </label>
                <input
                  id="email"
                  type={authMethod === 'ldap' ? 'text' : 'email'}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder={authMethod === 'ldap' ? 'Enter your username' : 'Enter your email'}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Sign in
                  </>
                )}
              </button>
            </form>
          )}

          {/* OAuth Providers */}
          {authConfig.oauth.length > 0 && (
            <>
              {(authConfig.local || authConfig.ldap) && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {authConfig.oauth.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuthLogin(provider)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {getOAuthIcon(provider)}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {getOAuthLabel(provider)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <AnimatedSparkles className="w-3 h-3 text-yellow-500" animateOnHover />
              <span>Project Orion - On-Call Companion Dashboard</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a 
                href="https://github.com/TheRealVira/Project-Orion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>Source</span>
              </a>
              
              <span className="text-gray-400 dark:text-gray-600">•</span>
              
              <span className="flex items-center gap-1">
                Built with <AnimatedHeart /> by{' '}
                <a 
                  href="https://vira.solutions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Ing. Johanna Rührig
                </a>
              </span>
              
              <span className="text-gray-400 dark:text-gray-600">•</span>
              
              <a 
                href="https://ko-fi.com/vira" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <KofiIcon />
                <span className="text-gray-600 dark:text-gray-400">Support</span>
              </a>
              
              <span className="text-gray-400 dark:text-gray-600">•</span>
              
              <a 
                href="https://github.com/TheRealVira/Project-Orion/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                MIT License
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
