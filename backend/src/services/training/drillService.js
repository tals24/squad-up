const Drill = require('../../models/Drill');

exports.getAllDrills = async () => {
  const drills = await Drill.find()
    .populate('author', 'fullName role')
    .sort({ drillName: 1 });

  return drills;
};

exports.getDrillById = async (id) => {
  const drill = await Drill.findById(id)
    .populate('author', 'fullName role');

  if (!drill) {
    throw new Error('Drill not found');
  }

  return drill;
};

exports.createDrill = async (data, user) => {
  const { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment } = data;

  const drill = new Drill({
    drillName,
    description,
    category,
    targetAgeGroup,
    videoLink,
    author: user._id,
    instructions,
    details,
    layoutData,
    duration,
    playersRequired,
    equipment: equipment || []
  });

  await drill.save();
  await drill.populate('author', 'fullName role');

  return drill;
};

exports.updateDrill = async (id, updateData) => {
  const { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment } = updateData;

  const drill = await Drill.findByIdAndUpdate(
    id,
    { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment },
    { new: true }
  ).populate('author', 'fullName role');

  if (!drill) {
    throw new Error('Drill not found');
  }

  return drill;
};

exports.deleteDrill = async (id) => {
  const drill = await Drill.findByIdAndDelete(id);

  if (!drill) {
    throw new Error('Drill not found');
  }

  return drill;
};

