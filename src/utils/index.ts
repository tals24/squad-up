

export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export * from './positionUtils';
export * from './dateUtils';
export * from './gameUtils';
export * from './dashboardConstants';
export * from './drillLabUtils';