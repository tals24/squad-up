const teamService = require('../services/teamService');

exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTeamById = async (req, res, next) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    res.json({ success: true, data: team });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: 'Team not found' });
    }
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    if (error.message === 'Coach not found') {
      return res.status(400).json({ error: 'Coach not found' });
    }
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    res.json({ success: true, data: team });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: 'Team not found' });
    }
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    await teamService.deleteTeam(req.params.id);
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: 'Team not found' });
    }
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

