const Team = require('../models/Team');
const User = require('../models/User');

exports.getAllTeams = async () => {
  const teams = await Team.find()
    .populate('coach', 'fullName email role')
    .populate('divisionManager', 'fullName email role')
    .populate('departmentManager', 'fullName email role')
    .sort({ teamName: 1 });

  return teams;
};

exports.getTeamById = async (id) => {
  const team = await Team.findById(id)
    .populate('coach', 'fullName email role')
    .populate('divisionManager', 'fullName email role')
    .populate('departmentManager', 'fullName email role');

  if (!team) {
    throw new Error('Team not found');
  }

  return team;
};

exports.createTeam = async (data) => {
  const { teamName, season, division, coach, divisionManager, departmentManager } = data;

  if (coach) {
    const coachUser = await User.findById(coach);
    if (!coachUser) {
      throw new Error('Coach not found');
    }
  }

  const team = new Team({
    teamName,
    season,
    division,
    coach,
    divisionManager,
    departmentManager
  });

  await team.save();
  await team.populate('coach', 'fullName email role');
  await team.populate('divisionManager', 'fullName email role');
  await team.populate('departmentManager', 'fullName email role');

  return team;
};

exports.updateTeam = async (id, updateData) => {
  const { teamName, season, division, coach, divisionManager, departmentManager } = updateData;

  const team = await Team.findByIdAndUpdate(
    id,
    { teamName, season, division, coach, divisionManager, departmentManager },
    { new: true }
  )
  .populate('coach', 'fullName email role')
  .populate('divisionManager', 'fullName email role')
  .populate('departmentManager', 'fullName email role');

  if (!team) {
    throw new Error('Team not found');
  }

  return team;
};

exports.deleteTeam = async (id) => {
  const team = await Team.findByIdAndDelete(id);

  if (!team) {
    throw new Error('Team not found');
  }

  return team;
};

