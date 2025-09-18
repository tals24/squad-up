import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * StandardButton Component
 * Provides consistent button styling across the application
 */
const StandardButton = ({ 
  children,
  variant = "primary", // primary, secondary, outline, ghost
  size = "default", // default, sm, lg, icon
  icon,
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20";
      case "secondary":
        return "bg-slate-700 text-white hover:bg-slate-600 transition-all duration-300";
      case "outline":
        return "border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-400 transition-all duration-300";
      case "ghost":
        return "text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400 transition-all duration-300";
      default:
        return "bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20";
    }
  };

  return (
    <Button 
      className={`flex items-center gap-2 ${getVariantClasses()} ${className}`}
      size={size}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
};

export default StandardButton;
