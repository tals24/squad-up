const timelineEventService = require('../services/timelineEventService');

/**
 * GET /api/timeline-events
 * Get all timeline events
 */
exports.getAllTimelineEvents = async (req, res, next) => {
  try {
    const timelineEvents = await timelineEventService.getAllTimelineEvents(req.user);

    res.json({
      success: true,
      data: timelineEvents
    });
  } catch (error) {
    console.error('Get timeline events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/timeline-events/:id
 * Get timeline event by ID
 */
exports.getTimelineEventById = async (req, res, next) => {
  try {
    const timelineEvent = await timelineEventService.getTimelineEventById(req.params.id);

    res.json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Get timeline event error:', error);
    
    if (error.message === 'Timeline event not found') {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/timeline-events
 * Create new timeline event
 */
exports.createTimelineEvent = async (req, res, next) => {
  try {
    const timelineEvent = await timelineEventService.createTimelineEvent(req.body, req.user);

    res.status(201).json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Create timeline event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/timeline-events/:id
 * Update timeline event
 */
exports.updateTimelineEvent = async (req, res, next) => {
  try {
    const timelineEvent = await timelineEventService.updateTimelineEvent(req.params.id, req.body);

    res.json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Update timeline event error:', error);
    
    if (error.message === 'Timeline event not found') {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/timeline-events/:id
 * Delete timeline event
 */
exports.deleteTimelineEvent = async (req, res, next) => {
  try {
    await timelineEventService.deleteTimelineEvent(req.params.id);

    res.json({
      success: true,
      message: 'Timeline event deleted successfully'
    });
  } catch (error) {
    console.error('Delete timeline event error:', error);
    
    if (error.message === 'Timeline event not found') {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

