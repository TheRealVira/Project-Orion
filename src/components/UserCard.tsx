'use client';

import { Mail, Phone, Shield } from 'lucide-react';
import Avatar from './Avatar';

interface UserCardProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        role?: 'admin' | 'user' | 'viewer';
        authProvider?: 'local' | 'oauth' | 'ldap';
    };
    size?: 'sm' | 'md' | 'lg';
    showEmail?: boolean;
    showPhone?: boolean;
    showRole?: boolean;
    showAuthProvider?: boolean;
    className?: string;
}

/**
 * UserCard - Reusable component for displaying user information consistently
 * Used in UserList, UserProfile dropdown, and anywhere users are displayed
 */
export default function UserCard({
    user,
    size = 'md',
    showEmail = true,
    showPhone = true,
    showRole = true,
    showAuthProvider = true,
    className = '',
}: UserCardProps) {
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'user':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'viewer':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const sizeClasses = {
        sm: {
            avatar: 'w-8 h-8' as const,
            avatarSize: 'md' as const,
            name: 'text-sm',
            text: 'text-xs',
            icon: 'w-3 h-3',
            badge: 'text-xs px-2 py-0.5',
            gap: 'gap-2',
        },
        md: {
            avatar: 'w-10 h-10' as const,
            avatarSize: 'lg' as const,
            name: 'text-base',
            text: 'text-sm',
            icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
            badge: 'text-xs px-2 py-1',
            gap: 'gap-3',
        },
        lg: {
            avatar: 'w-12 h-12' as const,
            avatarSize: 'xl' as const,
            name: 'text-lg',
            text: 'text-sm',
            icon: 'w-4 h-4',
            badge: 'text-xs px-2 py-1',
            gap: 'gap-4',
        },
    };

    const classes = sizeClasses[size];

    return (
        <div className={`flex items-start ${classes.gap} ${className}`}>
            <div className="flex-shrink-0">
                <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size={classes.avatarSize}
                />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className={`${classes.name} font-semibold text-gray-900 dark:text-white truncate`}>
                    {user.name}
                </h3>
                {showRole && user.role && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${classes.badge} ${getRoleBadgeColor(user.role)}`}>
                            <Shield className="w-3 h-3" />
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        {showAuthProvider && user.authProvider && (
                            <span className={`inline-flex items-center gap-1 rounded-full font-medium ${classes.badge} ${user.authProvider === 'local'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                }`}>
                                {user.authProvider === 'oauth' ? '🔐 OAuth' : user.authProvider === 'ldap' ? '🏢 LDAP' : '🔑 Local'}
                            </span>
                        )}
                    </div>
                )}
                <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                    {showEmail && (
                        <div className={`flex items-center ${classes.text} text-gray-600 dark:text-gray-400`}>
                            <Mail className={`${classes.icon} mr-1.5 sm:mr-2 flex-shrink-0`} />
                            <a
                                href={`mailto:${user.email}`}
                                className="hover:text-primary-600 truncate"
                            >
                                {user.email}
                            </a>
                        </div>
                    )}
                    {showPhone && user.phone && (
                        <div className={`flex items-center ${classes.text} text-gray-600 dark:text-gray-400`}>
                            <Phone className={`${classes.icon} mr-1.5 sm:mr-2 flex-shrink-0`} />
                            <a
                                href={`tel:${user.phone}`}
                                className="hover:text-primary-600"
                            >
                                {user.phone}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
