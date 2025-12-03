/**
 * Games Routes Aggregator
 * Consolidates all game-related routes into a single entry point
 */

const express = require('express');
const router = express.Router();

// Core game operations
const crudRoutes = require('./crud');
const draftRoutes = require('./drafts');
const statusRoutes = require('./status');
const timelineRoutes = require('./timeline');

// Game events
const goalRoutes = require('./goals');
const substitutionRoutes = require('./substitutions');
const cardRoutes = require('./cards');

// Game data & metadata
const playerMatchStatsRoutes = require('./playerMatchStats');
const gameReportRoutes = require('./gameReports');
const gameRosterRoutes = require('./gameRosters');
const difficultyAssessmentRoutes = require('./difficultyAssessment');
const minutesValidationRoutes = require('./minutesValidation');

// Mount all routes
router.use('/', crudRoutes);                      // /api/games (CRUD)
router.use('/', draftRoutes);                     // /api/games/:id/draft
router.use('/', statusRoutes);                    // /api/games/:id/start-game, submit-report
router.use('/', timelineRoutes);                  // /api/games/:id/timeline
router.use('/', goalRoutes);                      // /api/games/:gameId/goals
router.use('/', substitutionRoutes);              // /api/games/:gameId/substitutions
router.use('/', cardRoutes);                      // /api/games/:gameId/cards
router.use('/', playerMatchStatsRoutes);          // /api/games/:gameId/player-match-stats
router.use('/', difficultyAssessmentRoutes);      // /api/games/:gameId/difficulty-assessment
router.use('/', minutesValidationRoutes);         // /api/games/:gameId/match-duration

module.exports = router;
