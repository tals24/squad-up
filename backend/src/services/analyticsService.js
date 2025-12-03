const Goal = require('../models/Goal');
const Substitution = require('../models/Substitution');
const Card = require('../models/Card');
const Game = require('../models/Game');

exports.getGoalPartnerships = async (teamId, season) => {
  if (!teamId) {
    throw new Error('teamId is required');
  }

  const gameFilter = { teamId };
  if (season) {
    const seasonYear = parseInt(season.split('-')[0]);
    const seasonStart = new Date(seasonYear, 0, 1);
    const seasonEnd = new Date(seasonYear + 1, 0, 1);
    gameFilter.date = { $gte: seasonStart, $lt: seasonEnd };
  }

  const games = await Game.find(gameFilter).select('_id');
  const gameIds = games.map(g => g._id);

  const goals = await Goal.find({
    gameId: { $in: gameIds },
    assistedById: { $ne: null }
  })
    .populate('scorerId', 'name position')
    .populate('assistedById', 'name position')
    .populate('gameId', '_id date');

  const partnerships = {};

  for (const goal of goals) {
    const scorerId = goal.scorerId._id.toString();
    const assisterId = goal.assistedById._id.toString();
    const pairKey = `${scorerId}-${assisterId}`;

    if (!partnerships[pairKey]) {
      partnerships[pairKey] = {
        scorer: {
          id: goal.scorerId._id,
          name: goal.scorerId.name,
          position: goal.scorerId.position
        },
        assister: {
          id: goal.assistedById._id,
          name: goal.assistedById.name,
          position: goal.assistedById.position
        },
        goals: 0,
        games: [],
        minutes: []
      };
    }

    partnerships[pairKey].goals++;
    if (!partnerships[pairKey].games.includes(goal.gameId._id.toString())) {
      partnerships[pairKey].games.push(goal.gameId._id.toString());
    }
    partnerships[pairKey].minutes.push(goal.minute);
  }

  const partnershipsArray = Object.values(partnerships).map(p => ({
    ...p,
    avgMinute: p.minutes.reduce((a, b) => a + b, 0) / p.minutes.length,
    gameCount: p.games.length,
    minutes: undefined,
    games: undefined
  }));

  partnershipsArray.sort((a, b) => b.goals - a.goals);

  return {
    teamId,
    season: season || 'all',
    totalPartnerships: partnershipsArray.length,
    partnerships: partnershipsArray
  };
};

exports.getPlayerGoals = async (playerId, season) => {
  if (!playerId) {
    throw new Error('playerId is required');
  }

  let gameIds = null;
  if (season) {
    const seasonYear = parseInt(season.split('-')[0]);
    const seasonStart = new Date(seasonYear, 0, 1);
    const seasonEnd = new Date(seasonYear + 1, 0, 1);
    const games = await Game.find({
      date: { $gte: seasonStart, $lt: seasonEnd }
    }).select('_id');
    gameIds = games.map(g => g._id);
  }

  const goalFilter = { scorerId: playerId };
  if (gameIds) goalFilter.gameId = { $in: gameIds };

  const goalsScored = await Goal.find(goalFilter)
    .populate('assistedById', 'name')
    .populate('gameId', 'date opponent');

  const assistFilter = { assistedById: playerId };
  if (gameIds) assistFilter.gameId = { $in: gameIds };

  const assists = await Goal.find(assistFilter)
    .populate('scorerId', 'name')
    .populate('gameId', 'date opponent');

  const stats = {
    playerId,
    season: season || 'all',
    goalsScored: goalsScored.length,
    assists: assists.length,
    goalContributions: goalsScored.length + assists.length,
    goalsByType: {},
    goalsByMatchState: {},
    averageGoalMinute: 0
  };

  goalsScored.forEach(goal => {
    stats.goalsByType[goal.goalType] = (stats.goalsByType[goal.goalType] || 0) + 1;
    stats.goalsByMatchState[goal.matchState] = (stats.goalsByMatchState[goal.matchState] || 0) + 1;
  });

  if (goalsScored.length > 0) {
    const totalMinutes = goalsScored.reduce((sum, goal) => sum + goal.minute, 0);
    stats.averageGoalMinute = Math.round(totalMinutes / goalsScored.length);
  }

  return stats;
};

exports.getPlayerSubstitutions = async (playerId, season) => {
  if (!playerId) {
    throw new Error('playerId is required');
  }

  let gameIds = null;
  if (season) {
    const seasonYear = parseInt(season.split('-')[0]);
    const seasonStart = new Date(seasonYear, 0, 1);
    const seasonEnd = new Date(seasonYear + 1, 0, 1);
    const games = await Game.find({
      date: { $gte: seasonStart, $lt: seasonEnd }
    }).select('_id');
    gameIds = games.map(g => g._id);
  }

  const subOutFilter = { playerOutId: playerId };
  const subInFilter = { playerInId: playerId };
  if (gameIds) {
    subOutFilter.gameId = { $in: gameIds };
    subInFilter.gameId = { $in: gameIds };
  }

  const subsOff = await Substitution.find(subOutFilter)
    .populate('playerInId', 'name position')
    .populate('gameId', 'date');

  const subsOn = await Substitution.find(subInFilter)
    .populate('playerOutId', 'name position')
    .populate('gameId', 'date');

  const stats = {
    playerId,
    season: season || 'all',
    totalSubstitutions: subsOff.length + subsOn.length,
    timesSubbedOff: subsOff.length,
    timesComingOn: subsOn.length,
    avgSubOffMinute: 0,
    avgSubOnMinute: 0,
    substitutionReasons: {},
    impactAsSubstitute: {
      appearances: subsOn.length,
      avgMinutesPlayed: 0
    }
  };

  if (subsOff.length > 0) {
    const totalMinutes = subsOff.reduce((sum, sub) => sum + sub.minute, 0);
    stats.avgSubOffMinute = Math.round(totalMinutes / subsOff.length);
  }

  if (subsOn.length > 0) {
    const totalMinutes = subsOn.reduce((sum, sub) => sum + sub.minute, 0);
    stats.avgSubOnMinute = Math.round(totalMinutes / subsOn.length);
    
    const avgMinutesPlayed = subsOn.reduce((sum, sub) => {
      const minutesPlayed = 90 - sub.minute;
      return sum + minutesPlayed;
    }, 0) / subsOn.length;
    stats.impactAsSubstitute.avgMinutesPlayed = Math.round(avgMinutesPlayed);
  }

  subsOff.forEach(sub => {
    stats.substitutionReasons[sub.reason] = (stats.substitutionReasons[sub.reason] || 0) + 1;
  });

  return stats;
};

exports.getTeamDiscipline = async (teamId, season) => {
  if (!teamId) {
    throw new Error('teamId is required');
  }

  const gameFilter = { teamId };
  if (season) {
    const seasonYear = parseInt(season.split('-')[0]);
    const seasonStart = new Date(seasonYear, 0, 1);
    const seasonEnd = new Date(seasonYear + 1, 0, 1);
    gameFilter.date = { $gte: seasonStart, $lt: seasonEnd };
  }

  const games = await Game.find(gameFilter).select('_id');
  const gameIds = games.map(g => g._id);

  const actions = await Card.find({
    gameId: { $in: gameIds }
  }).populate('playerId', 'name position');

  const stats = {
    teamId,
    season: season || 'all',
    totalYellowCards: 0,
    totalRedCards: 0,
    totalSecondYellows: 0,
    mostCardedPlayers: [],
    cardsByMinute: {}
  };

  const playerCards = {};
  actions.forEach(action => {
    if (action.cardType === 'yellow') stats.totalYellowCards++;
    if (action.cardType === 'red') stats.totalRedCards++;
    if (action.cardType === 'second-yellow') stats.totalSecondYellows++;

    const playerId = action.playerId._id.toString();
    if (!playerCards[playerId]) {
      playerCards[playerId] = {
        player: {
          id: action.playerId._id,
          name: action.playerId.name,
          position: action.playerId.position
        },
        yellowCards: 0,
        redCards: 0,
        secondYellows: 0,
        totalCards: 0
      };
    }

    if (action.cardType === 'yellow') playerCards[playerId].yellowCards++;
    if (action.cardType === 'red') playerCards[playerId].redCards++;
    if (action.cardType === 'second-yellow') playerCards[playerId].secondYellows++;
    playerCards[playerId].totalCards++;
  });

  stats.mostCardedPlayers = Object.values(playerCards)
    .sort((a, b) => b.totalCards - a.totalCards)
    .slice(0, 10);

  return stats;
};

