// Shared Utils - Barrel Export

// Navigation
export function createPageUrl(pageName) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

// Date utilities
export * from './date';

// Position utilities
export * from './positionUtils';

// Category colors
export * from './categoryColors';

