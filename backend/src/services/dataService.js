const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Game = require('../models/Game');
const GameRoster = require('../models/GameRoster');
const TimelineEvent = require('../models/TimelineEvent');
const GameReport = require('../models/GameReport');
const ScoutReport = require('../models/ScoutReport');
const Drill = require('../models/Drill');
const Formation = require('../models/Formation');
const TrainingSession = require('../models/TrainingSession');
const SessionDrill = require('../models/SessionDrill');

exports.getAllData = async (user) => {
  console.log(`🔍 User ${user.fullName} (${user.role}) requesting data...`);
  
  const [
    users,
    teams,
    players,
    games,
    timelineEvents,
    gameReports,
    scoutReports,
    drills,
    gameRosters,
    trainingSessions,
    sessionDrills
  ] = await Promise.all([
    User.find().select('-password').lean().catch(err => { console.error('Users query error:', err); return []; }),
    Team.find().populate('coach', 'fullName email role').lean().catch(err => { console.error('Teams query error:', err); return []; }),
    Player.find().populate('team', 'teamName season division').lean().catch(err => { console.error('Players query error:', err); return []; }),
    Game.find().populate('team', 'teamName season division').lean().catch(err => { console.error('Games query error:', err); return []; }),
    TimelineEvent.find().populate('player game author').lean().catch(err => { console.error('TimelineEvents query error:', err); return []; }),
    GameReport.find().populate('player game author').lean().catch(err => { console.error('GameReports query error:', err); return []; }),
    ScoutReport.find().populate('player author').lean().catch(err => { console.error('ScoutReports query error:', err); return []; }),
    Drill.find().populate('author', 'fullName').lean().catch(err => { console.error('Drills query error:', err); return []; }),
    GameRoster.find().populate('game player').lean().catch(err => { console.error('GameRosters query error:', err); return []; }),
    TrainingSession.find().populate('team', 'teamName _id').lean().catch(err => { console.error('TrainingSessions query error:', err); return []; }),
    SessionDrill.find().populate('trainingSession drill').lean().catch(err => { console.error('SessionDrills query error:', err); return []; })
  ]);
  
  const allReports = [
    ...timelineEvents.map(event => ({ ...event, reportType: 'TimelineEvent' })),
    ...gameReports.map(report => ({ ...report, reportType: 'GameReport' })),
    ...scoutReports.map(report => ({ ...report, reportType: 'ScoutReport' }))
  ];

  console.log(`📊 Initial data counts - Users: ${users.length}, Teams: ${teams.length}, Players: ${players.length}, Games: ${games.length}, Reports: ${allReports.length}`);

  let filteredTeams = teams;
  let filteredPlayers = players;
  let filteredGames = games;
  let filteredReports = allReports;
  let filteredGameRosters = gameRosters;
  let filteredTrainingSessions = trainingSessions;

  if (user.role === 'Coach') {
    const coachTeamIds = teams.filter(team => team.coach && team.coach._id.toString() === user._id.toString()).map(team => team._id.toString());
    console.log(`🧑‍🏫 Coach ${user.fullName} has access to teams:`, coachTeamIds);
    
    filteredGames = games.filter(game => {
      if (!game.team || !game.team._id) return false;
      return coachTeamIds.includes(game.team._id.toString());
    });
    
    const coachPlayerIds = players.filter(player => {
      if (!player.team || !player.team._id) return false;
      return coachTeamIds.includes(player.team._id.toString());
    }).map(player => player._id.toString());
    
    filteredReports = allReports.filter(report => {
      if (!report.player || !report.player._id) return false;
      return coachPlayerIds.includes(report.player._id.toString());
    });
    
    const gameIds = filteredGames.map(game => game._id.toString());
    filteredGameRosters = gameRosters.filter(roster => {
      if (!roster.game || !roster.game._id) return false;
      return gameIds.includes(roster.game._id.toString());
    });
    
    filteredTrainingSessions = trainingSessions.filter(session => {
      if (!session.team || !session.team._id) return false;
      return coachTeamIds.includes(session.team._id.toString());
    });
    
    console.log(`📊 Coach data filtered: ${filteredPlayers.length} players, ${filteredGames.length} games, ${filteredReports.length} reports, ${filteredTrainingSessions.length} training sessions`);
  }

  const gamesWithTitles = filteredGames.map(game => ({
    ...game,
    gameTitle: `${game.teamName} vs ${game.opponent}`
  }));

  const filteredGameReports = filteredReports.filter(report => report.reportType === 'GameReport');
  
  return {
    users,
    teams: filteredTeams,
    players: filteredPlayers,
    games: gamesWithTitles,
    reports: filteredReports,
    gameReports: filteredGameReports,
    drills,
    gameRosters: filteredGameRosters,
    trainingSessions: filteredTrainingSessions,
    sessionDrills
  };
};

// Placeholder functions for Airtable sync compatibility
exports.airtableSync = async (action, tableName, recordId, data, user) => {
  let result = { success: false, data: null, error: null };

  switch (action) {
    case 'fetch':
      result = { success: true, data: { records: [] } };
      break;
    case 'fetchSingle':
      result = { success: true, data: { record: null } };
      break;
    case 'create':
      result = { success: true, data: { id: 'new-record-id' } };
      break;
    case 'update':
      result = { success: true, data: { id: recordId } };
      break;
    case 'delete':
      result = { success: true, data: { deleted: true } };
      break;
    default:
      result.error = 'Invalid action';
  }

  return result;
};

