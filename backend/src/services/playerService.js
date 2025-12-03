const mongoose = require('mongoose');
const Player = require('../models/Player');
const Team = require('../models/Team');

exports.getAllPlayers = async (user, filters) => {
  const { search, team } = filters;
  let query = {};

  console.log(`🔍 Player search - User: ${user.fullName} (${user.role}), Search: "${search}", Team: "${team}"`);

  // Apply team filter if specified
  if (team && team !== 'all') {
    query.team = new mongoose.Types.ObjectId(team);
  }

  // Apply search filter if specified
  if (search && search.trim()) {
    query.fullName = { $regex: search.trim(), $options: 'i' };
  }

  console.log(`🔍 Final query:`, JSON.stringify(query, null, 2));

  const players = await Player.find(query)
    .populate('team', 'teamName season division')
    .sort({ fullName: 1 });

  console.log(`🔍 Found ${players.length} players`);

  return players;
};

exports.getPlayerById = async (id) => {
  const player = await Player.findById(id)
    .populate('team', 'teamName season division');

  if (!player) {
    throw new Error('Player not found');
  }

  return player;
};

exports.createPlayer = async (data) => {
  const { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email } = data;

  const teamDoc = await Team.findById(team);
  if (!teamDoc) {
    throw new Error('Team not found');
  }

  const player = new Player({
    fullName,
    kitNumber,
    position,
    dateOfBirth,
    team,
    teamRecordID: teamDoc.teamID,
    nationalID,
    phoneNumber,
    email
  });

  await player.save();
  await player.populate('team', 'teamName season division');

  return player;
};

exports.updatePlayer = async (id, updateData) => {
  const { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email, profileImage } = updateData;

  const player = await Player.findByIdAndUpdate(
    id,
    { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email, profileImage },
    { new: true }
  ).populate('team', 'teamName season division');

  if (!player) {
    throw new Error('Player not found');
  }

  return player;
};

exports.deletePlayer = async (id) => {
  const player = await Player.findByIdAndDelete(id);

  if (!player) {
    throw new Error('Player not found');
  }

  return player;
};

