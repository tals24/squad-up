/**
 * SquadUp Dark Mode System
 * 
 * Complete dark mode implementation with theme toggling,
 * system preference detection, and persistent storage.
 */

import { colors as lightColors } from './theme';

// ===========================================
// DARK MODE COLOR PALETTE
// ===========================================

export const darkColors = {
  // Primary Colors - Slightly muted for dark mode
  primary: {
    50: '#0c1525',
    100: '#1e2a3a', 
    200: '#2b3d52',
    300: '#3b506b',
    400: '#4d6485',
    500: '#6b82a6',  // Main Primary (adjusted)
    600: '#7a91b5',
    700: '#8aa1c5',
    800: '#9bb1d5',
    900: '#acc2e5',
    950: '#bdd3f5',
  },

  // Secondary Colors - Warmer teal for dark mode
  secondary: {
    50: '#042f2e',
    100: '#134e4a',
    200: '#0f766e',
    300: '#14b8a6',
    400: '#2dd4bf',  // Main Secondary
    500: '#5eead4',
    600: '#7dd3fc',
    700: '#99f6e4',
    800: '#ccfbf1',
    900: '#f0fdfa',
    950: '#f8fefd',
  },

  // Neutral Colors - Optimized for dark mode
  neutral: {
    50: '#020617',
    100: '#0f172a',
    200: '#1e293b',
    300: '#334155',
    400: '#475569',
    500: '#64748b',
    600: '#94a3b8',
    700: '#cbd5e1',
    800: '#e2e8f0',
    900: '#f1f5f9',
    950: '#f8fafc',
  },

  // Semantic Colors - Adjusted for dark backgrounds
  success: {
    50: '#0a2e0a',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },

  warning: {
    50: '#2d1b00',
    500: '#f59e0b', 
    600: '#d97706',
    700: '#b45309',
  },

  error: {
    50: '#2d0a0a',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  info: {
    50: '#0a1426',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Dark Mode Background System
  background: {
    primary: '#0f172a',     // Main dark background
    secondary: '#1e293b',   // Elevated surfaces
    tertiary: '#334155',    // Cards and panels
    accent: '#0c1525',      // Accent backgrounds
    muted: '#1e293b',       // Muted backgrounds
  },

  // Dark Mode Text System
  text: {
    primary: '#f8fafc',     // High contrast text
    secondary: '#cbd5e1',   // Secondary text
    tertiary: '#94a3b8',    // Muted text
    inverse: '#0f172a',     // Inverse text (on light backgrounds)
    muted: '#64748b',       // Very muted text
    accent: '#6b82a6',      // Accent text
  },

  // Dark Mode Border System
  border: {
    default: '#334155',
    muted: '#1e293b',
    accent: '#4d6485',
  },
} as const;

// ===========================================
// THEME DEFINITIONS
// ===========================================

export const lightTheme = {
  ...lightColors,
  name: 'light',
} as const;

export const darkTheme = {
  ...darkColors,
  name: 'dark',
} as const;

// ===========================================
// THEME UTILITIES
// ===========================================

export type ThemeMode = 'light' | 'dark' | 'system';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as ThemeMode) || 'system';
};

export const setStoredTheme = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

export const getResolvedTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
};

export const applyTheme = (theme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Update CSS custom properties for consistent theming
  const colors = theme === 'dark' ? darkColors : lightColors;
  
  // Set background colors
  root.style.setProperty('--color-background-primary', colors.background.primary);
  root.style.setProperty('--color-background-secondary', colors.background.secondary);
  root.style.setProperty('--color-background-tertiary', colors.background.tertiary);
  
  // Set text colors
  root.style.setProperty('--color-text-primary', colors.text.primary);
  root.style.setProperty('--color-text-secondary', colors.text.secondary);
  root.style.setProperty('--color-text-tertiary', colors.text.tertiary);
  
  // Set border colors
  root.style.setProperty('--color-border-default', colors.border.default);
  root.style.setProperty('--color-border-muted', colors.border.muted);
};

// ===========================================
// DARK MODE CSS CLASSES
// ===========================================

export const darkModeClasses = {
  // Background classes that respond to dark mode
  bg: {
    primary: 'bg-white dark:bg-neutral-900',
    secondary: 'bg-neutral-50 dark:bg-neutral-800',
    tertiary: 'bg-neutral-100 dark:bg-neutral-700',
    accent: 'bg-primary-50 dark:bg-neutral-800',
    muted: 'bg-neutral-50 dark:bg-neutral-800',
  },
  
  // Text classes that respond to dark mode
  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-700 dark:text-neutral-300',
    tertiary: 'text-neutral-500 dark:text-neutral-400',
    muted: 'text-neutral-400 dark:text-neutral-500',
    accent: 'text-primary-600 dark:text-primary-400',
  },
  
  // Border classes that respond to dark mode
  border: {
    default: 'border-neutral-200 dark:border-neutral-700',
    muted: 'border-neutral-100 dark:border-neutral-800',
    accent: 'border-primary-200 dark:border-primary-700',
  },
  
  // Card and surface classes
  surface: {
    default: 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
    elevated: 'bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/20',
    interactive: 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700',
  },
} as const;

// ===========================================
// DARK MODE AWARE COMPONENT VARIANTS
// ===========================================

export const createDarkModeVariant = (lightClass: string, darkClass: string) => {
  return `${lightClass} dark:${darkClass}`;
};

export const getDarkModeClass = (category: keyof typeof darkModeClasses, variant: string) => {
  return darkModeClasses[category]?.[variant] || '';
};
