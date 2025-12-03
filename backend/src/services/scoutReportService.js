const ScoutReport = require('../models/ScoutReport');

exports.getAllScoutReports = async () => {
  const scoutReports = await ScoutReport.find()
    .populate('player', 'fullName kitNumber position')
    .populate({
      path: 'game',
      select: 'gameTitle opponent date',
      options: { strictPopulate: false }
    })
    .populate('author', 'fullName role')
    .sort({ date: -1 });

  return scoutReports;
};

exports.getScoutReportById = async (id) => {
  const scoutReport = await ScoutReport.findById(id)
    .populate('player', 'fullName kitNumber position')
    .populate({
      path: 'game',
      select: 'gameTitle opponent date',
      options: { strictPopulate: false }
    })
    .populate('author', 'fullName role');

  if (!scoutReport) {
    throw new Error('Scout report not found');
  }

  return scoutReport;
};

exports.createScoutReport = async (data, user) => {
  const { player, game, title, content, generalRating, notes, date } = data;

  const scoutReport = new ScoutReport({
    player,
    game: game || null,
    author: user._id,
    date: date ? new Date(date) : new Date(),
    title,
    content,
    generalRating: generalRating || 3,
    notes
  });

  await scoutReport.save();
  await scoutReport.populate('player', 'fullName kitNumber position');
  if (scoutReport.game) {
    await scoutReport.populate('game', 'gameTitle opponent date');
  }
  await scoutReport.populate('author', 'fullName role');

  return scoutReport;
};

exports.updateScoutReport = async (id, updateData) => {
  const { title, content, generalRating, notes } = updateData;

  const scoutReport = await ScoutReport.findByIdAndUpdate(
    id,
    { title, content, generalRating, notes },
    { new: true }
  )
  .populate('player', 'fullName kitNumber position')
  .populate({
    path: 'game',
    select: 'gameTitle opponent date',
    options: { strictPopulate: false }
  })
  .populate('author', 'fullName role');

  if (!scoutReport) {
    throw new Error('Scout report not found');
  }

  return scoutReport;
};

exports.deleteScoutReport = async (id) => {
  const scoutReport = await ScoutReport.findByIdAndDelete(id);

  if (!scoutReport) {
    throw new Error('Scout report not found');
  }

  return scoutReport;
};

