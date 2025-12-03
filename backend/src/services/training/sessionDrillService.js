const SessionDrill = require('../../models/SessionDrill');
const TrainingSession = require('../../models/TrainingSession');

/**
 * Get all session drills
 */
exports.getAllSessionDrills = async () => {
  const sessionDrills = await SessionDrill.find()
    .populate('trainingSession', 'sessionTitle date team')
    .populate('drill', 'drillName category targetAgeGroup')
    .sort({ order: 1 });

  return sessionDrills;
};

/**
 * Get session drill by ID
 */
exports.getSessionDrillById = async (id) => {
  const sessionDrill = await SessionDrill.findById(id)
    .populate('trainingSession', 'sessionTitle date team')
    .populate('drill', 'drillName category targetAgeGroup');

  if (!sessionDrill) {
    throw new Error('Session drill not found');
  }

  return sessionDrill;
};

/**
 * Create new session drill
 */
exports.createSessionDrill = async (data) => {
  const { trainingSession, drill, sessionPart, smallGameNotes, duration, order, notes } = data;

  const sessionDrill = new SessionDrill({
    trainingSession,
    drill,
    sessionPart,
    smallGameNotes,
    duration,
    order: order || 0,
    notes
  });

  await sessionDrill.save();
  await sessionDrill.populate('trainingSession', 'sessionTitle date team');
  await sessionDrill.populate('drill', 'drillName category targetAgeGroup');

  return sessionDrill;
};

/**
 * Update session drill
 */
exports.updateSessionDrill = async (id, updateData) => {
  const { sessionPart, smallGameNotes, duration, order, notes } = updateData;

  const sessionDrill = await SessionDrill.findByIdAndUpdate(
    id,
    { sessionPart, smallGameNotes, duration, order, notes },
    { new: true }
  )
  .populate('trainingSession', 'sessionTitle date team')
  .populate('drill', 'drillName category targetAgeGroup');

  if (!sessionDrill) {
    throw new Error('Session drill not found');
  }

  return sessionDrill;
};

/**
 * Delete session drill
 */
exports.deleteSessionDrill = async (id) => {
  const sessionDrill = await SessionDrill.findByIdAndDelete(id);

  if (!sessionDrill) {
    throw new Error('Session drill not found');
  }

  return sessionDrill;
};

/**
 * Batch operations for training plans
 */
exports.batchSaveTrainingPlan = async (batchData) => {
  const { weeklyPlan, teamId, weekIdentifier } = batchData;
  
  console.log('📅 Saving training plan:', { teamId, weekIdentifier });
  console.log('📅 Weekly plan structure:', Object.keys(weeklyPlan || {}));
  
  if (!weeklyPlan || !teamId || !weekIdentifier) {
    throw new Error('Missing required fields: weeklyPlan, teamId, weekIdentifier');
  }
  
  // First, delete existing session drills for this team and week
  const existingSessions = await TrainingSession.find({ 
    team: teamId, 
    weekIdentifier: weekIdentifier 
  });
  
  if (existingSessions.length > 0) {
    const sessionIds = existingSessions.map(s => s._id);
    await SessionDrill.deleteMany({ trainingSession: { $in: sessionIds } });
    await TrainingSession.deleteMany({ _id: { $in: sessionIds } });
  }
  
  // Create new training sessions and session drills
  const sessionDrills = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sessionSlots = ["Warm-up", "Main Part", "Small Game"];
  
  for (const [dayIndex, daySchedule] of Object.entries(weeklyPlan)) {
    if (!daySchedule.isTrainingDay) continue;
    
    const dayName = daysOfWeek[parseInt(dayIndex)];
    const session = await TrainingSession.create({
      team: teamId,
      weekIdentifier,
      date: new Date(), // Would be calculated based on weekIdentifier
      status: 'Planned'
    });
    
    for (const slot of sessionSlots) {
      const drillId = daySchedule[slot.toLowerCase().replace(' ', '_')];
      if (drillId) {
        const sessionDrill = await SessionDrill.create({
          trainingSession: session._id,
          drill: drillId,
          sessionPart: slot,
          order: sessionSlots.indexOf(slot)
        });
        await sessionDrill.populate('drill trainingSession');
        sessionDrills.push(sessionDrill);
      }
    }
  }
  
  return sessionDrills;
};

