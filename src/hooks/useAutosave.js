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
 * @param {Function} config.shouldSkip - Optional function(data) to determine if autosave should be skipped. Receives the data object as parameter.
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
  const previousDataRef = useRef(null);
  const initializationTimeoutRef = useRef(null);

  useEffect(() => {
    // Skip on initial mount (wait for user changes)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Set previousDataRef to initial data to track changes from this point
      if (data) {
        previousDataRef.current = JSON.stringify(data);
      }
      // Mark initialization period (draft loading happens during this time)
      // After 1000ms, any changes are considered user edits
      // This gives time for draft/saved data to load via useEffect
      initializationTimeoutRef.current = setTimeout(() => {
        initializationTimeoutRef.current = null;
      }, 1000);
      console.log('🔍 [useAutosave] Initial mount, syncing previousDataRef with initial data. Initialization period: 1000ms');
      return;
    }

    // During initialization period, sync previousDataRef silently (this is draft/saved data loading)
    if (initializationTimeoutRef.current !== null) {
      const currentDataString = JSON.stringify(data);
      previousDataRef.current = currentDataString;
      console.log('🔍 [useAutosave] During initialization period, syncing previousDataRef silently (draft/saved data loading)');
      return;
    }

    // Skip if disabled
    if (!enabled) {
      console.log('🔍 [useAutosave] Skipping - disabled');
      return;
    }

    // Skip if data is empty/undefined
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      console.log('🔍 [useAutosave] Skipping - empty data');
      return;
    }

    // Check shouldSkip using the actual data parameter (not stale state)
    if (shouldSkip) {
      const skipResult = shouldSkip(data);
      if (skipResult) {
        console.log('🔍 [useAutosave] Skipping - shouldSkip returned true. Data:', data);
        return;
      }
    }

    // Compare current data with previous data - only trigger if data actually changed
    const currentDataString = JSON.stringify(data);
    if (previousDataRef.current === currentDataString) {
      // Data hasn't changed, skip autosave
      console.log('🔍 [useAutosave] Skipping - data unchanged');
      console.log('🔍 [useAutosave] Previous:', previousDataRef.current?.substring(0, 100));
      console.log('🔍 [useAutosave] Current:', currentDataString?.substring(0, 100));
      return;
    }
    
    console.log('✅ [useAutosave] Data changed, scheduling autosave in', debounceMs, 'ms');
    console.log('📋 [useAutosave] Changed data:', JSON.stringify(data, null, 2));
    
    // Store the data we're about to save (for comparison after save)
    const dataToSave = currentDataString;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);

    // Create new timer
    timerRef.current = setTimeout(async () => {
      console.log('🚀 [useAutosave] Executing autosave API call now...');
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
        
        // Only update previousDataRef AFTER successful save
        previousDataRef.current = dataToSave;
        setLastSavedAt(new Date());
        setIsAutosaving(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        console.error('❌ Error autosaving draft:', error);
        setAutosaveError(error.message);
        setIsAutosaving(false);
        
        // Don't update previousDataRef on error - allow retry
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
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, [data, endpoint, enabled, debounceMs, shouldSkip, onSuccess, onError]);

  return {
    isAutosaving,
    autosaveError,
    lastSavedAt
  };
}



