import type { Config } from 'tailwindcss'

/**
 * ===== SINGLE SOURCE OF TRUTH =====
 * All design tokens are defined here in tailwind.config.ts
 * This file is the ONLY place where colors and design values are defined.
 * Everything else (CSS variables, utilities, components) derives from this.
 */

// ===== COLOR PALETTE - SINGLE SOURCE OF TRUTH =====
const colorPalette = {
  // Base neutral colors - used for backgrounds and text
  light: {
    background: 'rgb(255, 255, 255)',
    foreground: 'rgb(0, 0, 0)',
  },
  dark: {
    background: 'rgb(17, 24, 39)', // gray-900
    foreground: 'rgb(255, 255, 255)',
  },

  // Glass morphism - light mode
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.15)',
      backgroundLight: 'rgba(255, 255, 255, 0.25)',
      backgroundLighter: 'rgba(255, 255, 255, 0.35)',
      border: 'rgba(156, 163, 175, 0.3)', // Subtle gray border
      borderHighlight: 'rgba(156, 163, 175, 0.5)',
      highlight: 'rgba(156, 163, 175, 0.6)',
      shine: 'rgba(255, 255, 255, 0.5)', // For inset highlights
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowMedium: 'rgba(0, 0, 0, 0.12)',
      shadowLarge: 'rgba(0, 0, 0, 0.15)',
      shadowXLarge: 'rgba(0, 0, 0, 0.18)',
      shadowInner: 'rgba(0, 0, 0, 0.05)',
      border2: 'rgba(0, 0, 0, 0.1)',
      border2Thin: 'rgba(0, 0, 0, 0.05)',
    },
    // Glass morphism - dark mode
    dark: {
      background: 'rgba(17, 24, 39, 0.3)',
      backgroundLight: 'rgba(17, 24, 39, 0.4)',
      backgroundLighter: 'rgba(17, 24, 39, 0.5)',
      border: 'rgba(255, 255, 255, 0.15)',
      borderHighlight: 'rgba(255, 255, 255, 0.25)',
      highlight: 'rgba(255, 255, 255, 0.3)',
      shine: 'rgba(255, 255, 255, 0.2)', // For inset highlights
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowMedium: 'rgba(0, 0, 0, 0.35)',
      shadowLarge: 'rgba(0, 0, 0, 0.4)',
      shadowXLarge: 'rgba(0, 0, 0, 0.45)',
      shadowInner: 'rgba(255, 255, 255, 0.08)',
      shineSecondary: 'rgba(255, 255, 255, 0.12)',
      shineThird: 'rgba(255, 255, 255, 0.1)',
    },
  },

  // Accent colors for interactive elements
  accent: {
    highlight: 'rgba(255, 255, 255, 0.1)',
    hover: 'rgba(255, 255, 255, 0.3)',
  },

  // Button shadow colors for light mode
  button: {
    light: {
      shineInner: 'rgba(255, 255, 255, 0.5)',
      shadowInner: 'rgba(0, 0, 0, 0.1)',
      shadowOuter: 'rgba(0, 0, 0, 0.1)',
      shadowInsetBorder: 'rgba(255, 255, 255, 0.1)',
    },
    secondary: {
      shineInner: 'rgba(255, 255, 255, 0.3)',
      shadowInner: 'rgba(0, 0, 0, 0.05)',
      shadowOuter: 'rgba(0, 0, 0, 0.05)',
      shadowInsetBorder: 'rgba(255, 255, 255, 0.1)',
    },
  },
}

// ===== TAILWIND CONFIG =====
const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        spin: 'spin 1s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      // ===== GLASS DESIGN SYSTEM (Centralized Theme) =====
      boxShadow: {
        // Glassmorphism shadows - light mode
        'glass-sm': `0 4px 16px ${colorPalette.glass.light.shadow}, inset 0 1px 0 ${colorPalette.glass.light.shine}`,
        'glass-md': `0 8px 32px ${colorPalette.glass.light.shadowMedium}, inset 0 1px 0 ${colorPalette.glass.light.shine}`,
        'glass-lg': `0 12px 48px ${colorPalette.glass.light.shadowLarge}, inset 0 1px 0 ${colorPalette.glass.light.shine}`,
        'glass-xl': `0 16px 64px ${colorPalette.glass.light.shadowXLarge}, inset 0 1px 0 ${colorPalette.glass.light.shine}`,
        // Glassmorphism shadows - dark mode
        'glass-dark-sm': `0 4px 16px ${colorPalette.glass.dark.shadow}, inset 0 1px 0 ${colorPalette.glass.dark.shine}`,
        'glass-dark-md': `0 8px 32px ${colorPalette.glass.dark.shadowMedium}, inset 0 1px 0 ${colorPalette.glass.dark.shineSecondary}`,
        'glass-dark-lg': `0 12px 48px ${colorPalette.glass.dark.shadowLarge}, inset 0 1px 0 ${colorPalette.glass.dark.shadowInner}`,
        'glass-dark-xl': `0 16px 64px ${colorPalette.glass.dark.shadowXLarge}, inset 0 1px 0 ${colorPalette.glass.dark.shineThird}`,
        // Primary button shadows - derived from colorPalette
        'btn-primary-light': `inset 0 1px 2px ${colorPalette.button.light.shineInner}, inset 0 -1px 2px ${colorPalette.button.light.shadowInner}, 0 1px 3px ${colorPalette.button.light.shadowOuter}, 0 0 0 1px ${colorPalette.button.light.shadowInsetBorder} inset`,
        // Secondary button shadows - derived from colorPalette
        'btn-secondary-light': `inset 0 1px 2px ${colorPalette.button.secondary.shineInner}, inset 0 -1px 2px ${colorPalette.button.secondary.shadowInner}, 0 1px 2px ${colorPalette.button.secondary.shadowOuter}, 0 0 0 1px ${colorPalette.button.secondary.shadowInsetBorder} inset`,
      },
      // Glass background utilities
      backgroundColor: {
        'glass-light': colorPalette.glass.light.background,
        'glass-lighter': colorPalette.glass.light.backgroundLight,
        'glass-lightest': colorPalette.glass.light.backgroundLighter,
        'glass-dark': colorPalette.glass.dark.background,
        'glass-darker': colorPalette.glass.dark.backgroundLight,
        'glass-darkest': colorPalette.glass.dark.backgroundLighter,
        // Page background colors from colorPalette
        'page-light': colorPalette.light.background,
        'page-dark': colorPalette.dark.background,
      },
      // Glass border colors
      borderColor: {
        'glass-light': colorPalette.glass.light.border,
        'glass-lighter': colorPalette.glass.light.borderHighlight,
        'glass-dark': colorPalette.glass.dark.border,
        'glass-darker': colorPalette.glass.dark.borderHighlight,
      },
      // Text colors for glass highlights
      textColor: {
        'glass-light': colorPalette.glass.light.highlight,
        'glass-dark': colorPalette.glass.dark.highlight,
      },
      // Background images for shine effects
      backgroundImage: {
        'glass-gradient': `linear-gradient(135deg, ${colorPalette.accent.highlight} 0%, ${colorPalette.accent.highlight} 100%)`,
        'glass-shine-light': `linear-gradient(90deg, transparent, ${colorPalette.glass.light.highlight}, transparent)`,
        'glass-shine-dark': `linear-gradient(90deg, transparent, ${colorPalette.glass.dark.highlight}, transparent)`,
        'liquid-glass-blue': 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)',
        'liquid-glass-purple': 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        'liquid-glass-pink': 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.04) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
