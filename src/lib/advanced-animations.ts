/**
 * SquadUp Advanced Animation System
 * 
 * Shared element transitions, SVG animations, and performance-optimized
 * motion choreographies for Phase 4 enhancements.
 */

import { Variants, Transition, MotionValue, useMotionValue, useTransform } from 'framer-motion';
import { theme } from "@/shared/lib/theme";

// ===========================================
// SHARED ELEMENT TRANSITIONS
// ===========================================

export interface SharedElementConfig {
  layoutId: string;
  type?: 'card' | 'image' | 'text' | 'icon' | 'button';
  duration?: number;
  ease?: string | number[];
}

export const createSharedElementVariants = (config: SharedElementConfig): Variants => {
  const { type = 'card', duration = 0.5 } = config;
  
  const typeConfigs = {
    card: {
      initial: { opacity: 0, scale: 0.9, borderRadius: 12 },
      animate: { opacity: 1, scale: 1, borderRadius: 12 },
      exit: { opacity: 0, scale: 0.9, borderRadius: 12 },
    },
    image: {
      initial: { opacity: 0, scale: 1.1 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    text: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    icon: {
      initial: { opacity: 0, rotate: -180, scale: 0.5 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 180, scale: 0.5 },
    },
    button: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
  };

  const baseVariants = typeConfigs[type];
  const transition: Transition = {
    duration,
    ease: [0.25, 0.46, 0.45, 0.94], // Smooth ease-out
    layout: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
  };

  return {
    initial: baseVariants.initial,
    animate: { ...baseVariants.animate, transition },
    exit: { ...baseVariants.exit, transition },
  };
};

// ===========================================
// SVG ANIMATION UTILITIES
// ===========================================

export interface SVGAnimationConfig {
  duration?: number;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  ease?: string | number[];
}

export const createSVGDrawVariants = (config: SVGAnimationConfig = {}): Variants => {
  const { duration = 2, delay = 0, repeat = 0 } = config;
  
  return {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration, delay, ease: "easeInOut", repeat },
        opacity: { duration: 0.3, delay },
      },
    },
  };
};

export const createSVGFillVariants = (config: SVGAnimationConfig = {}): Variants => {
  const { duration = 1, delay = 0 } = config;
  
  return {
    hidden: {
      fill: "transparent",
      scale: 0.8,
    },
    visible: {
      fill: "currentColor",
      scale: 1,
      transition: {
        fill: { duration, delay },
        scale: { duration: 0.5, delay, ease: "backOut" },
      },
    },
  };
};

export const createSVGMorphVariants = (paths: string[]): Variants => {
  const variants: Record<string, any> = {};
  
  paths.forEach((path, index) => {
    variants[`shape${index}`] = {
      d: path,
      transition: { duration: 0.8, ease: "easeInOut" },
    };
  });
  
  return variants;
};

// ===========================================
// MOTION CHOREOGRAPHY PATTERNS
// ===========================================

export const createStaggeredListVariants = (itemCount: number): Variants => {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
  };
};

export const createGridChoreography = (columns: number, rows: number): Variants => {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };
};

export const createWaveAnimationVariants = (): Variants => {
  return {
    wave: {
      y: [0, -20, 0],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.1,
      },
    },
  };
};

// ===========================================
// PERFORMANCE-OPTIMIZED ANIMATIONS
// ===========================================

export const createGPUAnimationVariants = (): Variants => {
  return {
    initial: {
      opacity: 0,
      transform: "translate3d(0, 20px, 0) scale(0.95)",
    },
    animate: {
      opacity: 1,
      transform: "translate3d(0, 0, 0) scale(1)",
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      transform: "translate3d(0, -20px, 0) scale(0.95)",
      transition: {
        duration: 0.3,
        ease: [0.55, 0.085, 0.68, 0.53],
      },
    },
  };
};

// ===========================================
// SCROLL-TRIGGERED ANIMATIONS
// ===========================================

export const useScrollProgress = (): MotionValue<number> => {
  const scrollY = useMotionValue(0);
  
  React.useEffect(() => {
    const updateScrollY = () => scrollY.set(window.scrollY);
    
    window.addEventListener('scroll', updateScrollY);
    return () => window.removeEventListener('scroll', updateScrollY);
  }, [scrollY]);
  
  return scrollY;
};

export const useParallax = (offset: number = 50): MotionValue<string> => {
  const scrollY = useScrollProgress();
  return useTransform(scrollY, [0, 1000], [`0px`, `${offset}px`]);
};

export const createScrollRevealVariants = (): Variants => {
  return {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };
};

// ===========================================
// COMPLEX TRANSITION ORCHESTRATION
// ===========================================

export interface TransitionOrchestrator {
  name: string;
  transitions: Array<{
    element: string;
    delay: number;
    duration: number;
    variants: Variants;
  }>;
}

export const createPageTransitionOrchestrator = (): TransitionOrchestrator => {
  return {
    name: 'pageTransition',
    transitions: [
      {
        element: 'header',
        delay: 0,
        duration: 0.4,
        variants: {
          initial: { opacity: 0, y: -30 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -30 },
        },
      },
      {
        element: 'sidebar',
        delay: 0.1,
        duration: 0.5,
        variants: {
          initial: { opacity: 0, x: -50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
        },
      },
      {
        element: 'content',
        delay: 0.2,
        duration: 0.6,
        variants: {
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 50 },
        },
      },
    ],
  };
};

// ===========================================
// ACCESSIBILITY-AWARE ANIMATIONS
// ===========================================

export const useReducedMotionVariants = <T extends Variants>(
  normalVariants: T,
  reducedVariants?: Partial<T>
): T => {
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return {
      ...normalVariants,
      ...reducedVariants,
      animate: {
        ...normalVariants.animate,
        ...reducedVariants?.animate,
        transition: { duration: 0.01 },
      },
    } as T;
  }

  return normalVariants;
};

// ===========================================
// ANIMATION PERFORMANCE MONITORING
// ===========================================

export class AnimationPerformanceMonitor {
  private static instance: AnimationPerformanceMonitor;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private isMonitoring = false;

  static getInstance(): AnimationPerformanceMonitor {
    if (!AnimationPerformanceMonitor.instance) {
      AnimationPerformanceMonitor.instance = new AnimationPerformanceMonitor();
    }
    return AnimationPerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.monitorFrame();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  getFPS(): number {
    return this.fps;
  }

  private monitorFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;
    
    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Log performance warnings
      if (this.fps < 50) {
        console.warn(`Animation performance warning: ${this.fps} FPS`);
      }
    }
    
    this.frameCount++;
    requestAnimationFrame(this.monitorFrame);
  };
}

export default {
  createSharedElementVariants,
  createSVGDrawVariants,
  createSVGFillVariants,
  createSVGMorphVariants,
  createStaggeredListVariants,
  createGridChoreography,
  createWaveAnimationVariants,
  createGPUAnimationVariants,
  useScrollProgress,
  useParallax,
  createScrollRevealVariants,
  createPageTransitionOrchestrator,
  useReducedMotionVariants,
  AnimationPerformanceMonitor,
};
