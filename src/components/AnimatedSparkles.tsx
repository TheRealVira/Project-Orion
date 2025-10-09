'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimatedSparklesProps {
  className?: string;
  /** If true, triggers animation on hover instead of click */
  animateOnHover?: boolean;
  /** If true, the sparkles will be a clickable button */
  clickable?: boolean;
  /** Custom aria label for accessibility */
  ariaLabel?: string;
}

/**
 * AnimatedSparkles - A centralized sparkles component that swirls when interacted with
 * Easter egg: Click or hover over any ✨ in the app to make it swirl!
 */
export default function AnimatedSparkles({ 
  className = 'w-4 h-4 text-yellow-500', 
  animateOnHover = false,
  clickable = true,
  ariaLabel = 'Sparkles'
}: AnimatedSparklesProps) {
  const [isSwirling, setIsSwirling] = useState(false);

  const triggerSwirl = () => {
    setIsSwirling(true);
    setTimeout(() => setIsSwirling(false), 800);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!clickable) return;
    triggerSwirl();
  };

  const handleMouseEnter = () => {
    if (!animateOnHover) return;
    triggerSwirl();
  };

  const handleMouseLeave = () => {
    // Animation continues even after mouse leaves
  };

  const sparklesContent = (
    <>
      <style>
        {`
          @keyframes sparkles-swirl {
            0% { 
              transform: rotate(0deg) scale(1);
              opacity: 1;
            }
            50% { 
              transform: rotate(360deg) scale(1.3);
              opacity: 0.8;
            }
            100% { 
              transform: rotate(0deg) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      <Sparkles 
        className={className}
        style={{
          display: 'inline-block',
          animation: isSwirling ? 'sparkles-swirl 0.8s ease-in-out' : 'none',
          filter: isSwirling ? 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' : 'none'
        }}
      />
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center justify-center focus:outline-none border-0 bg-transparent p-0 m-0 transition-transform hover:scale-110 cursor-pointer select-none"
        aria-label={ariaLabel}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {sparklesContent}
      </button>
    );
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-flex items-center justify-center select-none"
    >
      {sparklesContent}
    </span>
  );
}
