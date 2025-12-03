/**
 * SquadUp Theme Components
 * 
 * Modern, consistent UI components built on our centralized theme system.
 * These components replace all existing implementations with a unified approach.
 */

import React from 'react';
import { cn } from "@/shared/lib/utils";
import { theme } from "@/shared/lib/theme";
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

// ===========================================
// BUTTON COMPONENTS
// ===========================================

const buttonVariants = cva(
  // Base styles using theme tokens
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all 
   duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        // Primary button - main CTAs
        primary: `
          bg-primary-500 text-white shadow-sm hover:bg-primary-600 
          focus-visible:ring-primary-500 active:bg-primary-700
        `,
        // Secondary button - secondary actions
        secondary: `
          bg-secondary-500 text-white shadow-sm hover:bg-secondary-600 
          focus-visible:ring-secondary-500 active:bg-secondary-700
        `,
        // Outline button - tertiary actions
        outline: `
          border border-neutral-300 bg-white text-neutral-700 shadow-sm 
          hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-500
        `,
        // Ghost button - minimal actions
        ghost: `
          text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 
          focus-visible:ring-neutral-500
        `,
        // Destructive button - dangerous actions
        destructive: `
          bg-error-500 text-white shadow-sm hover:bg-error-600 
          focus-visible:ring-error-500 active:bg-error-700
        `,
        // Link button - navigation
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

export const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

// Icon Button variant
export const IconButton = React.forwardRef(({
  className,
  variant = 'ghost',
  size = 'md',
  ...props
}, ref) => {
  const sizeClasses = {
    xs: 'h-8 w-8',
    sm: 'h-9 w-9', 
    md: 'h-10 w-10',
    lg: 'h-11 w-11',
    xl: 'h-12 w-12',
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn('p-0', sizeClasses[size], className)}
      {...props}
    />
  );
});

IconButton.displayName = 'IconButton';

// ===========================================
// INPUT COMPONENTS
// ===========================================

const inputVariants = cva(
  `flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors
   file:border-0 file:bg-transparent file:text-sm file:font-medium
   placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 
   focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: `
          border-neutral-300 focus-visible:border-primary-500 
          focus-visible:ring-primary-500
        `,
        error: `
          border-error-500 focus-visible:border-error-500 
          focus-visible:ring-error-500
        `,
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const Input = React.forwardRef(({
  className,
  variant,
  size,
  type = 'text',
  ...props
}, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

// Textarea Component
export const Textarea = React.forwardRef(({
  className,
  variant = 'default',
  ...props
}, ref) => {
  return (
    <textarea
      className={cn(
        `flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm transition-colors
         placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical`,
        variant === 'error' 
          ? 'border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500'
          : 'border-neutral-300 bg-white focus-visible:border-primary-500 focus-visible:ring-primary-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

// ===========================================
// CARD COMPONENTS
// ===========================================

const cardVariants = cva(
  'rounded-xl border bg-white text-neutral-950 shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-neutral-200',
        elevated: 'border-neutral-200 shadow-lg',
        outline: 'border-neutral-300',
        ghost: 'border-transparent shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'none',
    },
  }
);

export const Card = React.forwardRef(({
  className,
  variant,
  padding,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, padding, className }))}
    {...props}
  />
));

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight text-neutral-900', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// ===========================================
// BADGE COMPONENTS
// ===========================================

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80',
        primary: 'bg-primary-100 text-primary-800 hover:bg-primary-100/80',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-100/80',
        success: 'bg-success-50 text-success-700 hover:bg-success-50/80',
        warning: 'bg-warning-50 text-warning-700 hover:bg-warning-50/80',
        error: 'bg-error-50 text-error-700 hover:bg-error-50/80',
        outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const Badge = React.forwardRef(({
  className,
  variant,
  size,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

// ===========================================
// ALERT COMPONENTS
// ===========================================

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-white border-neutral-200 text-neutral-900',
        success: 'bg-success-50 border-success-200 text-success-800',
        warning: 'bg-warning-50 border-warning-200 text-warning-800',
        error: 'bg-error-50 border-error-200 text-error-800',
        info: 'bg-info-50 border-info-200 text-info-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const Alert = React.forwardRef(({
  className,
  variant,
  ...props
}, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));

Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));

AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';

// ===========================================
// TYPOGRAPHY COMPONENTS
// ===========================================

const headingVariants = cva('font-semibold text-neutral-900', {
  variants: {
    level: {
      1: 'text-4xl font-bold lg:text-5xl',
      2: 'text-3xl font-semibold lg:text-4xl',
      3: 'text-2xl font-semibold lg:text-3xl',
      4: 'text-xl font-semibold lg:text-2xl',
      5: 'text-lg font-semibold lg:text-xl',
      6: 'text-base font-semibold lg:text-lg',
    },
  },
  defaultVariants: {
    level: 1,
  },
});

export const Heading = React.forwardRef(({
  className,
  level = 1,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : `h${level}`;
  
  return (
    <Comp
      ref={ref}
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
});

Heading.displayName = 'Heading';

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-base text-neutral-700 leading-relaxed',
      caption: 'text-sm text-neutral-500 uppercase tracking-wide font-medium',
      small: 'text-sm text-neutral-600',
      large: 'text-lg text-neutral-700',
      muted: 'text-neutral-500',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

export const Text = React.forwardRef(({
  className,
  variant,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'p';
  
  return (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
});

Text.displayName = 'Text';

// ===========================================
// LAYOUT COMPONENTS
// ===========================================

export const Container = React.forwardRef(({
  className,
  size = 'lg',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      ref={ref}
      className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    />
  );
});

Container.displayName = 'Container';

export const Section = React.forwardRef(({
  className,
  padding = 'md',
  ...props
}, ref) => {
  const paddingClasses = {
    none: 'py-0',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-20',
  };

  return (
    <section
      ref={ref}
      className={cn(paddingClasses[padding], className)}
      {...props}
    />
  );
});

Section.displayName = 'Section';

// ===========================================
// FORM COMPONENTS
// ===========================================

export const FormContainer = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-6', className)}
    {...props}
  />
));

FormContainer.displayName = 'FormContainer';

export const FormSection = React.forwardRef(({ 
  className, 
  title, 
  description,
  children,
  ...props 
}, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props}>
    {(title || description) && (
      <div className="space-y-1">
        {title && (
          <Heading level={4} className="text-lg font-medium text-neutral-900">
            {title}
          </Heading>
        )}
        {description && (
          <Text variant="small" className="text-neutral-600">
            {description}
          </Text>
        )}
      </div>
    )}
    {children}
  </div>
));

FormSection.displayName = 'FormSection';

export const FormField = React.forwardRef(({
  className,
  label,
  error,
  helpText,
  required,
  children,
  ...props
}, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props}>
    {label && (
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {helpText && (
      <Text variant="small" className="text-neutral-500">
        {helpText}
      </Text>
    )}
    {error && (
      <Text variant="small" className="text-error-600">
        {error}
      </Text>
    )}
  </div>
));

FormField.displayName = 'FormField';

export const FormGrid = React.forwardRef(({
  className,
  cols = 1,
  gap = 'md',
  ...props
}, ref) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div
      ref={ref}
      className={cn('grid', colClasses[cols], gapClasses[gap], className)}
      {...props}
    />
  );
});

FormGrid.displayName = 'FormGrid';

// ===========================================
// LOADING COMPONENTS
// ===========================================

export const Spinner = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500',
        sizeClasses[size],
        className
      )}
    />
  );
};

Spinner.displayName = 'Spinner';

// ===========================================
// EXPORTS
// ===========================================

export {
  // Re-export shadcn components that don't need customization
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from './dialog';

export { Label } from './label';
export { Checkbox } from './checkbox';
export { Popover, PopoverContent, PopoverTrigger } from './popover';

// Custom Select components (keeping existing implementation)
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
