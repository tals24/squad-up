/**
 * SquadUp Design System - Centralized Theme Configuration
 * 
 * This file contains all design tokens for consistent styling across the application.
 * Built on TailwindCSS + shadcn/ui foundation with custom tokens for SquadUp branding.
 */

// ===========================================
// COLOR PALETTE
// ===========================================

export const colors = {
  // Primary Colors - Brand Identity (Sky Blue)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main Primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Secondary Colors - Accent & Support (Teal)
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4', 
    300: '#5eead4',
    400: '#2dd4bf',  // Main Secondary
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  // Neutral Colors - Grays & Text (Slate)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  warning: {
    50: '#fffbeb',
    500: '#f59e0b', 
    600: '#d97706',
    700: '#b45309',
  },

  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Background System
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    accent: '#f0f9ff',
    muted: '#f8fafc',
  },

  // Text System
  text: {
    primary: '#0f172a',
    secondary: '#475569', 
    tertiary: '#64748b',
    inverse: '#ffffff',
    muted: '#94a3b8',
    accent: '#0ea5e9',
  },

  // Border System
  border: {
    default: '#e2e8f0',
    muted: '#f1f5f9',
    accent: '#bae6fd',
  },
} as const;

// ===========================================
// TYPOGRAPHY SYSTEM
// ===========================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'monospace'],
    display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  },

  // Font Sizes (4px base scale)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px  
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Typography Presets
  presets: {
    // Display Typography
    'display-2xl': {
      fontSize: '4.5rem',   // 72px
      lineHeight: '1',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    'display-xl': {
      fontSize: '3.75rem',  // 60px
      lineHeight: '1',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    'display-lg': {
      fontSize: '3rem',     // 48px
      lineHeight: '1',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },

    // Heading Typography
    'heading-xl': {
      fontSize: '2.25rem',  // 36px
      lineHeight: '1.25',
      fontWeight: 700,
    },
    'heading-lg': {
      fontSize: '1.875rem', // 30px
      lineHeight: '1.25',
      fontWeight: 600,
    },
    'heading-md': {
      fontSize: '1.5rem',   // 24px
      lineHeight: '1.375',
      fontWeight: 600,
    },
    'heading-sm': {
      fontSize: '1.25rem',  // 20px
      lineHeight: '1.375',
      fontWeight: 600,
    },
    'heading-xs': {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.5',
      fontWeight: 600,
    },

    // Body Typography
    'body-xl': {
      fontSize: '1.25rem',  // 20px
      lineHeight: '1.625',
      fontWeight: 400,
    },
    'body-lg': {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.625',
      fontWeight: 400,
    },
    'body-md': {
      fontSize: '1rem',     // 16px
      lineHeight: '1.5',
      fontWeight: 400,
    },
    'body-sm': {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.5',
      fontWeight: 400,
    },
    'body-xs': {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1.5',
      fontWeight: 400,
    },

    // Caption Typography
    'caption-lg': {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    'caption-md': {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1.25',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    'caption-sm': {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1',
      fontWeight: 400,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
    },
  },
} as const;

// ===========================================
// SPACING SYSTEM
// ===========================================

export const spacing = {
  // Base spacing scale (4px increments)
  0: '0px',
  px: '1px',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  1.5: '0.375rem',    // 6px
  2: '0.5rem',        // 8px
  2.5: '0.625rem',    // 10px
  3: '0.75rem',       // 12px
  3.5: '0.875rem',    // 14px
  4: '1rem',          // 16px
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px
  7: '1.75rem',       // 28px
  8: '2rem',          // 32px
  9: '2.25rem',       // 36px
  10: '2.5rem',       // 40px
  11: '2.75rem',      // 44px
  12: '3rem',         // 48px
  14: '3.5rem',       // 56px
  16: '4rem',         // 64px
  20: '5rem',         // 80px
  24: '6rem',         // 96px
  28: '7rem',         // 112px
  32: '8rem',         // 128px
  36: '9rem',         // 144px
  40: '10rem',        // 160px
  44: '11rem',        // 176px
  48: '12rem',        // 192px
  52: '13rem',        // 208px
  56: '14rem',        // 224px
  60: '15rem',        // 240px
  64: '16rem',        // 256px
  72: '18rem',        // 288px
  80: '20rem',        // 320px
  96: '24rem',        // 384px

  // Semantic spacing
  component: {
    xs: '0.5rem',       // 8px - tight component spacing
    sm: '0.75rem',      // 12px - small component spacing
    md: '1rem',         // 16px - default component spacing
    lg: '1.5rem',       // 24px - large component spacing
    xl: '2rem',         // 32px - extra large component spacing
  },

  layout: {
    xs: '1rem',         // 16px - minimal layout spacing
    sm: '1.5rem',       // 24px - small layout spacing
    md: '2rem',         // 32px - default layout spacing
    lg: '3rem',         // 48px - large layout spacing
    xl: '4rem',         // 64px - extra large layout spacing
    '2xl': '6rem',      // 96px - section spacing
  },

  container: {
    xs: '1rem',         // 16px - mobile padding
    sm: '1.5rem',       // 24px - tablet padding
    md: '2rem',         // 32px - desktop padding
    lg: '3rem',         // 48px - large desktop padding
  },
} as const;

// ===========================================
// SHADOWS & EFFECTS
// ===========================================

export const shadows = {
  // Standard shadows
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Focus shadows
  focus: '0 0 0 3px rgb(14 165 233 / 0.15)',
  'focus-visible': '0 0 0 2px rgb(14 165 233 / 0.8)',

  // Brand shadows with primary colors
  'primary-glow': '0 0 20px rgb(14 165 233 / 0.3)',
  'secondary-glow': '0 0 20px rgb(45 212 191 / 0.3)',

  // Component-specific shadows
  button: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'button-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  tooltip: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
} as const;

// ===========================================
// BORDER RADIUS
// ===========================================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',     // 2px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',

  // Component-specific radius
  button: '0.5rem',   // 8px
  input: '0.5rem',    // 8px
  card: '0.75rem',    // 12px
  modal: '0.75rem',   // 12px
  badge: '9999px',    // full
  avatar: '9999px',   // full
} as const;

// ===========================================
// TRANSITIONS & ANIMATIONS
// ===========================================

export const transitions = {
  // Duration tokens
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  // Enhanced timing functions for different interaction types
  timing: {
    // Standard Material Design easing
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    
    // Enhanced easing curves
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },

  // Common transition presets
  presets: {
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Interactive element transitions
    button: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    card: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    input: 'border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Loading and state transitions
    loading: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'opacity 250ms cubic-bezier(0, 0, 0.2, 1), transform 250ms cubic-bezier(0, 0, 0.2, 1)',
    exit: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1), transform 150ms cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// ===========================================
// FRAMER MOTION ANIMATION SYSTEM
// ===========================================

export const animations = {
  // Page transitions
  pageVariants: {
    initial: { opacity: 0, y: 20 },
    enter: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1],
        staggerChildren: 0.1 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    },
  },

  // Modal/Dialog animations
  modalVariants: {
    initial: { opacity: 0, scale: 0.95 },
    enter: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.2, 
        ease: [0.0, 0.0, 0.2, 1] 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { 
        duration: 0.15, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    },
  },

  // Card hover animations
  cardVariants: {
    initial: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4, 
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
    tap: { 
      scale: 0.98, 
      transition: { 
        duration: 0.1, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
  },

  // Button press animations
  buttonVariants: {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05, 
      transition: { 
        duration: 0.15, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
    tap: { 
      scale: 0.95, 
      transition: { 
        duration: 0.1, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
  },

  // Loading spinner
  spinnerVariants: {
    animate: { 
      rotate: 360, 
      transition: { 
        duration: 1, 
        ease: 'linear', 
        repeat: Infinity 
      } 
    },
  },

  // Slide animations
  slideVariants: {
    enterFromRight: { x: '100%', opacity: 0 },
    enterFromLeft: { x: '-100%', opacity: 0 },
    center: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
    exitToLeft: { 
      x: '-100%', 
      opacity: 0, 
      transition: { 
        duration: 0.25, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    },
    exitToRight: { 
      x: '100%', 
      opacity: 0, 
      transition: { 
        duration: 0.25, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    },
  },

  // Stagger animations for lists
  staggerContainer: {
    initial: {},
    animate: { 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1 
      } 
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
  },

  // Form field animations
  fieldVariants: {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
    error: { 
      x: [-10, 10, -10, 10, 0], 
      transition: { 
        duration: 0.4 
      } 
    },
  },

  // Focus and accessibility animations
  focusVariants: {
    initial: { scale: 1 },
    focus: { 
      scale: 1.02,
      transition: { 
        duration: 0.15, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
  },

  // Loading states
  loadingVariants: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1] 
      } 
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    },
  },
} as const;

// ===========================================
// COMPONENT TOKENS
// ===========================================

export const components = {
  // Button variants
  button: {
    height: {
      xs: '2rem',       // 32px
      sm: '2.25rem',    // 36px
      md: '2.5rem',     // 40px
      lg: '2.75rem',    // 44px
      xl: '3rem',       // 48px
    },
    padding: {
      xs: '0.5rem 0.75rem',
      sm: '0.625rem 1rem',
      md: '0.75rem 1.25rem',
      lg: '0.875rem 1.5rem',
      xl: '1rem 2rem',
    },
  },

  // Input variants
  input: {
    height: {
      xs: '2rem',       // 32px
      sm: '2.25rem',    // 36px
      md: '2.5rem',     // 40px
      lg: '2.75rem',    // 44px
      xl: '3rem',       // 48px
    },
    padding: {
      xs: '0.5rem 0.75rem',
      sm: '0.625rem 0.875rem',
      md: '0.75rem 1rem',
      lg: '0.875rem 1.125rem',
      xl: '1rem 1.25rem',
    },
  },

  // Card variants
  card: {
    padding: {
      xs: '1rem',       // 16px
      sm: '1.25rem',    // 20px
      md: '1.5rem',     // 24px
      lg: '2rem',       // 32px
      xl: '2.5rem',     // 40px
    },
  },
} as const;

// ===========================================
// BREAKPOINTS & RESPONSIVE
// ===========================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===========================================
// THEME EXPORT
// ===========================================

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  animations,
  components,
  breakpoints,
} as const;

export default theme;

// Type exports for TypeScript support
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type Transitions = typeof transitions;
export type Animations = typeof animations;
export type Components = typeof components;
export type Breakpoints = typeof breakpoints;
export type Theme = typeof theme;
