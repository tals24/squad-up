const drillService = require('../../services/training/drillService');

exports.getAllDrills = async (req, res, next) => {
  try {
    const drills = await drillService.getAllDrills();
    res.json({ success: true, data: drills });
  } catch (error) {
    console.error('Get drills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDrillById = async (req, res, next) => {
  try {
    const drill = await drillService.getDrillById(req.params.id);
    res.json({ success: true, data: drill });
  } catch (error) {
    if (error.message === 'Drill not found') {
      return res.status(404).json({ error: 'Drill not found' });
    }
    console.error('Get drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createDrill = async (req, res, next) => {
  try {
    const drill = await drillService.createDrill(req.body, req.user);
    res.status(201).json({ success: true, data: drill });
  } catch (error) {
    console.error('Create drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateDrill = async (req, res, next) => {
  try {
    const drill = await drillService.updateDrill(req.params.id, req.body);
    res.json({ success: true, data: drill });
  } catch (error) {
    if (error.message === 'Drill not found') {
      return res.status(404).json({ error: 'Drill not found' });
    }
    console.error('Update drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteDrill = async (req, res, next) => {
  try {
    await drillService.deleteDrill(req.params.id);
    res.json({ success: true, message: 'Drill deleted successfully' });
  } catch (error) {
    if (error.message === 'Drill not found') {
      return res.status(404).json({ error: 'Drill not found' });
    }
    console.error('Delete drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

