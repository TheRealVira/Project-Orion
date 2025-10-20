import { Shield, User, Eye } from 'lucide-react';
import { UserRole } from './permissions';

export type AuthProvider = 'local' | 'oauth' | 'ldap';

interface BadgeConfig {
  icon: string;
  label: string;
  className: string;
}

interface RoleBadgeConfig {
  icon: typeof Shield;
  label: string;
  className: string;
}

/**
 * Authentication provider badge configurations
 */
export const AUTH_PROVIDER_BADGES: Record<AuthProvider, BadgeConfig> = {
  oauth: {
    icon: '🔐',
    label: 'OAuth',
    className: 'font-semibold text-indigo-900 dark:text-white',
  },
  ldap: {
    icon: '🏢',
    label: 'LDAP',
    className: 'font-semibold text-cyan-900 dark:text-white',
  },
  local: {
    icon: '🔑',
    label: 'Local',
    className: 'font-semibold text-emerald-900 dark:text-white',
  },
};

/**
 * User role badge configurations
 */
export const ROLE_BADGES: Record<UserRole, RoleBadgeConfig> = {
  admin: {
    icon: Shield,
    label: 'Admin',
    className: 'font-semibold text-red-900 dark:text-white',
  },
  user: {
    icon: User,
    label: 'User',
    className: 'font-semibold text-blue-900 dark:text-white',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    className: 'font-semibold text-amber-900 dark:text-white',
  },
};

/**
 * Color configuration for badges - used for inline styles (background and borders)
 */
const badgeColors: Record<string, { lightBg: string; darkBg: string; lightBorder: string; darkBorder: string }> = {
  oauth: {
    lightBg: 'rgba(99, 102, 241, 0.4)',      // indigo-500/40
    darkBg: 'rgba(165, 102, 255, 0.5)',      // indigo-400/50
    lightBorder: 'rgba(79, 70, 229, 0.6)',   // indigo-600/60
    darkBorder: 'rgba(165, 102, 255, 0.5)', // indigo-300/50
  },
  ldap: {
    lightBg: 'rgba(6, 182, 212, 0.4)',       // cyan-500/40
    darkBg: 'rgba(34, 211, 238, 0.5)',       // cyan-400/50
    lightBorder: 'rgba(8, 145, 178, 0.6)',   // cyan-600/60
    darkBorder: 'rgba(139, 230, 255, 0.5)', // cyan-300/50
  },
  local: {
    lightBg: 'rgba(16, 185, 129, 0.4)',      // emerald-500/40
    darkBg: 'rgba(52, 211, 153, 0.5)',       // emerald-400/50
    lightBorder: 'rgba(5, 150, 105, 0.6)',   // emerald-600/60
    darkBorder: 'rgba(167, 243, 208, 0.5)', // emerald-300/50
  },
  admin: {
    lightBg: 'rgba(239, 68, 68, 0.4)',       // red-500/40
    darkBg: 'rgba(248, 113, 113, 0.5)',      // red-400/50
    lightBorder: 'rgba(220, 38, 38, 0.6)',   // red-600/60
    darkBorder: 'rgba(252, 165, 165, 0.5)', // red-300/50
  },
  user: {
    lightBg: 'rgba(59, 130, 246, 0.4)',      // blue-500/40
    darkBg: 'rgba(96, 165, 250, 0.5)',       // blue-400/50
    lightBorder: 'rgba(37, 99, 235, 0.6)',   // blue-600/60
    darkBorder: 'rgba(191, 219, 254, 0.5)', // blue-300/50
  },
  viewer: {
    lightBg: 'rgba(217, 119, 6, 0.4)',       // amber-500/40
    darkBg: 'rgba(251, 146, 60, 0.5)',       // amber-400/50
    lightBorder: 'rgba(180, 83, 9, 0.6)',    // amber-600/60
    darkBorder: 'rgba(253, 186, 116, 0.5)', // amber-300/50
  },
};

interface AuthProviderBadgeProps {
  provider: AuthProvider;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

/**
 * Reusable AuthProvider Badge Component
 */
export function AuthProviderBadge({ provider, className = '', size = 'sm' }: AuthProviderBadgeProps) {
  const config = AUTH_PROVIDER_BADGES[provider];
  const colors = badgeColors[provider];
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${sizeClasses[size]} ${config.className} ${className}`}
      style={{
        backgroundColor: isDark ? colors.darkBg : colors.lightBg,
        borderColor: isDark ? colors.darkBorder : colors.lightBorder,
        backdropFilter: 'blur(12px) saturate(180%)',
        boxShadow: 'rgba(255, 255, 255, 0.5) 0px 1px 2px inset, rgba(0, 0, 0, 0.1) 0px -1px 2px inset, rgba(0, 0, 0, 0.1) 0px 1px 3px, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset',
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Reusable Role Badge Component
 */
export function RoleBadge({ role, className = '', size = 'sm', showIcon = true }: RoleBadgeProps) {
  const config = ROLE_BADGES[role];
  const Icon = config.icon;
  const colors = badgeColors[role];
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${sizeClasses[size]} ${config.className} ${className}`}
      style={{
        backgroundColor: isDark ? colors.darkBg : colors.lightBg,
        borderColor: isDark ? colors.darkBorder : colors.lightBorder,
        backdropFilter: 'blur(12px) saturate(180%)',
        boxShadow: 'rgba(255, 255, 255, 0.5) 0px 1px 2px inset, rgba(0, 0, 0, 0.1) 0px -1px 2px inset, rgba(0, 0, 0, 0.1) 0px 1px 3px, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset',
      }}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Get auth provider badge configuration
 */
export function getAuthProviderBadge(provider: AuthProvider): BadgeConfig {
  return AUTH_PROVIDER_BADGES[provider];
}

/**
 * Get role badge configuration
 */
export function getRoleBadge(role: UserRole): RoleBadgeConfig {
  return ROLE_BADGES[role];
}

/**
 * Get auth provider badge class name only
 */
export function getAuthProviderClassName(provider: AuthProvider): string {
  return AUTH_PROVIDER_BADGES[provider].className;
}

/**
 * Get role badge class name only
 */
export function getRoleClassName(role: UserRole): string {
  return ROLE_BADGES[role].className;
}
