import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const CustomTooltip = ({ 
  children, 
  content, 
  side = 'top',
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
  };

  const arrowClasses = {
    top: '-bottom-1 left-1/2 transform -translate-x-1/2 border-t-0 border-l-0',
    bottom: '-top-1 left-1/2 transform -translate-x-1/2 border-b-0 border-r-0',
    left: '-right-1 top-1/2 transform -translate-y-1/2 border-l-0 border-b-0',
    right: '-left-1 top-1/2 transform -translate-y-1/2 border-r-0 border-t-0',
  };

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  if (!content) return children;

  return (
    <div 
      className="relative inline-block" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            // Base tooltip styles using design system
            'absolute w-max max-w-xs p-3 text-sm rounded-lg z-50',
            'bg-neutral-900 text-white border border-neutral-700',
            'shadow-lg pointer-events-none opacity-95',
            'transition-opacity duration-200',
            positionClasses[side] || positionClasses.top,
            className
          )}
        >
          {content}
          {/* Arrow/pointer using design system colors */}
          <div 
            className={cn(
              'absolute w-2 h-2 bg-neutral-900 border border-neutral-700 rotate-45',
              arrowClasses[side] || arrowClasses.top
            )}
          />
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;