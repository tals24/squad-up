const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Game = require('../models/Game');
const GameRoster = require('../models/GameRoster');
const TimelineEvent = require('../models/TimelineEvent');
const Drill = require('../models/Drill');
const Formation = require('../models/Formation');
const TrainingSession = require('../models/TrainingSession');
const SessionDrill = require('../models/SessionDrill');

const router = express.Router();

// Get all data (equivalent to fetchAllTables from Airtable)
router.get('/all', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    
    // Build queries based on user role
    let teamQuery = {};
    if (user.role === 'Coach') {
      teamQuery.coach = user._id;
    }

    // Fetch all data in parallel
    const [
      users,
      teams,
      players,
      games,
      reports,
      drills,
      gameRosters,
      trainingSessions,
      sessionDrills
    ] = await Promise.all([
      User.find().select('-password').lean(),
      Team.find(teamQuery).populate('coach', 'fullName email role').lean(),
      Player.find().populate('team', 'teamName season division').lean(),
      Game.find().populate('team', 'teamName season division').lean(),
      TimelineEvent.find().populate('player game author').lean(),
      Drill.find().populate('author', 'fullName').lean(),
      GameRoster.find().populate('game player').lean(),
      TrainingSession.find().populate('team', 'teamName').lean(),
      SessionDrill.find().populate('trainingSession drill').lean()
    ]);

    // Filter data based on user role
    let filteredTeams = teams;
    let filteredPlayers = players;
    let filteredGames = games;
    let filteredReports = reports;
    let filteredGameRosters = gameRosters;
    let filteredTrainingSessions = trainingSessions;

    if (user.role === 'Coach') {
      const teamIds = teams.map(team => team._id);
      filteredPlayers = players.filter(player => teamIds.includes(player.team._id));
      filteredGames = games.filter(game => teamIds.includes(game.team._id));
      filteredReports = reports.filter(report => 
        filteredPlayers.some(player => player._id.toString() === report.player._id.toString())
      );
      filteredGameRosters = gameRosters.filter(roster => 
        teamIds.includes(roster.game.team._id)
      );
      filteredTrainingSessions = trainingSessions.filter(session => 
        teamIds.includes(session.team._id)
      );
    }

    res.json({
      success: true,
      data: {
        users,
        teams: filteredTeams,
        players: filteredPlayers,
        games: filteredGames,
        reports: filteredReports,
        drills,
        gameRosters: filteredGameRosters,
        trainingSessions: filteredTrainingSessions,
        sessionDrills
      }
    });
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Airtable sync equivalent (for backward compatibility)
router.post('/airtable-sync', authenticateToken, async (req, res) => {
  try {
    const { action, tableName, recordId, data } = req.body;

    let result = { success: false, data: null, error: null };

    switch (action) {
      case 'fetch':
        result = await fetchTableData(tableName, req.user);
        break;
      case 'fetchSingle':
        result = await fetchSingleRecord(tableName, recordId, req.user);
        break;
      case 'create':
        result = await createRecord(tableName, data, req.user);
        break;
      case 'update':
        result = await updateRecord(tableName, recordId, data, req.user);
        break;
      case 'delete':
        result = await deleteRecord(tableName, recordId, req.user);
        break;
      default:
        result.error = 'Invalid action';
    }

    res.json(result);
  } catch (error) {
    console.error('Airtable sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Helper functions for Airtable sync
async function fetchTableData(tableName, user) {
  // This would implement the same logic as the /all endpoint
  // but return data in Airtable format for backward compatibility
  return { success: true, data: { records: [] } };
}

async function fetchSingleRecord(tableName, recordId, user) {
  return { success: true, data: { record: null } };
}

async function createRecord(tableName, data, user) {
  return { success: true, data: { id: 'new-record-id' } };
}

async function updateRecord(tableName, recordId, data, user) {
  return { success: true, data: { id: recordId } };
}

async function deleteRecord(tableName, recordId, user) {
  return { success: true, data: { deleted: true } };
}

module.exports = router;



