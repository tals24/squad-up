/**
 * Critical Test Suite: Spam Prevention (Hook Behavior)
 *
 * Tests SP-001 and SP-002 from CRITICAL_TEST_SUITE_DRAFT_AUTOSAVE.md
 *
 * These tests verify:
 * - Debounce prevents rapid API calls
 * - Change detection prevents unnecessary calls
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutosave } from '../useAutosave';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe('Critical Hook Tests: Spam Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Draft saved successfully' }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Test SP-001: Debounce Prevents Rapid API Calls
   * Risk: Rapid changes should trigger only ONE API call after debounce
   */
  describe('SP-001: Debounce Prevents Rapid API Calls', () => {
    it('should trigger only one API call after rapid changes', async () => {
      const endpoint = 'http://localhost:3001/api/games/test123/draft';
      const initialData = {
        teamSummary: {
          defenseSummary: 'Initial',
        },
      };

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutosave({
            data,
            endpoint,
            enabled: true,
            debounceMs: 2500,
          }),
        { initialProps: { data: initialData } }
      );

      // Wait for initialization period to end (1000ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Make 5 rapid changes (after initialization period)
      for (let i = 1; i <= 5; i++) {
        rerender({
          data: {
            teamSummary: {
              defenseSummary: `Change ${i}`,
            },
          },
        });
      }

      // Fast-forward time to trigger debounce
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Verify the last change was saved
      expect(fetch).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            teamSummary: {
              defenseSummary: 'Change 5',
            },
          }),
        })
      );
    });

    it('should reset debounce timer on each change', async () => {
      const endpoint = 'http://localhost:3001/api/games/test123/draft';
      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutosave({
            data,
            endpoint,
            enabled: true,
            debounceMs: 2500,
          }),
        { initialProps: { data: { teamSummary: { defenseSummary: 'Initial' } } } }
      );

      // Wait for initialization period to end
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Change 1
      rerender({ data: { teamSummary: { defenseSummary: 'Change 1' } } });
      act(() => {
        jest.advanceTimersByTime(1000); // Wait 1s
      });

      // Change 2 (should reset timer)
      rerender({ data: { teamSummary: { defenseSummary: 'Change 2' } } });
      act(() => {
        jest.advanceTimersByTime(2500); // Wait full debounce time
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Should only save Change 2
      expect(fetch).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          body: JSON.stringify({
            teamSummary: {
              defenseSummary: 'Change 2',
            },
          }),
        })
      );
    });
  });

  /**
   * Test SP-002: Change Detection Prevents Unnecessary Calls
   * Risk: Unchanged data should NOT trigger API calls
   */
  describe('SP-002: Change Detection Prevents Unnecessary Calls', () => {
    it('should not trigger API call when data is unchanged', async () => {
      const endpoint = 'http://localhost:3001/api/games/test123/draft';
      const data = {
        teamSummary: {
          defenseSummary: 'Test summary',
        },
      };

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutosave({
            data,
            endpoint,
            enabled: true,
            debounceMs: 2500,
          }),
        { initialProps: { data } }
      );

      // Wait for initialization period to end (1000ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Make a change and wait for save
      rerender({ data: { teamSummary: { defenseSummary: 'Changed' } } });
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Now make the same change again (same data)
      rerender({ data: { teamSummary: { defenseSummary: 'Changed' } } });
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      // Should NOT trigger another API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      });
    });

    it('should detect changes in nested objects', async () => {
      const endpoint = 'http://localhost:3001/api/games/test123/draft';
      const initialData = {
        teamSummary: {
          defenseSummary: 'Test',
        },
      };

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutosave({
            data,
            endpoint,
            enabled: true,
            debounceMs: 2500,
          }),
        { initialProps: { data: initialData } }
      );

      // Wait for initialization period to end (1000ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Change nested field
      rerender({
        data: {
          teamSummary: {
            defenseSummary: 'Changed',
          },
        },
      });

      act(() => {
        jest.advanceTimersByTime(2500);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger call when only object reference changes but values are same', async () => {
      const endpoint = 'http://localhost:3001/api/games/test123/draft';
      const data1 = {
        teamSummary: {
          defenseSummary: 'Test',
        },
      };

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutosave({
            data,
            endpoint,
            enabled: true,
            debounceMs: 2500,
          }),
        { initialProps: { data: data1 } }
      );

      // Wait for initialization period to end (1000ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Make a change
      rerender({ data: { teamSummary: { defenseSummary: 'Changed' } } });
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Create new object with same values (different reference)
      const data2 = {
        teamSummary: {
          defenseSummary: 'Changed', // Same value
        },
      };

      rerender({ data: data2 });
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      // Should NOT trigger call (JSON comparison should detect they're the same)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      });
    });
  });
});
