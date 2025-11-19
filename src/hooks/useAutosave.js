import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced autosave functionality
 * @param {Object} config
 * @param {Object} config.data - Data object to autosave
 * @param {string} config.endpoint - API endpoint URL
 * @param {boolean} config.enabled - Whether autosave is enabled
 * @param {number} config.debounceMs - Debounce delay in milliseconds (default: 2500)
 * @param {Function} config.onSuccess - Optional success callback
 * @param {Function} config.onError - Optional error callback
 * @param {Function} config.shouldSkip - Optional function to determine if autosave should be skipped
 * @returns {Object} { isAutosaving, autosaveError, lastSavedAt }
 */
export function useAutosave({
  data,
  endpoint,
  enabled = true,
  debounceMs = 2500,
  onSuccess,
  onError,
  shouldSkip
}) {
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount (wait for user changes)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if disabled or shouldSkip returns true
    if (!enabled || (shouldSkip && shouldSkip())) {
      return;
    }

    // Skip if data is empty/undefined
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);

    // Create new timer
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to save draft: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Draft autosaved successfully:', result);
        setLastSavedAt(new Date());
        setIsAutosaving(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        console.error('❌ Error autosaving draft:', error);
        setAutosaveError(error.message);
        setIsAutosaving(false);
        
        if (onError) {
          onError(error);
        }
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, endpoint, enabled, debounceMs, shouldSkip, onSuccess, onError]);

  return {
    isAutosaving,
    autosaveError,
    lastSavedAt
  };
}



