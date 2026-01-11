const analyticsService = require('../services/analyticsService');

exports.getGoalPartnerships = async (req, res) => {
  try {
    const { teamId, season } = req.query;
    const result = await analyticsService.getGoalPartnerships(teamId, season);
    res.json(result);
  } catch (error) {
    if (error.message === 'teamId is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching goal partnerships:', error);
    res.status(500).json({ message: 'Failed to fetch goal partnerships', error: error.message });
  }
};

exports.getPlayerGoals = async (req, res) => {
  try {
    const { playerId, season } = req.query;
    const result = await analyticsService.getPlayerGoals(playerId, season);
    res.json(result);
  } catch (error) {
    if (error.message === 'playerId is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching player goals:', error);
    res.status(500).json({ message: 'Failed to fetch player goals', error: error.message });
  }
};

exports.getPlayerSubstitutions = async (req, res) => {
  try {
    const { playerId, season } = req.query;
    const result = await analyticsService.getPlayerSubstitutions(playerId, season);
    res.json(result);
  } catch (error) {
    if (error.message === 'playerId is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching player substitutions:', error);
    res.status(500).json({ message: 'Failed to fetch player substitutions', error: error.message });
  }
};

exports.getTeamDiscipline = async (req, res) => {
  try {
    const { teamId, season } = req.query;
    const result = await analyticsService.getTeamDiscipline(teamId, season);
    res.json(result);
  } catch (error) {
    if (error.message === 'teamId is required') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error fetching team discipline:', error);
    res.status(500).json({ message: 'Failed to fetch team discipline', error: error.message });
  }
};

