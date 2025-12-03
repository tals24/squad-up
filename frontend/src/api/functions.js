// Phase 2 - Using custom backend API
import * as dataService from './dataService';

// Export all data service functions
// Removed airtableSync - now using MongoDB backend
export const initializeGameRoster = dataService.initializeGameRoster;
export const fetchAllTables = dataService.fetchAllTables;
export const saveTrainingPlan = dataService.saveTrainingPlan;
export const loadTrainingPlan = dataService.loadTrainingPlan;
export const getPlayersForTeam = dataService.getPlayersForTeam;
export const searchAllPlayers = dataService.searchAllPlayers;

// Export additional functions for direct use
export const getUsers = dataService.getUsers;
export const createUser = dataService.createUser;
export const updateUser = dataService.updateUser;
export const deleteUser = dataService.deleteUser;

export const getTeams = dataService.getTeams;
export const createTeam = dataService.createTeam;
export const updateTeam = dataService.updateTeam;
export const deleteTeam = dataService.deleteTeam;

export const getPlayers = dataService.getPlayers;
export const createPlayer = dataService.createPlayer;
export const updatePlayer = dataService.updatePlayer;
export const deletePlayer = dataService.deletePlayer;

export const getGames = dataService.getGames;
export const createGame = dataService.createGame;
export const updateGame = dataService.updateGame;
export const deleteGame = dataService.deleteGame;

export const getGameRosters = dataService.getGameRosters;
export const createGameRoster = dataService.createGameRoster;
export const updateGameRoster = dataService.updateGameRoster;
export const deleteGameRoster = dataService.deleteGameRoster;

export const getTimelineEvents = dataService.getTimelineEvents;
export const createTimelineEvent = dataService.createTimelineEvent;
export const updateTimelineEvent = dataService.updateTimelineEvent;
export const deleteTimelineEvent = dataService.deleteTimelineEvent;

// Report functions - now using separate endpoints
export const createGameReport = dataService.createGameReport;
export const createScoutReport = dataService.createScoutReport;
export const getGameReports = dataService.getGameReports;
export const getScoutReports = dataService.getScoutReports;

// Legacy alias for backward compatibility (will be removed)
export const createReport = dataService.createScoutReport;

export const getDrills = dataService.getDrills;
export const createDrill = dataService.createDrill;
export const updateDrill = dataService.updateDrill;
export const deleteDrill = dataService.deleteDrill;

export const getFormations = dataService.getFormations;
export const createFormation = dataService.createFormation;
export const updateFormation = dataService.updateFormation;
export const deleteFormation = dataService.deleteFormation;

export const getTrainingSessions = dataService.getTrainingSessions;
export const createTrainingSession = dataService.createTrainingSession;
export const updateTrainingSession = dataService.updateTrainingSession;
export const deleteTrainingSession = dataService.deleteTrainingSession;

export const getSessionDrills = dataService.getSessionDrills;
export const createSessionDrill = dataService.createSessionDrill;
export const updateSessionDrill = dataService.updateSessionDrill;
export const deleteSessionDrill = dataService.deleteSessionDrill;

