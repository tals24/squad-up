const TrainingSession = require('../../models/TrainingSession');
const Team = require('../../models/Team');

exports.getAllTrainingSessions = async (user) => {
  let query = {};

  if (user.role === 'Coach') {
    const teams = await Team.find({ coach: user._id });
    const teamIds = teams.map(team => team._id);
    query.team = { $in: teamIds };
  }

  const trainingSessions = await TrainingSession.find(query)
    .populate('team', 'teamName season division')
    .sort({ date: -1 });

  return trainingSessions;
};

exports.getTrainingSessionById = async (id) => {
  const trainingSession = await TrainingSession.findById(id)
    .populate('team', 'teamName season division');

  if (!trainingSession) {
    throw new Error('Training session not found');
  }

  return trainingSession;
};

exports.createTrainingSession = async (data) => {
  const { date, team, status, weekIdentifier, notes, duration, location, weather } = data;

  const teamDoc = await Team.findById(team);
  if (!teamDoc) {
    throw new Error('Team not found');
  }

  const trainingSession = new TrainingSession({
    date,
    team,
    teamName: teamDoc.teamName,
    status: status || 'Planned',
    weekIdentifier,
    notes,
    duration,
    location,
    weather
  });

  await trainingSession.save();
  await trainingSession.populate('team', 'teamName season division');

  return trainingSession;
};

exports.updateTrainingSession = async (id, updateData) => {
  const { date, status, weekIdentifier, notes, duration, location, weather } = updateData;

  const trainingSession = await TrainingSession.findByIdAndUpdate(
    id,
    { date, status, weekIdentifier, notes, duration, location, weather },
    { new: true }
  ).populate('team', 'teamName season division');

  if (!trainingSession) {
    throw new Error('Training session not found');
  }

  return trainingSession;
};

exports.deleteTrainingSession = async (id) => {
  const trainingSession = await TrainingSession.findByIdAndDelete(id);

  if (!trainingSession) {
    throw new Error('Training session not found');
  }

  return trainingSession;
};

