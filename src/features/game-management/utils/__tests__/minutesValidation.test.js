/**
 * Unit Tests for Minutes Validation Utilities
 * 
 * Tests validation logic for player minutes in match reports
 * including team totals, individual player limits, and match duration calculations
 */

import {
  calculateTotalMatchDuration,
  calculateMinimumTeamMinutes,
  calculateTotalPlayerMinutes,
  validateTeamMinutes,
  validateTeamMaxMinutes,
  validatePlayerMaxMinutes,
  getMinutesSummary,
  validateMinutesForSubmission,
  formatMinutes,
  getMinutesProgressColor
} from '../minutesValidation';

describe('Minutes Validation Utilities', () => {
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

    it('should handle zero regular time (edge case)', () => {
      const matchDuration = { regularTime: 0, firstHalfExtraTime: 5, secondHalfExtraTime: 5 };
      const result = calculateTotalMatchDuration(matchDuration);
      
      // When regularTime is 0, it defaults to 90 in the function
      expect(result).toBe(100); // 90 (default) + 5 + 5
    });
  });

  describe('calculateMinimumTeamMinutes', () => {
    it('should calculate minimum for standard 90-minute match', () => {
      const result = calculateMinimumTeamMinutes(90);
      
      expect(result).toBe(990); // 11 * 90
    });

    it('should calculate minimum for match with extra time', () => {
      const result = calculateMinimumTeamMinutes(96);
      
      expect(result).toBe(1056); // 11 * 96
    });

    it('should handle zero match duration (edge case)', () => {
      const result = calculateMinimumTeamMinutes(0);
      
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalPlayerMinutes', () => {
    it('should calculate total from player reports', () => {
      const playerReports = {
        '1': { minutesPlayed: 90, goals: 0, assists: 0 },
        '2': { minutesPlayed: 85, goals: 1, assists: 0 },
        '3': { minutesPlayed: 90, goals: 0, assists: 1 }
      };
      
      const result = calculateTotalPlayerMinutes(playerReports);
      
      expect(result).toBe(265);
    });

    it('should handle empty player reports', () => {
      const playerReports = {};
      const result = calculateTotalPlayerMinutes(playerReports);
      
      expect(result).toBe(0);
    });

    it('should handle missing minutesPlayed field', () => {
      const playerReports = {
        '1': { goals: 1, assists: 0 },
        '2': { minutesPlayed: 90, goals: 0, assists: 0 }
      };
      
      const result = calculateTotalPlayerMinutes(playerReports);
      
      expect(result).toBe(90);
    });

    it('should handle zero minutes played', () => {
      const playerReports = {
        '1': { minutesPlayed: 0, goals: 0, assists: 0 },
        '2': { minutesPlayed: 0, goals: 0, assists: 0 }
      };
      
      const result = calculateTotalPlayerMinutes(playerReports);
      
      expect(result).toBe(0);
    });
  });

  describe('validateTeamMinutes', () => {
    it('should validate when total meets minimum requirement', () => {
      const result = validateTeamMinutes(990, 990);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Team minutes meet minimum requirement');
      expect(result.needsConfirmation).toBe(false);
    });

    it('should validate when total exceeds minimum requirement', () => {
      const result = validateTeamMinutes(1050, 990);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Team minutes meet minimum requirement');
    });

    it('should reject when total is below minimum', () => {
      const result = validateTeamMinutes(900, 990);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Total team minutes (900) is less than required (990)');
      expect(result.message).toContain('Missing 90 minutes');
      expect(result.deficit).toBe(90);
      expect(result.needsConfirmation).toBe(false);
    });

    it('should handle zero total minutes', () => {
      const result = validateTeamMinutes(0, 990);
      
      expect(result.isValid).toBe(false);
      expect(result.deficit).toBe(990);
    });
  });

  describe('validateTeamMaxMinutes', () => {
    it('should validate when total is within maximum', () => {
      const result = validateTeamMaxMinutes(990, 990);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Team minutes within maximum limit');
    });

    it('should reject when total exceeds maximum', () => {
      const result = validateTeamMaxMinutes(1100, 990);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Total minutes (1100) exceed maximum allowed (990)');
      expect(result.message).toContain('110 minutes more than physically possible');
      expect(result.excess).toBe(110);
    });

    it('should handle exact boundary case', () => {
      const result = validateTeamMaxMinutes(991, 990);
      
      expect(result.isValid).toBe(false);
      expect(result.excess).toBe(1);
    });
  });

  describe('validatePlayerMaxMinutes', () => {
    it('should validate when player minutes are within limit', () => {
      const result = validatePlayerMaxMinutes(90, 90);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Player minutes within limit');
    });

    it('should validate when player minutes are below limit', () => {
      const result = validatePlayerMaxMinutes(85, 90);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject when player exceeds match duration', () => {
      const result = validatePlayerMaxMinutes(95, 90);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Player cannot play more than 90 minutes');
      expect(result.message).toContain('recorded: 95');
    });

    it('should handle extra time scenario', () => {
      const result = validatePlayerMaxMinutes(96, 96);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject when player exceeds extra time', () => {
      const result = validatePlayerMaxMinutes(97, 96);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot play more than 96 minutes');
    });
  });

  describe('getMinutesSummary', () => {
    const mockGame = {
      _id: 'game1',
      matchDuration: {
        regularTime: 90,
        firstHalfExtraTime: 0,
        secondHalfExtraTime: 0
      }
    };

    it('should calculate summary for complete match (exact minimum)', () => {
      const playerReports = {};
      // Create 11 players with 90 minutes each
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 90, goals: 0, assists: 0 };
      }
      
      const summary = getMinutesSummary(playerReports, mockGame);
      
      expect(summary.totalRecorded).toBe(990);
      expect(summary.minimumRequired).toBe(990);
      expect(summary.maximumAllowed).toBe(990);
      expect(summary.deficit).toBe(0);
      expect(summary.excess).toBe(0);
      expect(summary.percentage).toBe(100);
      expect(summary.isValid).toBe(true);
      expect(summary.isSufficient).toBe(true);
      expect(summary.isOverMaximum).toBe(false);
    });

    it('should calculate summary for match with extra time', () => {
      const gameWithExtraTime = {
        ...mockGame,
        matchDuration: {
          regularTime: 90,
          firstHalfExtraTime: 3,
          secondHalfExtraTime: 5
        }
      };
      
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 98, goals: 0, assists: 0 };
      }
      
      const summary = getMinutesSummary(playerReports, gameWithExtraTime);
      
      expect(summary.matchDuration).toBe(98);
      expect(summary.minimumRequired).toBe(1078); // 11 * 98
      expect(summary.maximumAllowed).toBe(1078);
      expect(summary.totalRecorded).toBe(1078);
      expect(summary.isValid).toBe(true);
      expect(summary.isOverMaximum).toBe(false);
    });

    it('should detect deficit in minutes', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 80, goals: 0, assists: 0 };
      }
      
      const summary = getMinutesSummary(playerReports, mockGame);
      
      expect(summary.totalRecorded).toBe(880);
      expect(summary.minimumRequired).toBe(990);
      expect(summary.deficit).toBe(110);
      expect(summary.percentage).toBe(89);
      expect(summary.isValid).toBe(false);
      expect(summary.isSufficient).toBe(false);
    });

    it('should detect excess over maximum', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 95, goals: 0, assists: 0 };
      }
      
      const summary = getMinutesSummary(playerReports, mockGame);
      
      expect(summary.totalRecorded).toBe(1045);
      expect(summary.maximumAllowed).toBe(990);
      expect(summary.excess).toBe(55);
      expect(summary.isValid).toBe(false);
      expect(summary.isOverMaximum).toBe(true);
    });

    it('should handle empty player reports', () => {
      const playerReports = {};
      const summary = getMinutesSummary(playerReports, mockGame);
      
      expect(summary.totalRecorded).toBe(0);
      expect(summary.minimumRequired).toBe(990);
      expect(summary.deficit).toBe(990);
      expect(summary.percentage).toBe(0);
      expect(summary.isValid).toBe(false);
    });

    it('should calculate players with minutes', () => {
      const playerReports = {
        '1': { minutesPlayed: 90, goals: 0, assists: 0 },
        '2': { minutesPlayed: 85, goals: 0, assists: 0 },
        '3': { minutesPlayed: 0, goals: 0, assists: 0 }
      };
      
      const summary = getMinutesSummary(playerReports, mockGame);
      
      expect(summary.playersReported).toBe(3);
      expect(summary.playersWithMinutes).toBe(2);
    });

    it('should handle missing game matchDuration', () => {
      const gameWithoutDuration = { _id: 'game1' };
      const playerReports = {
        '1': { minutesPlayed: 90, goals: 0, assists: 0 }
      };
      
      const summary = getMinutesSummary(playerReports, gameWithoutDuration);
      
      expect(summary.matchDuration).toBe(90); // Should default to 90
      expect(summary.minimumRequired).toBe(990);
    });
  });

  describe('validateMinutesForSubmission', () => {
    const mockGame = {
      _id: 'game1',
      matchDuration: {
        regularTime: 90,
        firstHalfExtraTime: 0,
        secondHalfExtraTime: 0
      }
    };

    const mockStartingLineup = [
      { _id: 'player1', fullName: 'John Doe' },
      { _id: 'player2', fullName: 'Mike Smith' },
      { _id: 'player3', fullName: 'Tom Wilson' }
    ];

    it('should validate perfect submission', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 90, goals: 0, assists: 0 };
      }
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect deficit error', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 80, goals: 0, assists: 0 };
      }
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Total team minutes');
      expect(result.errors[0]).toContain('less than required');
    });

    it('should detect excess over maximum error', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 95, goals: 0, assists: 0 };
      }
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('exceed maximum'))).toBe(true);
    });

    it('should detect individual player exceeding match duration', () => {
      const playerReports = {
        'player1': { minutesPlayed: 95, goals: 0, assists: 0 },
        'player2': { minutesPlayed: 90, goals: 0, assists: 0 }
      };
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot play more than 90 minutes'))).toBe(true);
    });

    it('should warn about players with zero minutes', () => {
      const playerReports = {
        'player1': { minutesPlayed: 90, goals: 0, assists: 0 },
        'player2': { minutesPlayed: 0, goals: 0, assists: 0 },
        'player3': { minutesPlayed: 85, goals: 0, assists: 0 }
      };
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.warnings.some(w => w.includes('0 minutes'))).toBe(true);
    });

    it('should handle extra time scenario', () => {
      const gameWithExtraTime = {
        ...mockGame,
        matchDuration: {
          regularTime: 90,
          firstHalfExtraTime: 3,
          secondHalfExtraTime: 3
        }
      };
      
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 96, goals: 0, assists: 0 };
      }
      
      const result = validateMinutesForSubmission(playerReports, gameWithExtraTime, mockStartingLineup);
      
      expect(result.isValid).toBe(true);
      expect(result.summary.matchDuration).toBe(96);
      expect(result.summary.minimumRequired).toBe(1056); // 11 * 96
    });

    it('should provide summary in result', () => {
      const playerReports = {};
      for (let i = 1; i <= 11; i++) {
        playerReports[`player${i}`] = { minutesPlayed: 90, goals: 0, assists: 0 };
      }
      
      const result = validateMinutesForSubmission(playerReports, mockGame, mockStartingLineup);
      
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecorded).toBe(990);
      expect(result.summary.minimumRequired).toBe(990);
      expect(result.summary.matchDuration).toBe(90);
      expect(result.summary.deficit).toBe(0);
    });
  });

  describe('formatMinutes', () => {
    it('should format minutes under 60', () => {
      expect(formatMinutes(45)).toBe('45 min');
      expect(formatMinutes(0)).toBe('0 min');
      expect(formatMinutes(30)).toBe('30 min');
    });

    it('should format exactly 60 minutes', () => {
      expect(formatMinutes(60)).toBe('1h');
    });

    it('should format hours and minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30min');
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(150)).toBe('2h 30min');
    });
  });

  describe('getMinutesProgressColor', () => {
    it('should return green for 100% or more', () => {
      expect(getMinutesProgressColor(100)).toBe('text-green-400');
      expect(getMinutesProgressColor(110)).toBe('text-green-400');
    });

    it('should return yellow for 80-99%', () => {
      expect(getMinutesProgressColor(80)).toBe('text-yellow-400');
      expect(getMinutesProgressColor(95)).toBe('text-yellow-400');
      expect(getMinutesProgressColor(99)).toBe('text-yellow-400');
    });

    it('should return red for less than 80%', () => {
      expect(getMinutesProgressColor(79)).toBe('text-red-400');
      expect(getMinutesProgressColor(50)).toBe('text-red-400');
      expect(getMinutesProgressColor(0)).toBe('text-red-400');
    });
  });
});

