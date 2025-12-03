

export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

// Re-export from shared utils
export * from '@/shared/utils';

// Local utils
export * from './positionUtils';
export * from './gameUtils';
export * from './dashboardConstants';
export * from './drillLabUtils';