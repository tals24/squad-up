import { useState, useCallback, useEffect } from 'react';

export function useDrillLabHistory(initialElements = []) {
  const [history, setHistory] = useState([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentElements = history[historyIndex] || [];

  // Update history when initialElements change (for external data loading)
  useEffect(() => {
    if (
      initialElements &&
      initialElements.length > 0 &&
      history.length === 1 &&
      history[0].length === 0
    ) {
      console.log(
        '[useDrillLabHistory] Updating history with initial elements:',
        initialElements.length
      );
      setHistory([initialElements]);
      setHistoryIndex(0);
    }
  }, [initialElements, history]);

  const saveToHistory = useCallback(
    (newElements) => {
      console.log(
        '[useDrillLabHistory] Saving to history:',
        Array.isArray(newElements) ? newElements.length : 0,
        'elements'
      );
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      console.log('[useDrillLabHistory] Undo from index', historyIndex, 'to', historyIndex - 1);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      console.log('[useDrillLabHistory] Redo from index', historyIndex, 'to', historyIndex + 1);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const clear = useCallback(() => {
    console.log('[useDrillLabHistory] Clearing history');
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    currentElements,
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  };
}
