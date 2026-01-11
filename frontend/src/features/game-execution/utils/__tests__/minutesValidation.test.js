/**
 * Unit Tests for Minutes Utilities
 *
 * Tests for match duration calculation.
 * Note: Minutes validation tests have been removed since minutes are now
 * automatically calculated from game events (substitutions, red cards).
 */

import { calculateTotalMatchDuration } from '../minutesValidation';

describe('Minutes Utilities', () => {
  describe('calculateTotalMatchDuration', () => {
    it('should calculate total duration with regular time only', () => {
      const matchDuration = { regularTime: 90, firstHalfExtraTime: 0, secondHalfExtraTime: 0 };
      const result = calculateTotalMatchDuration(matchDuration);

      expect(result).toBe(90);
    });

    it('should calculate total duration with extra time', () => {
      const matchDuration = { regularTime: 90, firstHalfExtraTime: 3, secondHalfExtraTime: 5 };
      const result = calculateTotalMatchDuration(matchDuration);

      expect(result).toBe(98);
    });

    it('should default to 90 minutes when matchDuration is null', () => {
      const result = calculateTotalMatchDuration(null);

      expect(result).toBe(90);
    });

    it('should default to 90 minutes when matchDuration is undefined', () => {
      const result = calculateTotalMatchDuration(undefined);

      expect(result).toBe(90);
    });

    it('should handle missing extra time fields', () => {
      const matchDuration = { regularTime: 90 };
      const result = calculateTotalMatchDuration(matchDuration);

      expect(result).toBe(90);
    });

    it('should handle missing regularTime field', () => {
      const matchDuration = { firstHalfExtraTime: 3, secondHalfExtraTime: 5 };
      const result = calculateTotalMatchDuration(matchDuration);

      expect(result).toBe(98); // Defaults to 90 + 3 + 5
    });

    it('should handle all missing fields', () => {
      const matchDuration = {};
      const result = calculateTotalMatchDuration(matchDuration);

      expect(result).toBe(90); // Defaults to 90
    });
  });
});
