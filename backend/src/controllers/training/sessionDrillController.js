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

exports.batchSaveTrainingPlan = async (req, res, next) => {
  try {
    const sessionDrills = await sessionDrillService.batchSaveTrainingPlan(req.body);
    res.json({ success: true, data: sessionDrills, message: `Saved ${sessionDrills.length} session drills` });
  } catch (error) {
    console.error('Batch save training plan error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

