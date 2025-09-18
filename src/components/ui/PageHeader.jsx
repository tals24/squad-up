import React from 'react';

/**
 * PageHeader Component
 * Provides consistent page header structure with title, subtitle, and action button
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  accentWord, 
  accentColor = "text-cyan-400",
  actionButton,
  breadcrumbs,
  className = ""
}) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${className}`}>
      <div>
        {breadcrumbs && (
          <div className="mb-2">
            {breadcrumbs}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {title} {accentWord && <span className={accentColor}>{accentWord}</span>}
        </h1>
        <p className="text-slate-400 text-lg font-mono">{subtitle}</p>
      </div>
      {actionButton && (
        <div className="flex items-center gap-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
