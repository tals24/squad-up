/* SquadUp Design System Components */
/* Modern, theme-based components built on TailwindCSS + shadcn/ui */

import React from 'react';
import { cn } from '@/shared/lib/utils';

// Import our new theme-based components
export {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Heading,
  Text,
  Container,
  Section,
  FormContainer,
  FormSection,
  FormField,
  FormGrid,
  Spinner,
  // Re-exported shadcn components
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
  Label,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './theme-components';

// ===========================================
// ADDITIONAL UTILITY COMPONENTS
// ===========================================

export const Divider = React.forwardRef(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    const orientations = {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full',
    };

    return (
      <div
        ref={ref}
        className={cn('bg-neutral-200', orientations[orientation], className)}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export const Grid = React.forwardRef(({ className, cols = 1, gap = 'md', ...props }, ref) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div ref={ref} className={cn('grid', colClasses[cols], gaps[gap], className)} {...props} />
  );
});

Grid.displayName = 'Grid';

// Export our new shared components
export { default as PageLayout } from './PageLayout';
export { default as PageHeader } from './PageHeader';
export { default as SearchFilter } from './SearchFilter';
export { default as StandardButton } from './StandardButton';
export { default as DataCard } from './DataCard';
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
