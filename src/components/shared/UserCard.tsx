'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Shield, MapPin, Clock } from 'lucide-react';
import Avatar from './Avatar';
import { AuthProviderBadge, RoleBadge } from '@/lib/utils/badges';

interface UserCardProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        role?: 'admin' | 'user' | 'viewer';
        authProvider?: 'local' | 'oauth' | 'ldap';
        city?: string;
        country?: string;
        timezone?: string;
        onCall?: boolean;
    };
    size?: 'sm' | 'md' | 'lg';
    showEmail?: boolean;
    showPhone?: boolean;
    showRole?: boolean;
    showAuthProvider?: boolean;
    showLocation?: boolean;
    showTimezone?: boolean;
    className?: string;
    referenceTime?: Date;
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
    showLocation = true,
    showTimezone = true,
    className = '',
    referenceTime,
}: UserCardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer);
    }, []);

    const getUserLocalTime = () => {
        if (!user.timezone) return null;
        
        try {
            const timeToUse = referenceTime || currentTime;
            const localTime = timeToUse.toLocaleTimeString('en-US', {
                timeZone: user.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Calculate time difference
            const userDate = new Date(timeToUse.toLocaleString('en-US', { timeZone: user.timezone }));
            const localDate = new Date(timeToUse.toLocaleString('en-US'));
            const diffMs = userDate.getTime() - localDate.getTime();
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            
            let diffText = '';
            if (diffHours > 0) {
                diffText = ` (+${diffHours}h ahead)`;
            } else if (diffHours < 0) {
                diffText = ` (${diffHours}h behind)`;
            } else {
                diffText = ' (same time)';
            }
            
            return { time: localTime, diff: diffText };
        } catch (error) {
            return null;
        }
    };

    const sizeClasses = {
        sm: {
            avatar: 'w-12 h-12' as const,
            avatarSize: 'lg' as const,
            name: 'text-sm font-medium',
            text: 'text-xs',
            icon: 'w-3 h-3',
            badge: 'text-[10px] px-1.5 py-0.5',
            spacing: 'mt-2',
        },
        md: {
            avatar: 'w-16 h-16' as const,
            avatarSize: 'xl' as const,
            name: 'text-lg',
            text: 'text-sm',
            icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
            badge: 'text-xs px-2 py-1',
            spacing: 'mt-3',
        },
        lg: {
            avatar: 'w-20 h-20' as const,
            avatarSize: 'xl' as const,
            name: 'text-xl',
            text: 'text-base',
            icon: 'w-4 h-4',
            badge: 'text-xs px-2 py-1',
            spacing: 'mt-4',
        },
    };

    const classes = sizeClasses[size];

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex flex-col items-center pb-3 border-b border-gray-200/50 dark:border-white/10">
                <div className="flex-shrink-0 mb-3 relative">
                    <Avatar
                        src={user.avatarUrl}
                        alt={user.name}
                        size={classes.avatarSize}
                        className={`${user.onCall ? 'ring-2 ring-red-500 animate-ring-blink shadow-lg' : ''}`}
                    />
                </div>
                <h3 className={`${classes.name} font-semibold text-gray-900 dark:text-white text-center px-2`}>
                    {user.name}
                </h3>
                {showRole && user.role && (
                    <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                        <RoleBadge role={user.role} size={size === 'sm' ? 'xs' : 'sm'} />
                        {showAuthProvider && user.authProvider && (
                            <AuthProviderBadge provider={user.authProvider} size={size === 'sm' ? 'xs' : 'sm'} />
                        )}
                    </div>
                )}
            </div>
            <div className={`pt-3 ${size === 'sm' ? 'space-y-1.5' : 'space-y-2'}`}>
                {showEmail && (
                    <div className={`flex items-center ${classes.text} text-gray-700 dark:text-gray-300`}>
                            <Mail className={`${classes.icon} mr-1.5 flex-shrink-0`} />
                            <a
                                href={`mailto:${user.email}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400 truncate"
                            >
                                {user.email}
                            </a>
                        </div>
                    )}
                    {showPhone && user.phone && (
                        <div className={`flex items-center ${classes.text} text-gray-700 dark:text-gray-300`}>
                            <Phone className={`${classes.icon} mr-1.5 flex-shrink-0`} />
                            <a
                                href={`tel:${user.phone}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400"
                            >
                                {user.phone}
                            </a>
                        </div>
                    )}
                    {showLocation && (user.city || user.country) && (
                        <div className={`flex items-center ${classes.text} text-gray-700 dark:text-gray-300`}>
                            <MapPin className={`${classes.icon} mr-1.5 flex-shrink-0`} />
                            <span className="truncate">
                                {[user.city, user.country].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    )}
                    {showTimezone && user.timezone && (
                        <div className={`flex items-center ${classes.text} text-gray-700 dark:text-gray-300`}>
                            <Clock className={`${classes.icon} mr-1.5 flex-shrink-0`} />
                            <span className="truncate">
                                {(() => {
                                    const timeInfo = getUserLocalTime();
                                    if (timeInfo) {
                                        return (
                                            <>
                                                <span className="text-gray-900 dark:text-gray-200">{timeInfo.time}</span>
                                                <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">{timeInfo.diff}</span>
                                            </>
                                        );
                                    }
                                    return user.timezone.replace('_', ' ');
                                })()}
                            </span>
                    </div>
                )}
            </div>
        </div>
    );
}
