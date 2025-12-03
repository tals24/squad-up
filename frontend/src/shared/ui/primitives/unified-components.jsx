/* ===================================================================
   UNIFIED COMPONENT SYSTEM
   Consistent Button, Card, and Form components with unified design
   =================================================================== */

import React from 'react';
import { cn } from "@/shared/lib/utils";
import { AlertCircle, Check, Info, AlertTriangle, X } from 'lucide-react';

// ===========================================
// UNIFIED BUTTON COMPONENTS
// ===========================================

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children,
  disabled,
  loading,
  icon,
  iconPosition = 'left',
  ...props 
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'relative overflow-hidden'
  ].join(' ');
  
  const variants = {
    primary: [
      'bg-primary-500 text-white border border-primary-500',
      'hover:bg-primary-600 hover:border-primary-600 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-primary-500',
      'active:bg-primary-700 active:translate-y-0'
    ].join(' '),
    
    secondary: [
      'bg-secondary-500 text-white border border-secondary-500',
      'hover:bg-secondary-600 hover:border-secondary-600 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-secondary-500',
      'active:bg-secondary-700 active:translate-y-0'
    ].join(' '),
    
    outline: [
      'bg-transparent text-primary-600 border-2 border-primary-500',
      'hover:bg-primary-500 hover:text-white hover:shadow-md hover:-translate-y-0.5',
      'focus:ring-primary-500',
      'active:bg-primary-600 active:translate-y-0'
    ].join(' '),
    
    ghost: [
      'bg-transparent text-neutral-700 border border-transparent',
      'hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm',
      'focus:ring-neutral-500',
      'active:bg-neutral-200'
    ].join(' '),
    
    destructive: [
      'bg-error-500 text-white border border-error-500',
      'hover:bg-error-600 hover:border-error-600 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-error-500',
      'active:bg-error-700 active:translate-y-0'
    ].join(' '),
    
    success: [
      'bg-success-500 text-white border border-success-500',
      'hover:bg-success-600 hover:border-success-600 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-success-500',
      'active:bg-success-700 active:translate-y-0'
    ].join(' '),
    
    warning: [
      'bg-warning-500 text-white border border-warning-500',
      'hover:bg-warning-600 hover:border-warning-600 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-warning-500',
      'active:bg-warning-700 active:translate-y-0'
    ].join(' ')
  };

  const sizes = {
    xs: 'h-7 px-2 text-xs rounded-md min-w-[2rem]',
    sm: 'h-8 px-3 text-sm rounded-md min-w-[3rem]',
    md: 'h-10 px-4 text-base rounded-lg min-w-[4rem]',
    lg: 'h-12 px-6 text-lg rounded-lg min-w-[5rem]',
    xl: 'h-14 px-8 text-xl rounded-xl min-w-[6rem]'
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    return icon;
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 transition-transform duration-700 hover:translate-x-full" />
      
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
});

Button.displayName = 'Button';

// Icon Button Variant
export const IconButton = React.forwardRef(({ 
  className, 
  variant = 'ghost', 
  size = 'md', 
  children,
  ...props 
}, ref) => {
  const iconSizes = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-7 h-7 p-1.5',
    md: 'w-8 h-8 p-2',
    lg: 'w-10 h-10 p-2.5',
    xl: 'w-12 h-12 p-3'
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn('rounded-full aspect-square', iconSizes[size], className)}
      {...props}
    >
      {children}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// ===========================================
// UNIFIED CARD COMPONENTS
// ===========================================

export const Card = React.forwardRef(({ 
  className,
  variant = 'default',
  hover = true,
  ...props 
}, ref) => {
  const baseClasses = [
    'rounded-xl border bg-white transition-all duration-200',
    'overflow-hidden'
  ].join(' ');

  const variants = {
    default: [
      'border-neutral-200 shadow-sm',
      hover ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-neutral-300' : ''
    ].join(' '),
    
    elevated: [
      'border-neutral-200 shadow-lg',
      hover ? 'hover:shadow-xl hover:-translate-y-1 hover:border-neutral-300' : ''
    ].join(' '),
    
    outlined: [
      'border-2 border-neutral-300 shadow-none',
      hover ? 'hover:border-primary-300 hover:shadow-sm' : ''
    ].join(' '),
    
    ghost: [
      'border-transparent bg-neutral-50 shadow-none',
      hover ? 'hover:bg-neutral-100 hover:shadow-sm' : ''
    ].join(' ')
  };

  return (
    <div
      ref={ref}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 border-b border-neutral-100', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ 
  className,
  level = 3,
  ...props 
}, ref) => {
  const Component = `h${level}`;
  
  const levels = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-semibold',
    5: 'text-base font-semibold',
    6: 'text-sm font-semibold'
  };

  return (
    <Component
      ref={ref}
      className={cn('leading-none tracking-tight text-neutral-900', levels[level], className)}
      {...props}
    />
  );
});

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500 leading-relaxed', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn('p-6', className)} 
    {...props} 
  />
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0 border-t border-neutral-100', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// ===========================================
// UNIFIED FORM COMPONENTS
// ===========================================

export const FormContainer = ({ 
  className,
  title,
  description,
  children,
  ...props 
}) => (
  <div className={cn('max-w-2xl mx-auto space-y-6', className)} {...props}>
    {(title || description) && (
      <div className="text-center space-y-2">
        {title && (
          <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        )}
        {description && (
          <p className="text-lg text-neutral-600">{description}</p>
        )}
      </div>
    )}
    <Card>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  </div>
);

export const FormSection = ({ 
  className,
  title,
  description,
  children,
  ...props 
}) => (
  <div className={cn('space-y-4', className)} {...props}>
    {(title || description) && (
      <div className="space-y-1">
        {title && (
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-neutral-600">{description}</p>
        )}
      </div>
    )}
    {children}
  </div>
);

export const FormGrid = ({ 
  className,
  columns = 1,
  gap = 'md',
  children,
  ...props 
}) => {
  const gaps = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div 
      className={cn('grid', cols[columns], gaps[gap], className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export const FormField = ({ 
  className,
  label,
  description,
  error,
  required,
  children,
  ...props 
}) => (
  <div className={cn('space-y-2', className)} {...props}>
    {label && (
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    )}
    {description && (
      <p className="text-sm text-neutral-500">{description}</p>
    )}
    {children}
    {error && (
      <p className="text-sm text-error-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export const Input = React.forwardRef(({ 
  className, 
  type = 'text', 
  size = 'md',
  error,
  ...props 
}, ref) => {
  const baseClasses = [
    'flex w-full rounded-lg border bg-white px-3 text-neutral-900',
    'placeholder:text-neutral-500',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
    'transition-colors duration-200'
  ].join(' ');
  
  const sizes = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  const stateClasses = error 
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20';

  return (
    <input
      type={type}
      className={cn(baseClasses, sizes[size], stateClasses, className)}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ 
  className, 
  size = 'md',
  error,
  rows = 4,
  ...props 
}, ref) => {
  const baseClasses = [
    'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-neutral-900',
    'placeholder:text-neutral-500 resize-vertical',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
    'transition-colors duration-200'
  ].join(' ');
  
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const stateClasses = error 
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20';

  return (
    <textarea
      rows={rows}
      className={cn(baseClasses, sizes[size], stateClasses, className)}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ 
  className, 
  size = 'md',
  error,
  children,
  placeholder = "Select an option",
  ...props 
}, ref) => {
  const baseClasses = [
    'flex w-full rounded-lg border bg-white px-3 text-neutral-900',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
    'transition-colors duration-200',
    'appearance-none bg-no-repeat bg-right bg-[length:16px] pr-8',
    'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")]'
  ].join(' ');
  
  const sizes = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  const stateClasses = error 
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20';

  return (
    <select
      className={cn(baseClasses, sizes[size], stateClasses, className)}
      ref={ref}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
});

Select.displayName = 'Select';

// ===========================================
// FORM ALERT COMPONENTS
// ===========================================

export const FormAlert = ({ 
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props 
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: <Check className="w-5 h-5 text-success-600" />
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: <AlertTriangle className="w-5 h-5 text-warning-600" />
    },
    error: {
      container: 'bg-error-50 border-error-200 text-error-800',
      icon: <AlertCircle className="w-5 h-5 text-error-600" />
    }
  };

  const { container, icon } = variants[variant];

  return (
    <div 
      className={cn('rounded-lg border p-4', container, className)}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h4 className="text-sm font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  FormContainer,
  FormSection,
  FormGrid,
  FormField,
  Input,
  Textarea,
  Select,
  FormAlert
};
