/**
 * Tests for season detection logic
 */

import { getSeasonFromDate, getCurrentSeason, isDateInSeason } from '@/shared/utils/date/seasonUtils';

describe('Season Detection Logic', () => {
  test('should detect 2024/2025 season for August 2024', () => {
    const date = new Date('2024-08-15');
    expect(getSeasonFromDate(date)).toBe('2024/2025');
  });

  test('should detect 2024/2025 season for December 2024', () => {
    const date = new Date('2024-12-15');
    expect(getSeasonFromDate(date)).toBe('2024/2025');
  });

  test('should detect 2024/2025 season for January 2025', () => {
    const date = new Date('2025-01-15');
    expect(getSeasonFromDate(date)).toBe('2024/2025');
  });

  test('should detect 2024/2025 season for May 2025', () => {
    const date = new Date('2025-05-15');
    expect(getSeasonFromDate(date)).toBe('2024/2025');
  });

  test('should detect 2025/2026 season for June 2025', () => {
    const date = new Date('2025-06-15');
    expect(getSeasonFromDate(date)).toBe('2025/2026');
  });

  test('should detect 2025/2026 season for July 2025', () => {
    const date = new Date('2025-07-15');
    expect(getSeasonFromDate(date)).toBe('2025/2026');
  });

  test('should detect 2025/2026 season for August 2025', () => {
    const date = new Date('2025-08-15');
    expect(getSeasonFromDate(date)).toBe('2025/2026');
  });

  test('should validate date is in correct season', () => {
    const gameDate = new Date('2024-10-15');
    const season = '2024/2025';
    expect(isDateInSeason(gameDate, season)).toBe(true);
  });

  test('should validate date is not in wrong season', () => {
    const gameDate = new Date('2024-10-15');
    const season = '2023/2024';
    expect(isDateInSeason(gameDate, season)).toBe(false);
  });
});
