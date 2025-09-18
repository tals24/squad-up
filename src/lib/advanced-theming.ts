/**
 * SquadUp Advanced Theming System
 * 
 * Custom theme editor, scheduled themes, and dynamic runtime theme updates
 * for Phase 4 enhancements.
 */

import { colors as defaultColors } from './theme';
import { colors as darkColors } from './dark-mode';

// ===========================================
// THEME SCHEMA & TYPES
// ===========================================

export interface ColorPalette {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  neutral: Record<string, string>;
  success: Record<string, string>;
  warning: Record<string, string>;
  error: Record<string, string>;
  info: Record<string, string>;
  background: Record<string, string>;
  text: Record<string, string>;
  border: Record<string, string>;
}

export interface TypographyConfig {
  fontFamily: {
    sans: string[];
    mono: string[];
    display: string[];
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  spacing: Record<string, string>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author?: string;
    tags?: string[];
  };
}

export interface ThemeSchedule {
  id: string;
  name: string;
  enabled: boolean;
  rules: Array<{
    type: 'time' | 'date' | 'condition';
    condition: string;
    themeId: string;
    priority: number;
  }>;
}

// ===========================================
// THEME VALIDATION
// ===========================================

export class ThemeValidator {
  static validateColorPalette(colors: Partial<ColorPalette>): string[] {
    const errors: string[] = [];
    const requiredColorGroups = ['primary', 'secondary', 'neutral', 'background', 'text'];
    
    for (const group of requiredColorGroups) {
      if (!colors[group as keyof ColorPalette]) {
        errors.push(`Missing required color group: ${group}`);
        continue;
      }
      
      const colorGroup = colors[group as keyof ColorPalette];
      if (typeof colorGroup !== 'object') {
        errors.push(`Invalid color group format: ${group}`);
        continue;
      }
      
      // Validate hex color format
      for (const [shade, color] of Object.entries(colorGroup)) {
        if (typeof color !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
          errors.push(`Invalid color format in ${group}.${shade}: ${color}`);
        }
      }
    }
    
    return errors;
  }

  static validateAccessibility(colors: ColorPalette): string[] {
    const warnings: string[] = [];
    
    // Check contrast ratios
    const contrastChecks = [
      { bg: colors.background.primary, fg: colors.text.primary, context: 'primary text on primary background' },
      { bg: colors.background.secondary, fg: colors.text.secondary, context: 'secondary text on secondary background' },
      { bg: colors.primary['500'], fg: colors.text.inverse, context: 'inverse text on primary color' },
    ];
    
    for (const check of contrastChecks) {
      const ratio = this.calculateContrastRatio(check.bg, check.fg);
      if (ratio < 4.5) {
        warnings.push(`Low contrast ratio (${ratio.toFixed(2)}) for ${check.context}`);
      }
    }
    
    return warnings;
  }

  private static calculateContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// ===========================================
// THEME MANAGER
// ===========================================

export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, CustomTheme> = new Map();
  private schedules: Map<string, ThemeSchedule> = new Map();
  private activeThemeId: string | null = null;
  private schedulerInterval: number | null = null;
  private listeners: Set<(theme: CustomTheme | null) => void> = new Set();

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  constructor() {
    this.loadFromStorage();
    this.startScheduler();
  }

  // Theme CRUD operations
  addTheme(theme: CustomTheme): void {
    const errors = ThemeValidator.validateColorPalette(theme.colors);
    if (errors.length > 0) {
      throw new Error(`Theme validation failed: ${errors.join(', ')}`);
    }

    this.themes.set(theme.id, theme);
    this.saveToStorage();
  }

  getTheme(id: string): CustomTheme | null {
    return this.themes.get(id) || null;
  }

  getAllThemes(): CustomTheme[] {
    return Array.from(this.themes.values());
  }

  deleteTheme(id: string): boolean {
    const deleted = this.themes.delete(id);
    if (deleted) {
      if (this.activeThemeId === id) {
        this.activeThemeId = null;
      }
      this.saveToStorage();
    }
    return deleted;
  }

  // Theme activation
  setActiveTheme(id: string | null): void {
    if (id && !this.themes.has(id)) {
      throw new Error(`Theme not found: ${id}`);
    }

    this.activeThemeId = id;
    const theme = id ? this.themes.get(id) || null : null;
    this.applyTheme(theme);
    this.notifyListeners(theme);
    this.saveToStorage();
  }

  getActiveTheme(): CustomTheme | null {
    return this.activeThemeId ? this.themes.get(this.activeThemeId) || null : null;
  }

  // Theme creation helpers
  createThemeFromColors(
    name: string,
    colors: Partial<ColorPalette>,
    baseTheme?: CustomTheme
  ): CustomTheme {
    const base = baseTheme || this.createDefaultTheme();
    
    return {
      ...base,
      id: `custom-${Date.now()}`,
      name,
      colors: { ...base.colors, ...colors },
      metadata: {
        ...base.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  createDefaultTheme(): CustomTheme {
    return {
      id: 'default',
      name: 'Default Theme',
      colors: defaultColors as ColorPalette,
      typography: {
        fontFamily: {
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          mono: ['JetBrains Mono', 'Monaco', 'monospace'],
          display: ['Inter', 'sans-serif'],
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.625',
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0em',
          wide: '0.025em',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
      spacing: {
        0: '0px',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  // Theme application
  private applyTheme(theme: CustomTheme | null): void {
    if (!theme) {
      this.removeThemeVariables();
      return;
    }

    const root = document.documentElement;
    
    // Apply color variables
    this.applyColorVariables(root, theme.colors);
    
    // Apply typography variables
    this.applyTypographyVariables(root, theme.typography);
    
    // Apply other design tokens
    this.applyDesignTokenVariables(root, theme);
  }

  private applyColorVariables(root: HTMLElement, colors: ColorPalette): void {
    // Primary colors
    Object.entries(colors.primary).forEach(([shade, value]) => {
      root.style.setProperty(`--color-primary-${shade}`, value);
    });

    // Secondary colors
    Object.entries(colors.secondary).forEach(([shade, value]) => {
      root.style.setProperty(`--color-secondary-${shade}`, value);
    });

    // Neutral colors
    Object.entries(colors.neutral).forEach(([shade, value]) => {
      root.style.setProperty(`--color-neutral-${shade}`, value);
    });

    // Background colors
    Object.entries(colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-background-${key}`, value);
    });

    // Text colors
    Object.entries(colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });

    // Semantic colors
    ['success', 'warning', 'error', 'info'].forEach(semantic => {
      const colorGroup = colors[semantic as keyof ColorPalette];
      if (colorGroup) {
        Object.entries(colorGroup).forEach(([shade, value]) => {
          root.style.setProperty(`--color-${semantic}-${shade}`, value);
        });
      }
    });
  }

  private applyTypographyVariables(root: HTMLElement, typography: TypographyConfig): void {
    // Font families
    Object.entries(typography.fontFamily).forEach(([key, value]) => {
      root.style.setProperty(`--font-family-${key}`, value.join(', '));
    });

    // Font sizes
    Object.entries(typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Font weights
    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });

    // Line heights
    Object.entries(typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value);
    });

    // Letter spacing
    Object.entries(typography.letterSpacing).forEach(([key, value]) => {
      root.style.setProperty(`--letter-spacing-${key}`, value);
    });
  }

  private applyDesignTokenVariables(root: HTMLElement, theme: CustomTheme): void {
    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
  }

  private removeThemeVariables(): void {
    const root = document.documentElement;
    const styles = root.style;
    
    // Remove all custom theme variables
    for (let i = styles.length - 1; i >= 0; i--) {
      const property = styles[i];
      if (property.startsWith('--color-') || 
          property.startsWith('--font-') || 
          property.startsWith('--border-radius-') ||
          property.startsWith('--shadow-') ||
          property.startsWith('--spacing-')) {
        styles.removeProperty(property);
      }
    }
  }

  // Schedule management
  addSchedule(schedule: ThemeSchedule): void {
    this.schedules.set(schedule.id, schedule);
    this.saveToStorage();
  }

  getSchedule(id: string): ThemeSchedule | null {
    return this.schedules.get(id) || null;
  }

  getAllSchedules(): ThemeSchedule[] {
    return Array.from(this.schedules.values());
  }

  deleteSchedule(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Theme scheduling
  private startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    this.schedulerInterval = window.setInterval(() => {
      this.checkSchedules();
    }, 60000); // Check every minute
  }

  private checkSchedules(): void {
    const enabledSchedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.enabled)
      .sort((a, b) => b.rules[0]?.priority || 0 - a.rules[0]?.priority || 0);

    for (const schedule of enabledSchedules) {
      for (const rule of schedule.rules) {
        if (this.evaluateScheduleRule(rule)) {
          if (this.activeThemeId !== rule.themeId) {
            this.setActiveTheme(rule.themeId);
          }
          return; // Apply first matching rule
        }
      }
    }
  }

  private evaluateScheduleRule(rule: { type: string; condition: string; themeId: string }): boolean {
    const now = new Date();

    switch (rule.type) {
      case 'time':
        return this.evaluateTimeCondition(rule.condition, now);
      case 'date':
        return this.evaluateDateCondition(rule.condition, now);
      case 'condition':
        return this.evaluateCustomCondition(rule.condition);
      default:
        return false;
    }
  }

  private evaluateTimeCondition(condition: string, now: Date): boolean {
    // Format: "09:00-17:00" or "17:00-09:00" (overnight)
    const [start, end] = condition.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    if (startMinutes <= endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    } else {
      // Overnight range
      return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
    }
  }

  private evaluateDateCondition(condition: string, now: Date): boolean {
    // Format: "2023-12-25" or "12-25" (yearly)
    if (condition.includes('-')) {
      const parts = condition.split('-');
      if (parts.length === 2) {
        // Yearly condition
        const [month, day] = parts.map(Number);
        return now.getMonth() + 1 === month && now.getDate() === day;
      } else if (parts.length === 3) {
        // Specific date
        const [year, month, day] = parts.map(Number);
        return now.getFullYear() === year && 
               now.getMonth() + 1 === month && 
               now.getDate() === day;
      }
    }
    return false;
  }

  private evaluateCustomCondition(condition: string): boolean {
    // Custom conditions can be evaluated here
    // For now, return false for safety
    return false;
  }

  // Event listeners
  addListener(listener: (theme: CustomTheme | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(theme: CustomTheme | null): void {
    this.listeners.forEach(listener => listener(theme));
  }

  // Storage management
  private saveToStorage(): void {
    try {
      const data = {
        themes: Array.from(this.themes.entries()),
        schedules: Array.from(this.schedules.entries()),
        activeThemeId: this.activeThemeId,
      };
      localStorage.setItem('squadup-themes', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save themes to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('squadup-themes');
      if (data) {
        const parsed = JSON.parse(data);
        this.themes = new Map(parsed.themes || []);
        this.schedules = new Map(parsed.schedules || []);
        this.activeThemeId = parsed.activeThemeId || null;
        
        // Apply active theme
        if (this.activeThemeId) {
          const theme = this.themes.get(this.activeThemeId);
          if (theme) {
            this.applyTheme(theme);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load themes from storage:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    this.listeners.clear();
  }
}

export default {
  ThemeValidator,
  ThemeManager,
};
