import { User } from 'lucide-react';
import { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4 text-[8px]',
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-6 h-6 text-xs',
  lg: 'w-8 h-8 text-sm',
  xl: 'w-12 h-12 text-base',
};

const iconSizes = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 28,
};

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  // Helper functions for fallback avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Show image if src exists and hasn't failed to load
  if (src && !imageError) {
    return (
      <img 
        src={src} 
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Default avatar - colored circle with initials
  const bgColor = getColorFromName(alt);
  const initials = getInitials(alt);

  return (
    <div 
      className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center text-white font-semibold ${className}`}
      title={alt}
    >
      {initials}
    </div>
  );
}
