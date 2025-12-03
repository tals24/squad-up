/**
 * SquadUp Accessibility Utilities
 * 
 * Comprehensive accessibility helpers, WCAG 2.1 AA compliance utilities,
 * and assistive technology support.
 */

// ===========================================
// FOCUS MANAGEMENT
// ===========================================

export const focusElement = (element: HTMLElement | null): void => {
  if (!element) return;
  
  // Use setTimeout to ensure element is in DOM and visible
  setTimeout(() => {
    element.focus();
  }, 0);
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// ===========================================
// KEYBOARD NAVIGATION
// ===========================================

export const createKeyboardHandler = (handlers: Record<string, (e: KeyboardEvent) => void>) => {
  return (e: KeyboardEvent) => {
    const handler = handlers[e.key];
    if (handler) {
      handler(e);
    }
  };
};

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// ===========================================
// ARIA UTILITIES
// ===========================================

export const createAriaProps = (options: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  hidden?: boolean;
  role?: string;
  controls?: string;
  owns?: string;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: string;
}) => {
  const props: Record<string, any> = {};

  if (options.label) props['aria-label'] = options.label;
  if (options.labelledBy) props['aria-labelledby'] = options.labelledBy;
  if (options.describedBy) props['aria-describedby'] = options.describedBy;
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
  if (options.selected !== undefined) props['aria-selected'] = options.selected;
  if (options.disabled !== undefined) props['aria-disabled'] = options.disabled;
  if (options.required !== undefined) props['aria-required'] = options.required;
  if (options.invalid !== undefined) props['aria-invalid'] = options.invalid;
  if (options.hidden !== undefined) props['aria-hidden'] = options.hidden;
  if (options.role) props['role'] = options.role;
  if (options.controls) props['aria-controls'] = options.controls;
  if (options.owns) props['aria-owns'] = options.owns;
  if (options.live) props['aria-live'] = options.live;
  if (options.atomic !== undefined) props['aria-atomic'] = options.atomic;
  if (options.relevant) props['aria-relevant'] = options.relevant;

  return props;
};

// ===========================================
// COLOR CONTRAST UTILITIES
// ===========================================

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const isContrastCompliant = (
  color1: string, 
  color2: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

// ===========================================
// SCREEN READER UTILITIES
// ===========================================

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

export const createScreenReaderOnly = (text: string): HTMLElement => {
  const element = document.createElement('span');
  element.className = 'sr-only';
  element.textContent = text;
  return element;
};

// ===========================================
// MOTION ACCESSIBILITY
// ===========================================

export const respectsReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getMotionPreference = (): 'reduce' | 'no-preference' => {
  if (typeof window === 'undefined') return 'no-preference';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference';
};

export const createReducedMotionVariants = (
  normalVariants: any,
  reducedVariants: any = {}
) => {
  const prefersReducedMotion = respectsReducedMotion();
  
  if (prefersReducedMotion) {
    return {
      ...normalVariants,
      ...reducedVariants,
      // Override animations with instant transitions
      initial: reducedVariants.initial || normalVariants.initial,
      animate: {
        ...normalVariants.animate,
        ...reducedVariants.animate,
        transition: { duration: 0 },
      },
    };
  }
  
  return normalVariants;
};

// ===========================================
// VALIDATION AND ERROR HANDLING
// ===========================================

export const createValidationMessage = (
  fieldName: string,
  error: string | null,
  required: boolean = false
): {
  id: string;
  message: string;
  ariaProps: Record<string, any>;
} => {
  const id = `${fieldName}-error`;
  
  let message = '';
  if (error) {
    message = error;
  } else if (required) {
    message = `${fieldName} is required`;
  }
  
  return {
    id,
    message,
    ariaProps: {
      'aria-describedby': error ? id : undefined,
      'aria-invalid': !!error,
      'aria-required': required,
    },
  };
};

// ===========================================
// TOUCH AND MOBILE ACCESSIBILITY
// ===========================================

export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // 44px - WCAG minimum
  RECOMMENDED: 48, // 48px - Better UX
} as const;

export const ensureTouchTarget = (element: HTMLElement): void => {
  const rect = element.getBoundingClientRect();
  const minSize = TOUCH_TARGET_SIZE.MINIMUM;
  
  if (rect.width < minSize || rect.height < minSize) {
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
  }
};

// ===========================================
// FORM ACCESSIBILITY HELPERS
// ===========================================

export const createFormFieldIds = (fieldName: string) => ({
  input: `${fieldName}-input`,
  label: `${fieldName}-label`,
  description: `${fieldName}-description`,
  error: `${fieldName}-error`,
});

export const createFormFieldProps = (
  fieldName: string,
  options: {
    error?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
  } = {}
) => {
  const ids = createFormFieldIds(fieldName);
  const { error, description, required = false, disabled = false } = options;
  
  const describedBy = [];
  if (description) describedBy.push(ids.description);
  if (error) describedBy.push(ids.error);
  
  return {
    ids,
    inputProps: {
      id: ids.input,
      'aria-labelledby': ids.label,
      'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
      'aria-invalid': !!error,
      'aria-required': required,
      'aria-disabled': disabled,
    },
    labelProps: {
      id: ids.label,
      htmlFor: ids.input,
    },
    descriptionProps: {
      id: ids.description,
    },
    errorProps: {
      id: ids.error,
      role: 'alert',
      'aria-live': 'polite',
    },
  };
};

// ===========================================
// LANDMARKS AND NAVIGATION
// ===========================================

export const LANDMARK_ROLES = {
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  REGION: 'region',
} as const;

export const createSkipLink = (targetId: string, text: string = 'Skip to main content'): HTMLElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md';
  
  return skipLink;
};
