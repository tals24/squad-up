/**
 * Game Routes Index
 * Aggregates all game-related routes
 * Organizes endpoints by domain (CRUD, drafts, status, timeline)
 */

const express = require('express');
const crudRoutes = require('./crud');
const draftRoutes = require('./drafts');
const statusRoutes = require('./status');
const timelineRoutes = require('./timeline');

const router = express.Router();

// Mount route modules
router.use('/', crudRoutes);        // CRUD operations: GET, POST, PUT, DELETE
router.use('/', draftRoutes);       // Draft operations: GET/PUT draft
router.use('/', statusRoutes);      // Status transitions: start-game, submit-report
router.use('/', timelineRoutes);    // Timeline: GET timeline

module.exports = router;

