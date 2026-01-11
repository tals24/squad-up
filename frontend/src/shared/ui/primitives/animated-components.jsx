/**
 * SquadUp Animated Components
 *
 * Enhanced UI components with Framer Motion animations, micro-interactions,
 * and improved accessibility for Phase 3 of the design system.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { theme } from '@/shared/lib/theme';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ===========================================
// ANIMATED BUTTON COMPONENT
// ===========================================

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
   transition-all duration-200 ease-out`,
  {
    variants: {
      variant: {
        primary: `
          bg-primary-500 text-white shadow-sm hover:bg-primary-600 
          focus-visible:ring-primary-500 active:bg-primary-700
          hover:shadow-md active:shadow-sm
        `,
        secondary: `
          bg-secondary-500 text-white shadow-sm hover:bg-secondary-600 
          focus-visible:ring-secondary-500 active:bg-secondary-700
          hover:shadow-md active:shadow-sm
        `,
        outline: `
          border border-neutral-300 bg-white text-neutral-700 shadow-sm 
          hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-500
          hover:shadow-md
        `,
        ghost: `
          text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 
          focus-visible:ring-neutral-500
        `,
        destructive: `
          bg-error-500 text-white shadow-sm hover:bg-error-600 
          focus-visible:ring-error-500 active:bg-error-700
          hover:shadow-md active:shadow-sm
        `,
        link: `
          text-primary-500 underline-offset-4 hover:underline focus-visible:ring-primary-500
        `,
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const AnimatedButton = React.forwardRef(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : motion.button;
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        initial="initial"
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        whileFocus="focus"
        variants={theme.animations.buttonVariants}
        aria-disabled={isDisabled}
        {...props}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Comp>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// ===========================================
// ANIMATED CARD COMPONENT
// ===========================================

const cardVariants = cva(
  `rounded-xl border bg-white shadow-sm transition-all duration-200 ease-out
   hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2`,
  {
    variants: {
      variant: {
        default: 'border-neutral-200',
        elevated: 'border-neutral-200 shadow-lg',
        outlined: 'border-2 border-neutral-300',
        ghost: 'border-transparent shadow-none',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-neutral-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
);

export const AnimatedCard = React.forwardRef(
  ({ className, variant, padding, interactive = false, children, onClick, ...props }, ref) => {
    const isInteractive = interactive || !!onClick;

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive: isInteractive }), className)}
        onClick={onClick}
        initial="initial"
        whileHover={isInteractive ? 'hover' : undefined}
        whileTap={isInteractive ? 'tap' : undefined}
        variants={theme.animations.cardVariants}
        tabIndex={isInteractive ? 0 : undefined}
        role={isInteractive ? 'button' : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// ===========================================
// ANIMATED INPUT COMPONENT
// ===========================================

const inputVariants = cva(
  `w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200
   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
   disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50
   placeholder:text-neutral-400`,
  {
    variants: {
      variant: {
        default: 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500',
        error:
          'border-error-500 hover:border-error-600 focus:border-error-500 focus:ring-error-500',
        success:
          'border-success-500 hover:border-success-600 focus:border-success-500 focus:ring-success-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const AnimatedInput = React.forwardRef(
  ({ className, variant, size, error, ...props }, ref) => {
    const inputVariant = error ? 'error' : variant;

    return (
      <motion.input
        ref={ref}
        className={cn(inputVariants({ variant: inputVariant, size }), className)}
        initial="initial"
        whileFocus="focus"
        variants={theme.animations.focusVariants}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

// ===========================================
// LOADING SPINNER COMPONENT
// ===========================================

export const LoadingSpinner = React.forwardRef(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <motion.div ref={ref} className={cn('flex items-center justify-center', className)} {...props}>
      <motion.div
        className={cn(
          'border-2 border-primary-200 border-t-primary-500 rounded-full',
          sizeClasses[size]
        )}
        variants={theme.animations.spinnerVariants}
        animate="animate"
      />
    </motion.div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// ===========================================
// ANIMATED ALERT COMPONENT
// ===========================================

const alertVariants = cva(`relative w-full rounded-lg border p-4 transition-all duration-200`, {
  variants: {
    variant: {
      default: 'bg-neutral-50 border-neutral-200 text-neutral-900',
      destructive: 'bg-error-50 border-error-200 text-error-900',
      success: 'bg-success-50 border-success-200 text-success-900',
      warning: 'bg-warning-50 border-warning-200 text-warning-900',
      info: 'bg-info-50 border-info-200 text-info-900',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const alertIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

export const AnimatedAlert = React.forwardRef(
  ({ className, variant = 'default', title, children, icon: CustomIcon, ...props }, ref) => {
    const Icon = CustomIcon || alertIcons[variant];

    return (
      <motion.div
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
            </motion.div>
          )}
          <div className="flex-1 space-y-1">
            {title && (
              <motion.h5
                className="font-medium leading-none tracking-tight"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {title}
              </motion.h5>
            )}
            {children && (
              <motion.div
                className="text-sm opacity-90"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

AnimatedAlert.displayName = 'AnimatedAlert';

// ===========================================
// PAGE TRANSITION WRAPPER
// ===========================================

export const PageTransition = ({ children, className, ...props }) => {
  return (
    <motion.div
      className={cn('w-full', className)}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={theme.animations.pageVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ===========================================
// STAGGER CONTAINER FOR LISTS
// ===========================================

export const StaggerContainer = ({ children, className, ...props }) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={theme.animations.staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className, ...props }) => {
  return (
    <motion.div className={className} variants={theme.animations.staggerItem} {...props}>
      {children}
    </motion.div>
  );
};

// ===========================================
// ANIMATED MODAL/DIALOG WRAPPER
// ===========================================

export const AnimatedModalContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', className)}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={theme.animations.modalVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedModalContent.displayName = 'AnimatedModalContent';

// ===========================================
// ACCESSIBILITY FOCUS TRAP
// ===========================================

export const FocusTrap = ({ children, active = true }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Let parent handle escape
        container.dispatchEvent(new CustomEvent('escape'));
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
};
