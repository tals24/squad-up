const SessionDrill = require('../../models/SessionDrill');
const TrainingSession = require('../../models/TrainingSession');
const Team = require('../../models/Team');

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
 * Get training plan by team and week identifier
 * Returns plan structure matching frontend format
 */
exports.getTrainingPlanByTeamAndWeek = async (teamId, weekIdentifier) => {
  console.log('📅 Loading training plan:', { teamId, weekIdentifier });
  
  // Find all training sessions for this team and week
  const sessions = await TrainingSession.find({
    team: teamId,
    weekIdentifier: weekIdentifier
  }).sort({ date: 1 }); // Sort by date to maintain day order

  // If no sessions found, return empty structure
  if (!sessions || sessions.length === 0) {
    console.log('📅 No sessions found, returning empty structure');
    return {
      hasSavedData: false,
      weeklyPlan: getInitialPlanStructure()
    };
  }

  console.log('📅 Found sessions:', sessions.length);

  // Get all session drills for these sessions
  const sessionIds = sessions.map(s => s._id);
  const sessionDrills = await SessionDrill.find({
    trainingSession: { $in: sessionIds }
  })
    .populate('drill', 'drillName category targetAgeGroup _id')
    .populate('trainingSession', 'date')
    .sort({ order: 1 });

  console.log('📅 Found session drills:', sessionDrills.length);

  // Transform to frontend format
  const weeklyPlan = getInitialPlanStructure();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group drills by session (day)
  sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    const dayIndex = sessionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = daysOfWeek[dayIndex];

    // Get drills for this session
    const drillsForSession = sessionDrills.filter(
      sd => sd.trainingSession._id.toString() === session._id.toString()
    );

    console.log(`📅 Day ${dayName}: ${drillsForSession.length} drills`);

    // Group drills by sessionPart
    drillsForSession.forEach(sessionDrill => {
      const sessionPart = sessionDrill.sessionPart; // 'Warm-up', 'Main Part', 'Small Game'
      
      if (!weeklyPlan[dayName][sessionPart]) {
        weeklyPlan[dayName][sessionPart] = { drills: [], notes: '' };
      }

      // Add drill to array
      if (sessionDrill.drill) {
        weeklyPlan[dayName][sessionPart].drills.push({
          _id: sessionDrill.drill._id.toString(),
          drillName: sessionDrill.drill.drillName,
          category: sessionDrill.drill.category,
          targetAgeGroup: sessionDrill.drill.targetAgeGroup
        });
      }

      // Extract notes for 'Small Game' part
      if (sessionPart === 'Small Game' && sessionDrill.smallGameNotes) {
        weeklyPlan[dayName][sessionPart].notes = sessionDrill.smallGameNotes;
      }
    });
  });

  console.log('📅 Returning plan with data');
  return {
    hasSavedData: true,
    weeklyPlan
  };
};

/**
 * Get initial empty plan structure
 */
function getInitialPlanStructure() {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sessionParts = ['Warm-up', 'Main Part', 'Small Game'];
  
  const structure = {};
  daysOfWeek.forEach(day => {
    structure[day] = {};
    sessionParts.forEach(part => {
      structure[day][part] = { drills: [], notes: '' };
    });
  });
  
  return structure;
}

/**
 * Batch operations for training plans (FIXED VERSION)
 */
exports.batchSaveTrainingPlan = async (batchData) => {
  const { weeklyPlan, teamId, weekIdentifier } = batchData;
  
  console.log('📅 Saving training plan:', { teamId, weekIdentifier });
  console.log('📅 Weekly plan structure:', Object.keys(weeklyPlan || {}));
  
  if (!weeklyPlan || !teamId || !weekIdentifier) {
    throw new Error('Missing required fields: weeklyPlan, teamId, weekIdentifier');
  }
  
  // Look up team to get teamName (required field)
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  
  console.log('📅 Found team:', team.teamName);
  
  // First, delete existing session drills for this team and week
  const existingSessions = await TrainingSession.find({ 
    team: teamId, 
    weekIdentifier: weekIdentifier 
  });
  
  if (existingSessions.length > 0) {
    console.log('📅 Deleting existing sessions:', existingSessions.length);
    const sessionIds = existingSessions.map(s => s._id);
    await SessionDrill.deleteMany({ trainingSession: { $in: sessionIds } });
    await TrainingSession.deleteMany({ _id: { $in: sessionIds } });
  }
  
  // Create new training sessions and session drills
  const sessionDrills = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sessionSlots = ['Warm-up', 'Main Part', 'Small Game'];
  
  // Calculate the start date of the week from weekIdentifier (format: YYYY-WW)
  const [year, week] = weekIdentifier.split('-').map(Number);
  const startDate = getDateOfISOWeek(week, year);
  console.log(`📅 Week ${week}/${year} starts on: ${startDate.toLocaleDateString('en-GB')} (${daysOfWeek[startDate.getDay()]})`);
  
  // FIX: dayName IS the key (e.g., "Sunday"), not dayIndex
  for (const [dayName, daySchedule] of Object.entries(weeklyPlan)) {
    // Check if this day has any drills
    const hasAnyDrills = sessionSlots.some(slot => {
      const drillsArray = daySchedule[slot]?.drills || [];
      return drillsArray.length > 0;
    });
    
    // Skip days with no drills
    if (!hasAnyDrills) {
      console.log(`📅 Skipping ${dayName} - no drills`);
      continue;
    }
    
    console.log(`📅 Processing ${dayName}`);
    
    // Calculate the actual date for this day
    const dayIndex = daysOfWeek.indexOf(dayName);
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + dayIndex);
    console.log(`📅   ${dayName} (index ${dayIndex}) → ${sessionDate.toLocaleDateString('en-GB')} (${daysOfWeek[sessionDate.getDay()]})`);
    
    // FIX: Add teamName and sessionTitle fields (required by model)
    const session = await TrainingSession.create({
      team: teamId,
      teamName: team.teamName,
      sessionTitle: `${team.teamName} - ${sessionDate.toLocaleDateString('en-GB')}`,
      weekIdentifier,
      date: sessionDate,
      status: 'Planned'
    });
    
    console.log(`📅 Created session for ${dayName}:`, session._id);
    
    // FIX: Access drills array correctly from daySchedule structure
    for (const slot of sessionSlots) {
      const slotData = daySchedule[slot];
      const drillsArray = slotData?.drills || [];
      const notes = slotData?.notes || '';
      
      console.log(`📅   ${slot}: ${drillsArray.length} drills`);
      
      for (let i = 0; i < drillsArray.length; i++) {
        const drill = drillsArray[i];
        console.log(`📅     🔍 DEBUG drill object:`, JSON.stringify(drill, null, 2));
        try {
          const sessionDrill = await SessionDrill.create({
            trainingSession: session._id,
            drill: drill._id,
            drillName: drill.drillName,
            sessionPart: slot,
            order: i,
            smallGameNotes: slot === 'Small Game' ? notes : null
          });
          await sessionDrill.populate('drill trainingSession');
          sessionDrills.push(sessionDrill);
          console.log(`📅     ✅ Created drill: ${drill.drillName}`);
        } catch (error) {
          console.error(`📅     ❌ Failed to create drill:`, error.message);
        }
      }
    }
  }
  
  console.log('📅 Saved training plan successfully:', sessionDrills.length, 'drills');
  return sessionDrills;
};

/**
 * Helper function to get the Sunday of a given ISO week
 * Note: The app uses Sunday as the first day of the week
 */
function getDateOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  let ISOweekStart = simple;
  
  // Calculate Monday first (ISO week standard)
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  // Adjust to Sunday (go back 1 day from Monday)
  ISOweekStart.setDate(ISOweekStart.getDate() - 1);
  
  return ISOweekStart;
}