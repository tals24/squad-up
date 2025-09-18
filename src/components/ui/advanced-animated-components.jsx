/**
 * SquadUp Advanced Animated Components
 * 
 * Phase 4 enhanced components with shared element transitions,
 * SVG animations, and performance-optimized motion patterns.
 */

import React, { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { theme } from '@/lib/theme';
import {
  createSharedElementVariants,
  createSVGDrawVariants,
  createSVGFillVariants,
  createStaggeredListVariants,
  createGridChoreography,
  useReducedMotionVariants,
  AnimationPerformanceMonitor,
} from '@/lib/advanced-animations';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

// ===========================================
// SHARED ELEMENT TRANSITION COMPONENTS
// ===========================================

export interface SharedElementProps {
  layoutId: string;
  type?: 'card' | 'image' | 'text' | 'icon' | 'button';
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  [key: string]: any;
}

export const SharedElement = forwardRef<HTMLDivElement, SharedElementProps>(({
  layoutId,
  type = 'card',
  className,
  children,
  onClick,
  ...props
}, ref) => {
  const variants = useReducedMotionVariants(
    createSharedElementVariants({ layoutId, type })
  );

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      onClick={onClick}
      style={{ transformOrigin: 'center' }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

SharedElement.displayName = 'SharedElement';

// ===========================================
// ADVANCED CARD WITH SHARED TRANSITIONS
// ===========================================

const advancedCardVariants = cva(
  `rounded-xl border bg-white shadow-sm transition-all duration-200 ease-out
   hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2
   dark:bg-neutral-800 dark:border-neutral-700`,
  {
    variants: {
      variant: {
        default: 'border-neutral-200 dark:border-neutral-700',
        elevated: 'border-neutral-200 shadow-lg dark:border-neutral-700',
        outlined: 'border-2 border-neutral-300 dark:border-neutral-600',
        ghost: 'border-transparent shadow-none',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface AdvancedCardProps {
  layoutId?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  onHover?: () => void;
  animationDelay?: number;
  enableParallax?: boolean;
}

export const AdvancedCard = forwardRef<HTMLDivElement, AdvancedCardProps>(({
  layoutId,
  variant,
  size,
  interactive = false,
  className,
  children,
  onClick,
  onHover,
  animationDelay = 0,
  enableParallax = false,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  const inViewRef = React.useRef(null);
  const isInView = useInView(inViewRef, { once: true, margin: "-100px" });

  const cardVariants = useReducedMotionVariants({
    hidden: {
      opacity: 0,
      y: enableParallax ? 50 : 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  const MotionComponent = layoutId ? motion.div : motion.div;

  return (
    <MotionComponent
      ref={ref}
      {...(layoutId && { layoutId })}
      className={cn(advancedCardVariants({ variant, size, interactive }), className)}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive ? "tap" : undefined}
      onClick={onClick}
      onHoverStart={() => {
        setIsHovered(true);
        onHover?.();
      }}
      onHoverEnd={() => setIsHovered(false)}
      style={{ transformOrigin: 'center bottom' }}
      {...props}
    >
      <div ref={inViewRef}>
        {children}
      </div>
    </MotionComponent>
  );
});

AdvancedCard.displayName = 'AdvancedCard';

// ===========================================
// SVG ANIMATED ICONS
// ===========================================

export interface AnimatedSVGIconProps {
  children: React.ReactNode;
  animationType?: 'draw' | 'fill' | 'scale' | 'rotate';
  duration?: number;
  delay?: number;
  trigger?: 'hover' | 'inView' | 'click' | 'immediate';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AnimatedSVGIcon: React.FC<AnimatedSVGIconProps> = ({
  children,
  animationType = 'draw',
  duration = 1,
  delay = 0,
  trigger = 'inView',
  className,
  size = 'md',
}) => {
  const [isTriggered, setIsTriggered] = useState(trigger === 'immediate');
  const [isHovered, setIsHovered] = useState(false);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variants = React.useMemo(() => {
    switch (animationType) {
      case 'draw':
        return createSVGDrawVariants({ duration, delay });
      case 'fill':
        return createSVGFillVariants({ duration, delay });
      case 'scale':
        return {
          hidden: { scale: 0, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: { duration, delay, ease: "backOut" },
          },
        };
      case 'rotate':
        return {
          hidden: { rotate: -180, opacity: 0 },
          visible: {
            rotate: 0,
            opacity: 1,
            transition: { duration, delay, ease: "easeOut" },
          },
        };
      default:
        return createSVGDrawVariants({ duration, delay });
    }
  }, [animationType, duration, delay]);

  useEffect(() => {
    if (trigger === 'inView' && isInView) {
      setIsTriggered(true);
    } else if (trigger === 'hover' && isHovered) {
      setIsTriggered(true);
    }
  }, [trigger, isInView, isHovered]);

  const handleClick = () => {
    if (trigger === 'click') {
      setIsTriggered(!isTriggered);
    }
  };

  return (
    <motion.svg
      ref={ref}
      className={cn(sizeClasses[size], className)}
      variants={variants}
      initial="hidden"
      animate={isTriggered ? "visible" : "hidden"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ overflow: 'visible' }}
    >
      {children}
    </motion.svg>
  );
};

// ===========================================
// CHOREOGRAPHED LIST CONTAINER
// ===========================================

export interface ChoreographedListProps {
  children: React.ReactNode;
  layout?: 'list' | 'grid';
  columns?: number;
  rows?: number;
  className?: string;
  staggerDelay?: number;
  animationDelay?: number;
}

export const ChoreographedList: React.FC<ChoreographedListProps> = ({
  children,
  layout = 'list',
  columns = 3,
  rows = 3,
  className,
  staggerDelay = 0.1,
  animationDelay = 0,
}) => {
  const variants = useReducedMotionVariants(
    layout === 'grid' 
      ? createGridChoreography(columns, rows)
      : createStaggeredListVariants(React.Children.count(children))
  );

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.95 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.4,
                delay: animationDelay + (index * staggerDelay),
                ease: [0.25, 0.46, 0.45, 0.94],
              },
            },
            exit: {
              opacity: 0,
              y: -20,
              scale: 0.95,
              transition: {
                duration: 0.3,
                delay: index * 0.05,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ===========================================
// PERFORMANCE-OPTIMIZED LOADING SPINNER
// ===========================================

export interface AdvancedSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'bars' | 'pulse';
  className?: string;
  color?: string;
}

export const AdvancedSpinner: React.FC<AdvancedSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  color = 'currentColor',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('rounded-full', sizeClasses[size])}
            style={{ backgroundColor: color }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 bg-current rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              height: ['8px', '24px', '8px'],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-full', sizeClasses[size], className)}
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  // Default spinner
  return (
    <motion.div
      className={cn(sizeClasses[size], className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <Loader2 className="w-full h-full" style={{ color }} />
    </motion.div>
  );
};

// ===========================================
// SCROLL-TRIGGERED REVEAL
// ===========================================

export interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  distance = 50,
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  className,
  once = true,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: `${-threshold * 100}%` });

  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const variants = useReducedMotionVariants({
    hidden: {
      opacity: 0,
      ...directionOffset[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

// ===========================================
// PERFORMANCE MONITOR COMPONENT
// ===========================================

export const AnimationPerformanceIndicator: React.FC = () => {
  const [fps, setFps] = useState(60);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const monitor = AnimationPerformanceMonitor.getInstance();
    monitor.startMonitoring();

    const interval = setInterval(() => {
      const currentFps = monitor.getFPS();
      setFps(currentFps);
      setIsVisible(currentFps < 50); // Show warning when FPS drops
    }, 1000);

    return () => {
      clearInterval(interval);
      monitor.stopMonitoring();
    };
  }, []);

  if (!isVisible && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <AnimatePresence>
      {(isVisible || process.env.NODE_ENV === 'development') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            'fixed bottom-4 right-4 px-3 py-2 rounded-lg text-sm font-mono z-50',
            fps >= 50 
              ? 'bg-success-500 text-white' 
              : 'bg-warning-500 text-white'
          )}
        >
          {fps} FPS
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  SharedElement,
  AdvancedCard,
  AnimatedSVGIcon,
  ChoreographedList,
  AdvancedSpinner,
  ScrollReveal,
  AnimationPerformanceIndicator,
};
