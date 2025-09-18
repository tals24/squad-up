/**
 * SquadUp Responsive Design System
 * 
 * Advanced responsive utilities with container queries, 
 * breakpoint management, and device detection.
 */

import { breakpoints } from './theme';

// ===========================================
// BREAKPOINT UTILITIES
// ===========================================

export type Breakpoint = keyof typeof breakpoints;

export const BREAKPOINTS = breakpoints;

export const BREAKPOINT_VALUES = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ===========================================
// RESPONSIVE HOOKS
// ===========================================

import React, { useState, useEffect } from 'react';

export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = `(min-width: ${BREAKPOINTS[breakpoint]})`;
    const mediaQuery = window.matchMedia(query);
    
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return matches;
};

export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
  const { width } = useViewport();
  
  // Sort breakpoints by width (largest first)
  const sortedBreakpoints = Object.entries(BREAKPOINT_VALUES)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key as Breakpoint);

  // Find the first breakpoint that matches
  for (const bp of sortedBreakpoints) {
    if (width >= BREAKPOINT_VALUES[bp] && values[bp] !== undefined) {
      return values[bp];
    }
  }

  // Fallback to smallest available value
  const availableBreakpoints = sortedBreakpoints.filter(bp => values[bp] !== undefined);
  return availableBreakpoints.length > 0 ? values[availableBreakpoints[availableBreakpoints.length - 1]] : undefined;
};

// ===========================================
// DEVICE DETECTION
// ===========================================

export const useDeviceType = () => {
  const { width } = useViewport();
  
  if (width >= BREAKPOINT_VALUES.lg) return 'desktop';
  if (width >= BREAKPOINT_VALUES.md) return 'tablet';
  return 'mobile';
};

export const useIsMobile = (): boolean => {
  return useDeviceType() === 'mobile';
};

export const useIsTablet = (): boolean => {
  return useDeviceType() === 'tablet';
};

export const useIsDesktop = (): boolean => {
  return useDeviceType() === 'desktop';
};

export const useTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

// ===========================================
// RESPONSIVE PROPS SYSTEM
// ===========================================

export type ResponsiveProp<T> = T | Partial<Record<Breakpoint, T>>;

export const useResponsiveProp = <T>(prop: ResponsiveProp<T>): T => {
  const { width } = useViewport();
  
  if (typeof prop !== 'object' || prop === null) {
    return prop as T;
  }

  const responsiveValues = prop as Partial<Record<Breakpoint, T>>;
  
  // Sort breakpoints by width (largest first)
  const sortedBreakpoints = Object.entries(BREAKPOINT_VALUES)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key as Breakpoint);

  // Find the first breakpoint that matches
  for (const bp of sortedBreakpoints) {
    if (width >= BREAKPOINT_VALUES[bp] && responsiveValues[bp] !== undefined) {
      return responsiveValues[bp]!;
    }
  }

  // Fallback to the smallest available value or first value
  const availableValues = Object.values(responsiveValues).filter(v => v !== undefined);
  return availableValues[0] as T;
};

// ===========================================
// CONTAINER QUERIES UTILITIES
// ===========================================

export const CONTAINER_SIZES = {
  xs: '20rem',    // 320px
  sm: '24rem',    // 384px
  md: '28rem',    // 448px
  lg: '32rem',    // 512px
  xl: '36rem',    // 576px
  '2xl': '42rem', // 672px
  '3xl': '48rem', // 768px
  '4xl': '56rem', // 896px
  '5xl': '64rem', // 1024px
  '6xl': '72rem', // 1152px
  '7xl': '80rem', // 1280px
} as const;

export type ContainerSize = keyof typeof CONTAINER_SIZES;

export const useContainerQuery = (size: ContainerSize) => {
  const [matches, setMatches] = useState(false);
  const containerRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const targetWidth = parseFloat(CONTAINER_SIZES[size]) * 16; // Convert rem to px
        setMatches(width >= targetWidth);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [size]);

  return { containerRef, matches };
};

// ===========================================
// RESPONSIVE GRID SYSTEM
// ===========================================

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface ResponsiveGridProps {
  cols?: ResponsiveProp<GridColumns>;
  gap?: ResponsiveProp<'sm' | 'md' | 'lg' | 'xl'>;
  className?: string;
}

export const useResponsiveGrid = ({ cols = 1, gap = 'md' }: ResponsiveGridProps) => {
  const responsiveCols = useResponsiveProp(cols);
  const responsiveGap = useResponsiveProp(gap);

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    8: 'grid-cols-8',
    10: 'grid-cols-10',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return `grid ${gridClasses[responsiveCols]} ${gapClasses[responsiveGap]}`;
};

// ===========================================
// RESPONSIVE UTILITIES
// ===========================================

export const getResponsiveClasses = (
  property: string,
  values: Partial<Record<Breakpoint, string>>
): string => {
  const classes: string[] = [];

  Object.entries(values).forEach(([breakpoint, value]) => {
    if (value) {
      const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}${property}-${value}`);
    }
  });

  return classes.join(' ');
};

export const createResponsiveVariant = <T extends string>(
  values: Partial<Record<Breakpoint, T>>
): string => {
  return Object.entries(values)
    .map(([bp, value]) => bp === 'xs' ? value : `${bp}:${value}`)
    .join(' ');
};

// ===========================================
// PERFORMANCE OPTIMIZATIONS
// ===========================================

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ===========================================
// LAYOUT HELPERS
// ===========================================

export const getOptimalImageSize = (
  containerWidth: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): number => {
  return Math.ceil(containerWidth * devicePixelRatio);
};

export const generateSrcSet = (
  baseUrl: string,
  sizes: number[],
  format: string = 'webp'
): string => {
  return sizes
    .map(size => `${baseUrl}?w=${size}&f=${format} ${size}w`)
    .join(', ');
};

export const getResponsiveSizes = (breakpoints: Partial<Record<Breakpoint, string>>): string => {
  const sortedEntries = Object.entries(breakpoints)
    .sort(([a], [b]) => BREAKPOINT_VALUES[b as Breakpoint] - BREAKPOINT_VALUES[a as Breakpoint]);

  const sizeStrings = sortedEntries.map(([bp, size], index) => {
    if (index === sortedEntries.length - 1) {
      return size; // Last entry (smallest breakpoint) doesn't need media query
    }
    return `(min-width: ${BREAKPOINTS[bp as Breakpoint]}) ${size}`;
  });

  return sizeStrings.join(', ');
};
