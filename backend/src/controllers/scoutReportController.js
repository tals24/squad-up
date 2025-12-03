const scoutReportService = require('../services/scoutReportService');

exports.getAllScoutReports = async (req, res) => {
  try {
    const scoutReports = await scoutReportService.getAllScoutReports();
    res.json({ success: true, data: scoutReports });
  } catch (error) {
    console.error('Get scout reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getScoutReportById = async (req, res) => {
  try {
    const scoutReport = await scoutReportService.getScoutReportById(req.params.id);
    res.json({ success: true, data: scoutReport });
  } catch (error) {
    if (error.message === 'Scout report not found') {
      return res.status(404).json({ error: 'Scout report not found' });
    }
    console.error('Get scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createScoutReport = async (req, res) => {
  try {
    const scoutReport = await scoutReportService.createScoutReport(req.body, req.user);
    res.status(201).json({ success: true, data: scoutReport });
  } catch (error) {
    console.error('Create scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateScoutReport = async (req, res) => {
  try {
    const scoutReport = await scoutReportService.updateScoutReport(req.params.id, req.body);
    res.json({ success: true, data: scoutReport });
  } catch (error) {
    if (error.message === 'Scout report not found') {
      return res.status(404).json({ error: 'Scout report not found' });
    }
    console.error('Update scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteScoutReport = async (req, res) => {
  try {
    await scoutReportService.deleteScoutReport(req.params.id);
    res.json({ success: true, message: 'Scout report deleted successfully' });
  } catch (error) {
    if (error.message === 'Scout report not found') {
      return res.status(404).json({ error: 'Scout report not found' });
    }
    console.error('Delete scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

