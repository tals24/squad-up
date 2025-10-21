import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDrillLabMode() {
  const [searchParams] = useSearchParams();
  
  const mode = useMemo(() => {
    const drillId = searchParams.get('drillId');
    const mode = searchParams.get('mode');
    const isReadOnly = searchParams.get('readOnly') === 'true';
    const returnTo = searchParams.get('returnTo');

    console.log('[useDrillLabMode] Mode analysis:', {
      drillId,
      mode,
      isReadOnly,
      returnTo,
      allParams: Object.fromEntries(searchParams.entries())
    });

    return {
      drillId,
      mode: mode || (drillId ? 'edit' : 'create'),
      isReadOnly,
      returnTo,
      searchParams,
      isCreate: mode === 'create' || (!mode && !drillId),
      isEdit: mode === 'edit' || (!mode && drillId && !isReadOnly),
      isView: isReadOnly || (drillId && !mode && isReadOnly)
    };
  }, [searchParams]);

  return mode;
}
