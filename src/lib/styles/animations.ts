/**
 * Centralized animation styles for the application
 * Used across components for consistent animations
 */

export const ringBlinkAnimation = `
  @keyframes ring-blink {
    0%, 100% { box-shadow: 0 0 0 2px rgb(239, 68, 68); }
    50% { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4); }
  }
  
  .animate-ring-blink {
    animation: ring-blink 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Unified on-call ring blink animation for all components */
  .ring-blink-animation {
    animation: ring-blink 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
