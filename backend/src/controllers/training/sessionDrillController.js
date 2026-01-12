const sessionDrillService = require('../../services/training/sessionDrillService');

exports.getAllSessionDrills = async (req, res, next) => {
  try {
    const sessionDrills = await sessionDrillService.getAllSessionDrills();
    res.json({ success: true, data: sessionDrills });
  } catch (error) {
    console.error('Get session drills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSessionDrillById = async (req, res, next) => {
  try {
    const sessionDrill = await sessionDrillService.getSessionDrillById(req.params.id);
    res.json({ success: true, data: sessionDrill });
  } catch (error) {
    if (error.message === 'Session drill not found') {
      return res.status(404).json({ error: 'Session drill not found' });
    }
    console.error('Get session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createSessionDrill = async (req, res, next) => {
  try {
    const sessionDrill = await sessionDrillService.createSessionDrill(req.body);
    res.status(201).json({ success: true, data: sessionDrill });
  } catch (error) {
    console.error('Create session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateSessionDrill = async (req, res, next) => {
  try {
    const sessionDrill = await sessionDrillService.updateSessionDrill(req.params.id, req.body);
    res.json({ success: true, data: sessionDrill });
  } catch (error) {
    if (error.message === 'Session drill not found') {
      return res.status(404).json({ error: 'Session drill not found' });
    }
    console.error('Update session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteSessionDrill = async (req, res, next) => {
  try {
    await sessionDrillService.deleteSessionDrill(req.params.id);
    res.json({ success: true, message: 'Session drill deleted successfully' });
  } catch (error) {
    if (error.message === 'Session drill not found') {
      return res.status(404).json({ error: 'Session drill not found' });
    }
    console.error('Delete session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTrainingPlan = async (req, res, next) => {
  try {
    const { teamId, weekId } = req.params;

    // Validate parameters
    if (!teamId || !weekId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: teamId and weekId'
      });
    }

    console.log('📅 [Controller] Loading training plan:', { teamId, weekId });

    // Call service
    const planData = await sessionDrillService.getTrainingPlanByTeamAndWeek(teamId, weekId);

    // Always return 200 OK (empty plan is valid, not an error)
    res.status(200).json({
      success: true,
      data: planData
    });
  } catch (error) {
    console.error('Get training plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.batchSaveTrainingPlan = async (req, res, next) => {
  try {
    const sessionDrills = await sessionDrillService.batchSaveTrainingPlan(req.body);
    res.json({ success: true, data: sessionDrills, message: `Saved ${sessionDrills.length} session drills` });
  } catch (error) {
    console.error('Batch save training plan error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

