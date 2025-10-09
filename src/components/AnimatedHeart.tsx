'use client';

import { useState } from 'react';

interface HeartProps {
  className?: string;
  /** If true, the heart will be a clickable button */
  clickable?: boolean;
  /** Custom aria label for accessibility */
  ariaLabel?: string;
}

/**
 * AnimatedHeart - A centralized heart component that beats when clicked
 * Easter egg: Click any heart in the app to make it beat!
 */
export default function AnimatedHeart({ 
  className = '', 
  clickable = true,
  ariaLabel = 'Heart'
}: HeartProps) {
  const [isBeating, setIsBeating] = useState(false);

  const handleClick = () => {
    if (!clickable) return;
    
    setIsBeating(true);
    // Reset animation after it completes
    setTimeout(() => setIsBeating(false), 600);
  };

  const heartContent = (
    <>
      <style>
        {`
          @keyframes heart-beating {
            0% { transform: scale(1); }
            14% { transform: scale(1.3); }
            28% { transform: scale(1); }
            42% { transform: scale(1.3); }
            56% { transform: scale(1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <span 
        className={className}
        style={{ 
          display: 'inline-block',
          animation: isBeating ? 'heart-beating 0.6s ease-in-out' : 'none'
        }}
      >
        ❤️
      </span>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center focus:outline-none border-0 bg-transparent p-0 m-0 transition-transform hover:scale-110 cursor-pointer select-none"
        aria-label={ariaLabel}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {heartContent}
      </button>
    );
  }

  return heartContent;
}
