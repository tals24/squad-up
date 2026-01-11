const formationService = require('../services/formationService');

exports.getAllFormations = async (req, res) => {
  try {
    const formations = await formationService.getAllFormations();
    res.json({ success: true, data: formations });
  } catch (error) {
    console.error('Get formations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFormationById = async (req, res) => {
  try {
    const formation = await formationService.getFormationById(req.params.id);
    res.json({ success: true, data: formation });
  } catch (error) {
    if (error.message === 'Formation not found') {
      return res.status(404).json({ error: 'Formation not found' });
    }
    console.error('Get formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createFormation = async (req, res) => {
  try {
    const formation = await formationService.createFormation(req.body, req.user);
    res.status(201).json({ success: true, data: formation });
  } catch (error) {
    console.error('Create formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFormation = async (req, res) => {
  try {
    const formation = await formationService.updateFormation(req.params.id, req.body);
    res.json({ success: true, data: formation });
  } catch (error) {
    if (error.message === 'Formation not found') {
      return res.status(404).json({ error: 'Formation not found' });
    }
    console.error('Update formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFormation = async (req, res) => {
  try {
    await formationService.deleteFormation(req.params.id);
    res.json({ success: true, message: 'Formation deleted successfully' });
  } catch (error) {
    if (error.message === 'Formation not found') {
      return res.status(404).json({ error: 'Formation not found' });
    }
    console.error('Delete formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

