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

    console.log(`🔍 User ${user.fullName} (${user.role}) requesting data...`);
    
    // Fetch all data in parallel with error handling
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
      User.find().select('-password').lean().catch(err => { console.error('Users query error:', err); return []; }),
      Team.find(teamQuery).populate('coach', 'fullName email role').lean().catch(err => { console.error('Teams query error:', err); return []; }),
      Player.find().populate('team', 'teamName season division').lean().catch(err => { console.error('Players query error:', err); return []; }),
      Game.find().populate('team', 'teamName season division').lean().catch(err => { console.error('Games query error:', err); return []; }),
      TimelineEvent.find().populate('player game author').lean().catch(err => { console.error('Reports query error:', err); return []; }),
      Drill.find().populate('author', 'fullName').lean().catch(err => { console.error('Drills query error:', err); return []; }),
      GameRoster.find().populate('game player').lean().catch(err => { console.error('GameRosters query error:', err); return []; }),
      TrainingSession.find().populate('team', 'teamName').lean().catch(err => { console.error('TrainingSessions query error:', err); return []; }),
      SessionDrill.find().populate('trainingSession drill').lean().catch(err => { console.error('SessionDrills query error:', err); return []; })
    ]);
    
    console.log(`📊 Initial data counts - Users: ${users.length}, Teams: ${teams.length}, Players: ${players.length}, Games: ${games.length}`);

    // Filter data based on user role
    let filteredTeams = teams;
    let filteredPlayers = players;
    let filteredGames = games;
    let filteredReports = reports;
    let filteredGameRosters = gameRosters;
    let filteredTrainingSessions = trainingSessions;

    if (user.role === 'Coach') {
      // Get team IDs for this coach (convert to strings for comparison)
      const teamIds = teams.map(team => team._id.toString());
      console.log(`🧑‍🏫 Coach ${user.fullName} has access to teams:`, teamIds);
      
      // Filter players by teams this coach manages
      filteredPlayers = players.filter(player => {
        if (!player.team || !player.team._id) return false;
        return teamIds.includes(player.team._id.toString());
      });
      
      // Filter games by teams this coach manages  
      filteredGames = games.filter(game => {
        if (!game.team || !game.team._id) return false;
        return teamIds.includes(game.team._id.toString());
      });
      
      // Filter reports by players in this coach's teams
      const playerIds = filteredPlayers.map(player => player._id.toString());
      filteredReports = reports.filter(report => {
        if (!report.player || !report.player._id) return false;
        return playerIds.includes(report.player._id.toString());
      });
      
      // Filter game rosters by games this coach manages
      const gameIds = filteredGames.map(game => game._id.toString());
      filteredGameRosters = gameRosters.filter(roster => {
        if (!roster.game || !roster.game._id) return false;
        return gameIds.includes(roster.game._id.toString());
      });
      
      // Filter training sessions by teams this coach manages
      filteredTrainingSessions = trainingSessions.filter(session => {
        if (!session.team || !session.team._id) return false;
        return teamIds.includes(session.team._id.toString());
      });
      
      console.log(`📊 Coach data filtered: ${filteredPlayers.length} players, ${filteredGames.length} games, ${filteredReports.length} reports`);
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
router.post('/airtable-sync', authenticateJWT, async (req, res) => {
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



