import { useState, useEffect } from 'react';
import { getDrills, updateDrill } from '@/features/drill-system/api';

export function useDrillLabData(drillId, mode, searchParams) {
  const [drillData, setDrillData] = useState({
    name: '',
    description: '',
    layoutData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDrillData = async () => {
      console.log('[useDrillLabData] Loading drill data. Mode:', mode, 'DrillId:', drillId);
      setIsLoading(true);
      setError(null);

      try {
        if (mode === 'create') {
          // Handle create mode with layout param
          const layoutParam = searchParams.get('layout');
          console.log(
            '[useDrillLabData] Create mode. layoutParam:',
            layoutParam ? 'present' : 'missing'
          );

          if (layoutParam) {
            try {
              const layoutElements = JSON.parse(layoutParam);
              setDrillData((prev) => ({
                ...prev,
                layoutData: Array.isArray(layoutElements) ? layoutElements : [],
              }));
              console.log(
                '[useDrillLabData] Loaded layout from param:',
                layoutElements.length,
                'elements'
              );
            } catch (e) {
              console.error('[useDrillLabData] Failed to parse layout param:', e);
              setError('Failed to load draft layout');
            }
          } else {
            // No layout param - start with empty drill data
            console.log(
              '[useDrillLabData] Create mode - no layout param, starting with empty data'
            );
            setDrillData({
              name: 'New Drill',
              description: '',
              layoutData: [],
            });
          }
        } else if (drillId) {
          // Load existing drill
          console.log('[useDrillLabData] Loading existing drill with ID:', drillId);
          const response = await getDrills();
          console.log('[useDrillLabData] getDrills response:', response);

          if (response?.success && response?.data) {
            const drill = response.data.find((d) => d._id === drillId);
            console.log('[useDrillLabData] Found drill:', drill);

            if (drill) {
              setDrillData({
                name: drill.drillName || 'Unknown Drill',
                description: drill.description || '',
                layoutData: drill.layoutData
                  ? Array.isArray(drill.layoutData)
                    ? drill.layoutData
                    : JSON.parse(drill.layoutData)
                  : [],
              });
              console.log('[useDrillLabData] Drill layoutData:', drill.layoutData);
            } else {
              setError('Drill not found');
            }
          } else {
            setError('Failed to load drill data');
          }
        } else {
          // No mode or drillId - start with empty drill data
          console.log('[useDrillLabData] No mode or drillId - starting with empty data');
          setDrillData({
            name: 'New Drill',
            description: '',
            layoutData: [],
          });
        }
      } catch (err) {
        console.error('[useDrillLabData] Error loading drill data:', err);
        setError('Failed to load drill data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDrillData();
  }, [drillId, mode, searchParams]);

  const saveDrill = async (layoutData) => {
    if (!drillId) {
      console.warn('[useDrillLabData] Save aborted. No drillId');
      return { success: false, error: 'No drill ID' };
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log(
        '[useDrillLabData] Updating existing drill',
        drillId,
        'with',
        Array.isArray(layoutData) ? layoutData.length : 0,
        'elements'
      );
      const response = await updateDrill(drillId, {
        layoutData: layoutData,
      });
      console.log('[useDrillLabData] Update response:', response);

      if (response?.success) {
        return { success: true };
      } else {
        setError('Failed to save drill');
        return { success: false, error: 'Save failed' };
      }
    } catch (err) {
      console.error('[useDrillLabData] Save error:', err);
      setError('Failed to save drill');
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    drillData,
    setDrillData,
    isLoading,
    isSaving,
    error,
    saveDrill,
  };
}
