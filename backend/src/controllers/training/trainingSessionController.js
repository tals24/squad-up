const trainingSessionService = require('../../services/training/trainingSessionService');

exports.getAllTrainingSessions = async (req, res, next) => {
  try {
    const trainingSessions = await trainingSessionService.getAllTrainingSessions(req.user);
    res.json({ success: true, data: trainingSessions });
  } catch (error) {
    console.error('Get training sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTrainingSessionById = async (req, res, next) => {
  try {
    const trainingSession = await trainingSessionService.getTrainingSessionById(req.params.id);
    res.json({ success: true, data: trainingSession });
  } catch (error) {
    if (error.message === 'Training session not found') {
      return res.status(404).json({ error: 'Training session not found' });
    }
    console.error('Get training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createTrainingSession = async (req, res, next) => {
  try {
    const trainingSession = await trainingSessionService.createTrainingSession(req.body);
    res.status(201).json({ success: true, data: trainingSession });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(400).json({ error: 'Team not found' });
    }
    console.error('Create training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTrainingSession = async (req, res, next) => {
  try {
    const trainingSession = await trainingSessionService.updateTrainingSession(req.params.id, req.body);
    res.json({ success: true, data: trainingSession });
  } catch (error) {
    if (error.message === 'Training session not found') {
      return res.status(404).json({ error: 'Training session not found' });
    }
    console.error('Update training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTrainingSession = async (req, res, next) => {
  try {
    await trainingSessionService.deleteTrainingSession(req.params.id);
    res.json({ success: true, message: 'Training session deleted successfully' });
  } catch (error) {
    if (error.message === 'Training session not found') {
      return res.status(404).json({ error: 'Training session not found' });
    }
    console.error('Delete training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

