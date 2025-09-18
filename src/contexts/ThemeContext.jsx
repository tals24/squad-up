/**
 * SquadUp Theme Context
 * 
 * React context for managing dark mode state and theme switching
 * with persistence and system preference detection.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getStoredTheme, 
  setStoredTheme, 
  getSystemTheme, 
  getResolvedTheme, 
  applyTheme 
} from '@/lib/dark-mode';

// ===========================================
// THEME CONTEXT
// ===========================================

const ThemeContext = createContext({
  mode: 'system',
  resolvedTheme: 'light',
  setMode: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ===========================================
// THEME PROVIDER
// ===========================================

export const ThemeProvider = ({ children, defaultTheme = 'system' }) => {
  const [mode, setModeState] = useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [isClient, setIsClient] = useState(false);

  // Initialize theme from localStorage on client side
  useEffect(() => {
    setIsClient(true);
    const storedTheme = getStoredTheme();
    setModeState(storedTheme);
    const resolved = getResolvedTheme(storedTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (mode === 'system') {
        const newResolvedTheme = getSystemTheme();
        setResolvedTheme(newResolvedTheme);
        applyTheme(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, isClient]);

  // Update resolved theme when mode changes
  useEffect(() => {
    if (!isClient) return;

    const newResolvedTheme = getResolvedTheme(mode);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
  }, [mode, isClient]);

  const setMode = (newMode) => {
    setModeState(newMode);
    setStoredTheme(newMode);
  };

  const toggleTheme = () => {
    if (mode === 'system') {
      // If system, toggle to opposite of current resolved theme
      setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If explicit mode, toggle to opposite
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  };

  const value = {
    mode,
    resolvedTheme,
    setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ===========================================
// THEME TOGGLE BUTTON COMPONENT
// ===========================================

import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-components';

export const ThemeToggle = ({ variant = 'ghost', size = 'md', showLabel = false }) => {
  const { mode, resolvedTheme, setMode } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: 'Light',
    dark: 'Dark',  
    system: 'System',
  };

  const nextMode = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  };

  const CurrentIcon = icons[mode];

  const handleToggle = () => {
    setMode(nextMode[mode]);
  };

  return (
    <AnimatedButton
      variant={variant}
      size={size}
      onClick={handleToggle}
      aria-label={`Switch to ${labels[nextMode[mode]]} theme`}
      className="relative"
    >
      <motion.div
        initial={false}
        animate={{ scale: 1, rotate: 0 }}
        whileTap={{ scale: 0.95, rotate: 180 }}
        transition={{ duration: 0.2 }}
      >
        <CurrentIcon className="h-4 w-4" />
      </motion.div>
      {showLabel && (
        <span className="ml-2">
          {labels[mode]}
        </span>
      )}
    </AnimatedButton>
  );
};

// ===========================================
// THEME SELECTOR DROPDOWN
// ===========================================

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/design-system-components';

export const ThemeSelector = ({ className }) => {
  const { mode, setMode } = useTheme();

  return (
    <Select value={mode} onValueChange={setMode}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {mode === 'light' && <Sun className="h-4 w-4" />}
          {mode === 'dark' && <Moon className="h-4 w-4" />}
          {mode === 'system' && <Monitor className="h-4 w-4" />}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Light
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
