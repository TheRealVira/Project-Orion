'use client';

import { useState, useRef, useEffect } from 'react';

export type ChartType = 'line' | 'bar';

interface ChartToggleProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
  className?: string;
}

export default function ChartToggle({ value, onChange, className = '' }: ChartToggleProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const lineButtonRef = useRef<HTMLButtonElement>(null);
  const barButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update indicator position when value changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeButton = value === 'line' ? lineButtonRef.current : barButtonRef.current;
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
    // Update on window resize
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [value]);

  const handleToggle = () => {
    onChange(value === 'line' ? 'bar' : 'line');
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleToggle}
      className={`relative flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 cursor-pointer select-none ${className}`}
      role="radiogroup"
      aria-label="Chart type"
    >
      {/* Animated sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 ease-in-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />
      
      {/* Line button */}
      <button
        ref={lineButtonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange('line');
        }}
        className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
          value === 'line'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        role="radio"
        aria-checked={value === 'line'}
      >
        📈 Line
      </button>
      
      {/* Bar button */}
      <button
        ref={barButtonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange('bar');
        }}
        className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
          value === 'bar'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        role="radio"
        aria-checked={value === 'bar'}
      >
        📊 Bar
      </button>
    </div>
  );
}
