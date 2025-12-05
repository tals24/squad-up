/**
 * Utility functions for DrillLab operations
 */

export const DRILL_LAB_SAVE = 'DRILL_LAB_SAVE';

/**
 * Post message to parent window (for popup communication)
 */
export const postMessageToParent = (type, data) => {
  if (window.opener) {
    try {
      window.opener.postMessage({ type, data }, '*');
      console.log('[drillLabUtils] Posted message to parent:', type, data);
    } catch (error) {
      console.error('[drillLabUtils] Failed to post message to parent:', error);
    }
  }
};

/**
 * Close the current window (for popup)
 */
export const closeWindow = () => {
  if (window.opener) {
    try {
      window.close();
    } catch (error) {
      console.error('[drillLabUtils] Failed to close window:', error);
    }
  }
};

/**
 * Navigate back to library
 */
export const navigateToLibrary = (navigate, createPageUrl) => {
  if (window.opener) {
    closeWindow();
  } else {
    navigate(createPageUrl('DrillLibrary'));
  }
};

/**
 * Get drill mode display text
 */
export const getModeDisplayText = (mode, isReadOnly) => {
  if (isReadOnly) return 'View Mode';
  if (mode === 'create') return 'Create Mode';
  if (mode === 'edit') return 'Edit Mode';
  return 'Design Mode';
};

/**
 * Get drill mode color classes
 */
export const getModeColorClasses = (mode, isReadOnly) => {
  if (isReadOnly) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (mode === 'create') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (mode === 'edit') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
};

/**
 * Validate drill data
 */
export const validateDrillData = (drillData) => {
  if (!drillData) return { isValid: false, error: 'No drill data' };
  if (!Array.isArray(drillData.layoutData)) return { isValid: false, error: 'Invalid layout data' };
  return { isValid: true };
};

/**
 * Format drill elements for saving
 */
export const formatElementsForSave = (elements) => {
  if (!Array.isArray(elements)) return [];
  return elements.filter(element => element && typeof element === 'object');
};

