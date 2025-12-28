/**
 * Game Management E2E Tests
 * End-to-end tests for the complete game management workflow
 * 
 * Prerequisites:
 * - Backend server running on localhost:3001
 * - Frontend server running on localhost:5173
 * - Test database with seed data
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_USER = {
  email: 'admin@squadup.com',
  password: '123456',
};

test.describe('Game Management', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL(`${BASE_URL}/Dashboard`);
  });

  test('should create a new game', async ({ page }) => {
    // Navigate to games page
    await page.click('text=Games');
    await page.waitForURL(`${BASE_URL}/games-schedule`);

    // Click add game button
    await page.click('text=Add Game');
    await page.waitForURL(`${BASE_URL}/add-game`);

    // Fill in game details
    await page.fill('[name="opponent"]', 'Real Madrid');
    await page.fill('[name="date"]', '2024-06-15');
    await page.fill('[name="time"]', '15:00');
    await page.selectOption('[name="location"]', 'Home');

    // Submit form
    await page.click('button:has-text("Create Game")');

    // Verify redirect to games schedule
    await page.waitForURL(`${BASE_URL}/games-schedule`);

    // Verify game appears in list
    await expect(page.locator('text=vs Real Madrid')).toBeVisible();
  });

  test('should view game details', async ({ page }) => {
    // Navigate to games page
    await page.click('text=Games');
    
    // Click on first game
    const firstGame = page.locator('[data-testid="game-card"]').first();
    await firstGame.click();

    // Verify game details page loaded
    await expect(page.locator('h1')).toContainText('Game Details');
    await expect(page.locator('[data-testid="opponent-name"]')).toBeVisible();
  });

  test('should update game status', async ({ page }) => {
    // Go to game details
    await page.click('text=Games');
    await page.locator('[data-testid="game-card"]').first().click();

    // Change status
    await page.click('button:has-text("Change Status")');
    await page.click('text=Postponed');

    // Verify status updated
    await expect(page.locator('[data-testid="game-status"]')).toContainText('Postponed');
  });

  test('should finalize game with score', async ({ page }) => {
    // Navigate to an in-progress game
    await page.click('text=Games');
    await page.click('text=In Progress'); // Filter
    await page.locator('[data-testid="game-card"]').first().click();

    // Open finalize dialog
    await page.click('button:has-text("Finalize Game")');

    // Enter score
    await page.fill('[name="homeScore"]', '3');
    await page.fill('[name="awayScore"]', '2');

    // Submit
    await page.click('button:has-text("Finalize")');

    // Verify game finalized
    await expect(page.locator('[data-testid="game-status"]')).toContainText('Played');
    await expect(page.locator('[data-testid="final-score"]')).toContainText('3-2');
  });

  test('should add goal during game', async ({ page }) => {
    // Go to game details
    await page.click('text=Games');
    await page.locator('[data-testid="game-card"]').first().click();

    // Open goal dialog
    await page.click('button:has-text("Add Goal")');

    // Select scorer
    await page.click('[data-testid="player-selector"]');
    await page.click('text=John Doe');

    // Enter minute
    await page.fill('[name="minute"]', '23');

    // Submit
    await page.click('button:has-text("Save Goal")');

    // Verify goal appears in timeline
    await expect(page.locator('text=John Doe scored')).toBeVisible();
    await expect(page.locator('text=23\'')).toBeVisible();
  });

  test('should handle substitution', async ({ page }) => {
    // Go to game details
    await page.click('text=Games');
    await page.locator('[data-testid="game-card"]').first().click();

    // Open substitution dialog
    await page.click('button:has-text("Substitution")');

    // Select player out
    await page.click('[data-testid="player-out-selector"]');
    await page.click('text=Player A');

    // Select player in
    await page.click('[data-testid="player-in-selector"]');
    await page.click('text=Player B');

    // Enter minute
    await page.fill('[name="minute"]', '67');

    // Submit
    await page.click('button:has-text("Make Substitution")');

    // Verify substitution in timeline
    await expect(page.locator('text=Player B replaced Player A')).toBeVisible();
  });
});

test.describe('Game Management - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/Dashboard`);
  });

  test('should show validation error for invalid date', async ({ page }) => {
    await page.click('text=Games');
    await page.click('text=Add Game');

    // Try to create game with past date
    await page.fill('[name="opponent"]', 'Test Team');
    await page.fill('[name="date"]', '2020-01-01'); // Past date
    await page.click('button:has-text("Create Game")');

    // Verify error message
    await expect(page.locator('text=Date cannot be in the past')).toBeVisible();
  });

  test('should handle network error gracefully', async ({ page, context }) => {
    // Block API calls
    await context.route('**/api/games', route => route.abort());

    await page.click('text=Games');

    // Verify error state
    await expect(page.locator('text=Failed to load games')).toBeVisible();
  });
});

