const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const timelineEventController = require('../controllers/timelineEventController');

const router = express.Router();

/**
 * GET /api/timeline-events
 * Get all timeline events
 */
router.get('/', authenticateJWT, timelineEventController.getAllTimelineEvents);

/**
 * GET /api/timeline-events/:id
 * Get timeline event by ID
 */
router.get('/:id', authenticateJWT, timelineEventController.getTimelineEventById);

/**
 * POST /api/timeline-events
 * Create new timeline event
 */
router.post('/', authenticateJWT, timelineEventController.createTimelineEvent);

/**
 * PUT /api/timeline-events/:id
 * Update timeline event
 */
router.put('/:id', authenticateJWT, timelineEventController.updateTimelineEvent);

/**
 * DELETE /api/timeline-events/:id
 * Delete timeline event
 */
router.delete('/:id', authenticateJWT, timelineEventController.deleteTimelineEvent);

module.exports = router;
