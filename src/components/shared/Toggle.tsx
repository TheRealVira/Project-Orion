'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export interface ToggleOption<T = string> {
  value: T;
  label?: string;
  icon?: ReactNode;
  ariaLabel?: string;
}

interface ToggleProps<T = string> {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export default function Toggle<T = string>({ 
  value, 
  options, 
  onChange, 
  className = '',
  ariaLabel = 'Toggle'
}: ToggleProps<T>) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update indicator position when value changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = options.findIndex(opt => opt.value === value);
      const activeButton = buttonRefs.current[activeIndex];
      const container = containerRef.current;
      
      if (activeButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [value, options]);

  const handleToggle = () => {
    const currentIndex = options.findIndex(opt => opt.value === value);
    const nextIndex = (currentIndex + 1) % options.length;
    onChange(options[nextIndex].value);
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleToggle}
      className={`relative flex items-center bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-1 border border-gray-300/30 dark:border-white/10 cursor-pointer select-none ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {/* Animated sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-primary-500/40 dark:bg-primary-400/50 rounded-lg transition-all duration-300 ease-in-out border border-primary-600/60 dark:border-primary-300/50"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        }}
      >
        {/* Top edge gradient for glass refraction effect */}
        <div
          className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/30 to-transparent"
        />
      </div>
      
      {/* Option buttons */}
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={el => { buttonRefs.current[index] = el; }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(option.value);
          }}
          className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${
            value === option.value
              ? 'text-primary-700 dark:text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.ariaLabel || option.label || String(option.value)}
          title={option.ariaLabel || option.label || String(option.value)}
        >
          {option.icon && <span className="flex items-center">{option.icon}</span>}
          {option.label && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
