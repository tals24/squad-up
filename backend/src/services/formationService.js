const Formation = require('../models/Formation');

exports.getAllFormations = async () => {
  const formations = await Formation.find()
    .populate('team', 'teamName season division')
    .populate('createdBy', 'fullName role')
    .sort({ formationName: 1 });

  return formations;
};

exports.getFormationById = async (id) => {
  const formation = await Formation.findById(id)
    .populate('team', 'teamName season division')
    .populate('createdBy', 'fullName role');

  if (!formation) {
    throw new Error('Formation not found');
  }

  return formation;
};

exports.createFormation = async (data, user) => {
  const { formationName, gameSize, formationLayout, team, description, isDefault } = data;

  const formation = new Formation({
    formationName,
    gameSize,
    formationLayout,
    team,
    createdBy: user._id,
    description,
    isDefault: isDefault || false
  });

  await formation.save();
  await formation.populate('team', 'teamName season division');
  await formation.populate('createdBy', 'fullName role');

  return formation;
};

exports.updateFormation = async (id, updateData) => {
  const { formationName, gameSize, formationLayout, description, isDefault } = updateData;

  const formation = await Formation.findByIdAndUpdate(
    id,
    { formationName, gameSize, formationLayout, description, isDefault },
    { new: true }
  )
  .populate('team', 'teamName season division')
  .populate('createdBy', 'fullName role');

  if (!formation) {
    throw new Error('Formation not found');
  }

  return formation;
};

exports.deleteFormation = async (id) => {
  const formation = await Formation.findByIdAndDelete(id);

  if (!formation) {
    throw new Error('Formation not found');
  }

  return formation;
};

