import React from 'react';

/**
 * PageLayout Component
 * Provides consistent page structure, background, and spacing across all pages
 */
const PageLayout = ({
  children,
  background = 'bg-slate-900',
  maxWidth = 'max-w-7xl',
  padding = 'p-6 md:p-8',
}) => {
  return (
    <div className={`${background} min-h-screen`}>
      <div className={`${maxWidth} mx-auto ${padding} space-y-8`}>{children}</div>
    </div>
  );
};

export default PageLayout;
