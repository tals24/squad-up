const TimelineEvent = require('../models/TimelineEvent');

/**
 * Get all timeline events
 * @param {Object} user - User object (for filtering if needed)
 * @returns {Array} Timeline events
 */
exports.getAllTimelineEvents = async (user) => {
  const timelineEvents = await TimelineEvent.find()
    .populate('player', 'fullName kitNumber position')
    .populate({
      path: 'game',
      select: 'gameTitle opponent date',
      options: { strictPopulate: false }
    })
    .populate('author', 'fullName role')
    .sort({ date: -1 });

  return timelineEvents;
};

/**
 * Get timeline event by ID
 * @param {String} eventId - Timeline event ID
 * @returns {Object} Timeline event
 */
exports.getTimelineEventById = async (eventId) => {
  const timelineEvent = await TimelineEvent.findById(eventId)
    .populate('player', 'fullName kitNumber position')
    .populate({
      path: 'game',
      select: 'gameTitle opponent date',
      options: { strictPopulate: false }
    })
    .populate('author', 'fullName role');

  if (!timelineEvent) {
    throw new Error('Timeline event not found');
  }

  return timelineEvent;
};

/**
 * Create new timeline event
 * @param {Object} eventData - Timeline event data
 * @param {Object} user - User creating the event
 * @returns {Object} Created timeline event
 */
exports.createTimelineEvent = async (eventData, user) => {
  const { player, game, eventType, minutesPlayed, goals, assists, generalRating, generalNotes } = eventData;

  const timelineEvent = new TimelineEvent({
    player,
    game,
    author: user._id,
    eventType,
    minutesPlayed: minutesPlayed || 0,
    goals: goals || 0,
    assists: assists || 0,
    generalRating: generalRating || 3,
    generalNotes
  });

  await timelineEvent.save();
  await timelineEvent.populate('player', 'fullName kitNumber position');
  if (timelineEvent.game) {
    await timelineEvent.populate('game', 'gameTitle opponent date');
  }
  await timelineEvent.populate('author', 'fullName role');

  return timelineEvent;
};

/**
 * Update timeline event
 * @param {String} eventId - Timeline event ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated timeline event
 */
exports.updateTimelineEvent = async (eventId, updateData) => {
  const { eventType, minutesPlayed, goals, assists, generalRating, generalNotes } = updateData;

  const timelineEvent = await TimelineEvent.findByIdAndUpdate(
    eventId,
    { eventType, minutesPlayed, goals, assists, generalRating, generalNotes },
    { new: true }
  )
  .populate('player', 'fullName kitNumber position')
  .populate({
    path: 'game',
    select: 'gameTitle opponent date',
    options: { strictPopulate: false }
  })
  .populate('author', 'fullName role');

  if (!timelineEvent) {
    throw new Error('Timeline event not found');
  }

  return timelineEvent;
};

/**
 * Delete timeline event
 * @param {String} eventId - Timeline event ID
 * @returns {Object} Deleted timeline event
 */
exports.deleteTimelineEvent = async (eventId) => {
  const timelineEvent = await TimelineEvent.findByIdAndDelete(eventId);

  if (!timelineEvent) {
    throw new Error('Timeline event not found');
  }

  return timelineEvent;
};

