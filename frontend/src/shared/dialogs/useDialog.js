import { useState, useCallback } from 'react';

/**
 * Custom hook for managing dialog state
 * Provides standard open/close/toggle functionality
 * @param {boolean} defaultOpen - Initial open state (default: false)
 * @returns {object} Dialog state and control functions
 */
export function useDialog(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen, // For advanced use cases
  };
}

/**
 * Custom hook for managing confirmation dialog state with async actions
 * @param {function} onConfirm - Async function to call on confirmation
 * @returns {object} Confirmation dialog state and control functions
 */
export function useConfirmDialog(onConfirm) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const openConfirm = useCallback((data) => {
    setConfirmData(data);
    setIsOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setIsOpen(false);
    setConfirmData(null);
    setIsLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) {
      closeConfirm();
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(confirmData);
      closeConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
      setIsLoading(false);
      // Don't close dialog on error - let user retry
    }
  }, [onConfirm, confirmData, closeConfirm]);

  return {
    isOpen,
    isLoading,
    confirmData,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
}

