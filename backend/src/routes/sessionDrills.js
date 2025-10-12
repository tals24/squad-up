const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const SessionDrill = require('../models/SessionDrill');

const router = express.Router();

// Get all session drills
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const sessionDrills = await SessionDrill.find()
      .populate('trainingSession', 'sessionTitle date team')
      .populate('drill', 'drillName category targetAgeGroup')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: sessionDrills
    });
  } catch (error) {
    console.error('Get session drills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session drill by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionDrill = await SessionDrill.findById(req.params.id)
      .populate('trainingSession', 'sessionTitle date team')
      .populate('drill', 'drillName category targetAgeGroup');

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Get session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new session drill
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { trainingSession, drill, sessionPart, smallGameNotes, duration, order, notes } = req.body;

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

    res.status(201).json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Create session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session drill
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { sessionPart, smallGameNotes, duration, order, notes } = req.body;

    const sessionDrill = await SessionDrill.findByIdAndUpdate(
      req.params.id,
      { sessionPart, smallGameNotes, duration, order, notes },
      { new: true }
    )
    .populate('trainingSession', 'sessionTitle date team')
    .populate('drill', 'drillName category targetAgeGroup');

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Update session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session drill
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionDrill = await SessionDrill.findByIdAndDelete(req.params.id);

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      message: 'Session drill deleted successfully'
    });
  } catch (error) {
    console.error('Delete session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch operations for training plans
router.post('/batch', authenticateJWT, async (req, res) => {
  try {
    const { weeklyPlan, teamId, weekIdentifier } = req.body;
    
    console.log('📅 Saving training plan:', { teamId, weekIdentifier });
    console.log('📅 Weekly plan structure:', Object.keys(weeklyPlan || {}));
    
    if (!weeklyPlan || !teamId || !weekIdentifier) {
      return res.status(400).json({ error: 'Missing required fields: weeklyPlan, teamId, weekIdentifier' });
    }
    
    // First, delete existing session drills for this team and week
    const TrainingSession = require('../models/TrainingSession');
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
    
    for (const day of daysOfWeek) {
      const dayPlan = weeklyPlan[day];
      if (!dayPlan) {
        console.log(`📅 No plan for ${day}, skipping`);
        continue;
      }
      
      console.log(`📅 Processing ${day}:`, Object.keys(dayPlan));
      
      // Create training session for this day
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + daysOfWeek.indexOf(day));
      
      // Get team name for the session title
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      const teamName = team ? team.teamName : 'Training Session';
      
      // Generate session title manually
      const dateStr = sessionDate.toLocaleDateString('en-GB');
      const sessionTitle = `${teamName} - ${dateStr}`;
      
      const trainingSession = new TrainingSession({
        date: sessionDate,
        team: teamId,
        teamName: teamName,
        sessionTitle: sessionTitle,
        status: 'Planned',
        weekIdentifier: weekIdentifier,
        notes: dayPlan["Small Game"]?.notes || ''
      });
      
      await trainingSession.save();
      console.log(`📅 Created training session for ${day}:`, trainingSession._id, `Title: ${trainingSession.sessionTitle}`);
      
      // Create session drills for each slot
      for (const slot of sessionSlots) {
        const slotData = dayPlan[slot];
        if (!slotData || !slotData.drills || slotData.drills.length === 0) {
          console.log(`📅 No drills for ${day} ${slot}`);
          continue;
        }
        
        console.log(`📅 Processing ${day} ${slot}: ${slotData.drills.length} drills`);
        
        for (let i = 0; i < slotData.drills.length; i++) {
          const drill = slotData.drills[i];
          console.log(`📅 Drill ${i}:`, drill);
          
          // Handle both MongoDB _id and legacy id formats
          const drillId = drill._id || drill.id;
          if (!drillId) {
            console.error('Missing drill ID for drill:', drill);
            continue;
          }
          
          const sessionDrill = new SessionDrill({
            trainingSession: trainingSession._id,
            drill: drillId,
            sessionPart: slot,
            drillName: drill.DrillName || drill.drillName,
            smallGameNotes: slot === "Small Game" ? slotData.notes : null,
            order: i
          });
          
          await sessionDrill.save();
          sessionDrills.push(sessionDrill);
          console.log(`📅 Created session drill:`, sessionDrill._id);
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        message: 'Training plan saved successfully',
        sessionDrills: sessionDrills.length,
        weekIdentifier
      }
    });
  } catch (error) {
    console.error('Batch save training plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load training plan
router.get('/plan/:teamId/:weekIdentifier', authenticateJWT, async (req, res) => {
  try {
    const { teamId, weekIdentifier } = req.params;
    
    console.log('📅 Loading training plan:', { teamId, weekIdentifier });
    
    // Find training sessions for this team and week
    const TrainingSession = require('../models/TrainingSession');
    const sessions = await TrainingSession.find({ 
      team: teamId, 
      weekIdentifier: weekIdentifier 
    });
    
    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          weeklyPlan: null,
          hasSavedData: false
        }
      });
    }
    
    // Get session drills for these sessions
    const sessionIds = sessions.map(s => s._id);
    const sessionDrills = await SessionDrill.find({ 
      trainingSession: { $in: sessionIds } 
    }).populate('drill', 'drillName category targetAgeGroup');
    
    // Reconstruct the weekly plan structure
    const weeklyPlan = {
      Sunday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Monday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Tuesday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Wednesday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Thursday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Friday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
      Saturday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } }
    };
    
    // Group session drills by day and slot
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const day = daysOfWeek[i % 7]; // Simple mapping, might need adjustment
      
      const dayDrills = sessionDrills.filter(sd => 
        sd.trainingSession.toString() === session._id.toString()
      );
      
      for (const sessionDrill of dayDrills) {
        const drillData = {
          id: sessionDrill.drill._id,
          DrillName: sessionDrill.drillName
        };
        
        weeklyPlan[day][sessionDrill.sessionPart].drills.push(drillData);
        
        if (sessionDrill.sessionPart === "Small Game" && sessionDrill.smallGameNotes) {
          weeklyPlan[day]["Small Game"].notes = sessionDrill.smallGameNotes;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        weeklyPlan,
        hasSavedData: true
      }
    });
  } catch (error) {
    console.error('Load training plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

