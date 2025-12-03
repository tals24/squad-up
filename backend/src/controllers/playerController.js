const playerService = require('../services/playerService');

exports.getAllPlayers = async (req, res, next) => {
  try {
    const players = await playerService.getAllPlayers(req.user, req.query);
    res.json({ success: true, data: players });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPlayerById = async (req, res, next) => {
  try {
    const player = await playerService.getPlayerById(req.params.id);
    res.json({ success: true, data: player });
  } catch (error) {
    if (error.message === 'Player not found') {
      return res.status(404).json({ error: 'Player not found' });
    }
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPlayer = async (req, res, next) => {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json({ success: true, data: player });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(400).json({ error: 'Team not found' });
    }
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    const player = await playerService.updatePlayer(req.params.id, req.body);
    res.json({ success: true, data: player });
  } catch (error) {
    if (error.message === 'Player not found') {
      return res.status(404).json({ error: 'Player not found' });
    }
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    await playerService.deletePlayer(req.params.id);
    res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    if (error.message === 'Player not found') {
      return res.status(404).json({ error: 'Player not found' });
    }
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

