import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/card';

/**
 * DataCard Component
 * Provides consistent card styling for data display across pages
 */
const DataCard = ({
  title,
  titleIcon,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  hover = true,
  ...props
}) => {
  const hoverClasses = hover
    ? 'hover:shadow-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300'
    : '';

  return (
    <Card
      className={`bg-slate-800/70 border-slate-700 shadow-xl backdrop-blur-sm ${hoverClasses} ${className}`}
      {...props}
    >
      {title && (
        <CardHeader className={headerClassName}>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            {titleIcon}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
};

export default DataCard;
