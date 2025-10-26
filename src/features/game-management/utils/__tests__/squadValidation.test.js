/**
 * Unit Tests for Squad Validation Utilities
 * 
 * Tests all validation functions for sports team squad management
 * including formation validation, bench size checks, and position validation
 */

import {
  validateStartingLineup,
  validateBenchSize,
  validatePlayerPosition,
  validateGoalkeeper,
  validateSquad
} from '../squadValidation';

// Mock data for testing
const mockPlayers = [
  { _id: '1', name: 'John Doe', position: 'Goalkeeper' },
  { _id: '2', name: 'Mike Smith', position: 'Defender' },
  { _id: '3', name: 'Tom Wilson', position: 'Midfielder' },
  { _id: '4', name: 'Alex Brown', position: 'Forward' },
  { _id: '5', name: 'Chris Davis', position: 'Defender' },
  { _id: '6', name: 'Sam Johnson', position: 'Midfielder' },
  { _id: '7', name: 'Ben Miller', position: 'Forward' },
  { _id: '8', name: 'Dan Garcia', position: 'Midfielder' },
  { _id: '9', name: 'Luke Martinez', position: 'Forward' },
  { _id: '10', name: 'Nick Anderson', position: 'Defender' },
  { _id: '11', name: 'Paul Taylor', position: 'Midfielder' },
  { _id: '12', name: 'Steve Thomas', position: 'Forward' },
  { _id: '13', name: 'Mark Jackson', position: 'Defender' },
  { _id: '14', name: 'Ryan White', position: 'Midfielder' },
  { _id: '15', name: 'Kevin Harris', position: 'Forward' },
  { _id: '16', name: 'Tony Martin', position: 'Defender' },
  { _id: '17', name: 'Jake Thompson', position: 'Midfielder' }
];

const mockFormation = {
  gk: mockPlayers[0],    // Goalkeeper
  cb1: mockPlayers[1],    // Defender
  cb2: mockPlayers[2],    // Midfielder (out of position)
  lb: mockPlayers[3],     // Forward (out of position)
  rb: mockPlayers[4],     // Defender
  cm1: mockPlayers[5],    // Midfielder
  cm2: mockPlayers[6],    // Forward (out of position)
  lm: mockPlayers[7],     // Midfielder
  rm: mockPlayers[8],     // Forward (out of position)
  st1: mockPlayers[9],    // Defender (out of position)
  st2: mockPlayers[10]    // Midfielder (out of position)
};

const mockPositionData = {
  gk: { type: 'goalkeeper', label: 'GK' },
  cb1: { type: 'defender', label: 'CB' },
  st1: { type: 'forward', label: 'ST' }
};

describe('Squad Validation Utilities', () => {
  describe('validateStartingLineup', () => {
    it('should validate correct 11-player formation', () => {
      const result = validateStartingLineup(mockFormation);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Starting lineup is valid');
    });

    it('should reject empty formation', () => {
      const emptyFormation = {};
      const result = validateStartingLineup(emptyFormation);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players assigned to starting lineup');
    });

    it('should reject formation with too few players', () => {
      const incompleteFormation = {
        gk: mockPlayers[0],
        cb1: mockPlayers[1],
        cb2: mockPlayers[2]
      };
      const result = validateStartingLineup(incompleteFormation);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Only 3 players in starting lineup. Need exactly 11 players.');
    });

    it('should reject formation with too many players', () => {
      const oversizedFormation = {
        ...mockFormation,
        extra1: mockPlayers[11],
        extra2: mockPlayers[12]
      };
      const result = validateStartingLineup(oversizedFormation);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Too many players (13) in starting lineup. Maximum 11 players allowed.');
    });

    it('should handle formation with null players', () => {
      const formationWithNulls = {
        gk: mockPlayers[0],
        cb1: mockPlayers[1],
        cb2: null,
        lb: undefined,
        rb: mockPlayers[4],
        cm1: mockPlayers[5],
        cm2: mockPlayers[6],
        lm: mockPlayers[7],
        rm: mockPlayers[8],
        st1: mockPlayers[9],
        st2: mockPlayers[10]
      };
      const result = validateStartingLineup(formationWithNulls);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Only 9 players in starting lineup. Need exactly 11 players.');
    });
  });

  describe('validateBenchSize', () => {
    it('should validate adequate bench size (6+ players)', () => {
      const benchPlayers = mockPlayers.slice(11, 17); // 6 players
      const result = validateBenchSize(benchPlayers);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Bench size is adequate');
      expect(result.needsConfirmation).toBe(false);
    });

    it('should validate more than adequate bench size', () => {
      const benchPlayers = mockPlayers.slice(11, 20); // 9 players
      const result = validateBenchSize(benchPlayers);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Bench size is adequate');
      expect(result.needsConfirmation).toBe(false);
    });

    it('should require confirmation for small bench (1-5 players)', () => {
      const benchPlayers = mockPlayers.slice(11, 15); // 4 players
      const result = validateBenchSize(benchPlayers);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Only 4 players on bench (recommended: 6+)');
      expect(result.needsConfirmation).toBe(true);
      expect(result.confirmationMessage).toBe('You have fewer than 6 bench players. Are you sure you want to continue?');
    });

    it('should handle empty bench', () => {
      const benchPlayers = [];
      const result = validateBenchSize(benchPlayers);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players on the bench');
      expect(result.needsConfirmation).toBe(false);
    });

    it('should handle single bench player', () => {
      const benchPlayers = [mockPlayers[11]];
      const result = validateBenchSize(benchPlayers);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Only 1 players on bench (recommended: 6+)');
      expect(result.needsConfirmation).toBe(true);
    });
  });

  describe('validatePlayerPosition', () => {
    it('should validate goalkeeper in GK position', () => {
      const player = { name: 'John Doe', position: 'Goalkeeper' };
      const positionData = { type: 'goalkeeper', label: 'GK' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('John Doe is in their natural position');
    });

    it('should validate defender in CB position', () => {
      const player = { name: 'Mike Smith', position: 'Defender' };
      const positionData = { type: 'defender', label: 'CB' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('Mike Smith is in their natural position');
    });

    it('should validate midfielder in CM position', () => {
      const player = { name: 'Tom Wilson', position: 'Midfielder' };
      const positionData = { type: 'midfielder', label: 'CM' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('Tom Wilson is in their natural position');
    });

    it('should validate forward in ST position', () => {
      const player = { name: 'Alex Brown', position: 'Forward' };
      const positionData = { type: 'forward', label: 'ST' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('Alex Brown is in their natural position');
    });

    it('should detect goalkeeper out of position', () => {
      const player = { name: 'John Doe', position: 'Goalkeeper' };
      const positionData = { type: 'forward', label: 'ST' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(false);
      expect(result.message).toBe('John Doe is being placed out of their natural position (Goalkeeper → ST)');
    });

    it('should detect defender out of position', () => {
      const player = { name: 'Mike Smith', position: 'Defender' };
      const positionData = { type: 'forward', label: 'ST' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(false);
      expect(result.message).toBe('Mike Smith is being placed out of their natural position (Defender → ST)');
    });

    it('should detect midfielder out of position', () => {
      const player = { name: 'Tom Wilson', position: 'Midfielder' };
      const positionData = { type: 'goalkeeper', label: 'GK' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(false);
      expect(result.message).toBe('Tom Wilson is being placed out of their natural position (Midfielder → GK)');
    });

    it('should detect forward out of position', () => {
      const player = { name: 'Alex Brown', position: 'Forward' };
      const positionData = { type: 'goalkeeper', label: 'GK' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(false);
      expect(result.message).toBe('Alex Brown is being placed out of their natural position (Forward → GK)');
    });

    it('should handle missing player data', () => {
      const result = validatePlayerPosition(null, mockPositionData.gk);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('Position validation passed');
    });

    it('should handle missing position data', () => {
      const player = { name: 'John Doe', position: 'Goalkeeper' };
      const result = validatePlayerPosition(player, null);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('Position validation passed');
    });

    it('should handle case insensitive position matching', () => {
      const player = { name: 'John Doe', position: 'goalkeeper' };
      const positionData = { type: 'Goalkeeper', label: 'GK' };
      const result = validatePlayerPosition(player, positionData);
      
      expect(result.isNaturalPosition).toBe(true);
      expect(result.message).toBe('John Doe is in their natural position');
    });
  });

  describe('validateGoalkeeper', () => {
    it('should validate formation with goalkeeper', () => {
      const formation = { gk: mockPlayers[0] };
      const result = validateGoalkeeper(formation);
      
      expect(result.hasGoalkeeper).toBe(true);
      expect(result.message).toBe('Goalkeeper is assigned');
    });

    it('should reject formation without goalkeeper', () => {
      const formation = { cb1: mockPlayers[1], cb2: mockPlayers[2] };
      const result = validateGoalkeeper(formation);
      
      expect(result.hasGoalkeeper).toBe(false);
      expect(result.message).toBe('No goalkeeper assigned to the team');
    });

    it('should reject formation with null goalkeeper', () => {
      const formation = { gk: null, cb1: mockPlayers[1] };
      const result = validateGoalkeeper(formation);
      
      expect(result.hasGoalkeeper).toBe(false);
      expect(result.message).toBe('No goalkeeper assigned to the team');
    });

    it('should reject formation with undefined goalkeeper', () => {
      const formation = { gk: undefined, cb1: mockPlayers[1] };
      const result = validateGoalkeeper(formation);
      
      expect(result.hasGoalkeeper).toBe(false);
      expect(result.message).toBe('No goalkeeper assigned to the team');
    });
  });

  describe('validateSquad', () => {
    const mockBenchPlayers = mockPlayers.slice(11, 17); // 6 players
    const mockRosterStatuses = {
      '1': 'Starting Lineup',
      '2': 'Starting Lineup',
      '3': 'Starting Lineup',
      '4': 'Starting Lineup',
      '5': 'Starting Lineup',
      '6': 'Starting Lineup',
      '7': 'Starting Lineup',
      '8': 'Starting Lineup',
      '9': 'Starting Lineup',
      '10': 'Starting Lineup',
      '11': 'Starting Lineup',
      '12': 'Bench',
      '13': 'Bench',
      '14': 'Bench',
      '15': 'Bench',
      '16': 'Bench',
      '17': 'Bench'
    };

    it('should validate complete valid squad', () => {
      const result = validateSquad(mockFormation, mockBenchPlayers, mockRosterStatuses);
      
      expect(result.isValid).toBe(true);
      expect(result.startingLineup.isValid).toBe(true);
      expect(result.bench.isValid).toBe(true);
      expect(result.goalkeeper.hasGoalkeeper).toBe(true);
      expect(result.needsConfirmation).toBe(false);
      expect(result.messages).toHaveLength(3);
    });

    it('should reject squad with invalid starting lineup', () => {
      const incompleteFormation = { gk: mockPlayers[0] };
      const result = validateSquad(incompleteFormation, mockBenchPlayers, mockRosterStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.startingLineup.isValid).toBe(false);
      expect(result.bench.isValid).toBe(true);
      expect(result.goalkeeper.hasGoalkeeper).toBe(true);
    });

    it('should require confirmation for small bench', () => {
      const smallBench = mockPlayers.slice(11, 14); // 3 players
      const result = validateSquad(mockFormation, smallBench, mockRosterStatuses);
      
      expect(result.isValid).toBe(true);
      expect(result.startingLineup.isValid).toBe(true);
      expect(result.bench.isValid).toBe(true);
      expect(result.goalkeeper.hasGoalkeeper).toBe(true);
      expect(result.needsConfirmation).toBe(true);
    });

    it('should reject squad without goalkeeper', () => {
      const formationWithoutGK = { cb1: mockPlayers[1], cb2: mockPlayers[2] };
      const result = validateSquad(formationWithoutGK, mockBenchPlayers, mockRosterStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.startingLineup.isValid).toBe(false);
      expect(result.goalkeeper.hasGoalkeeper).toBe(false);
    });

    it('should handle empty formation', () => {
      const emptyFormation = {};
      const result = validateSquad(emptyFormation, mockBenchPlayers, mockRosterStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.startingLineup.isValid).toBe(false);
      expect(result.goalkeeper.hasGoalkeeper).toBe(false);
    });

    it('should handle empty bench', () => {
      const emptyBench = [];
      const result = validateSquad(mockFormation, emptyBench, mockRosterStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.startingLineup.isValid).toBe(true);
      expect(result.bench.isValid).toBe(false);
      expect(result.goalkeeper.hasGoalkeeper).toBe(true);
    });

    it('should provide comprehensive validation messages', () => {
      const result = validateSquad(mockFormation, mockBenchPlayers, mockRosterStatuses);
      
      expect(result.messages).toContain('Starting lineup is valid');
      expect(result.messages).toContain('Bench size is adequate');
      expect(result.messages).toContain('Goalkeeper is assigned');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined formation', () => {
      const result = validateStartingLineup(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players assigned to starting lineup');
    });

    it('should handle null formation', () => {
      const result = validateStartingLineup(null);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players assigned to starting lineup');
    });

    it('should handle undefined bench players', () => {
      const result = validateBenchSize(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players on the bench');
    });

    it('should handle null bench players', () => {
      const result = validateBenchSize(null);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No players on the bench');
    });

    it('should handle undefined formation in goalkeeper validation', () => {
      const result = validateGoalkeeper(undefined);
      
      expect(result.hasGoalkeeper).toBe(false);
      expect(result.message).toBe('No goalkeeper assigned to the team');
    });

    it('should handle null formation in goalkeeper validation', () => {
      const result = validateGoalkeeper(null);
      
      expect(result.hasGoalkeeper).toBe(false);
      expect(result.message).toBe('No goalkeeper assigned to the team');
    });
  });
});
