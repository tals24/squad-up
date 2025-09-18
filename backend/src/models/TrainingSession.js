const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  // Primary Key (equivalent to SessionID formula in Airtable)
  sessionID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  date: {
    type: Date,
    required: true
  },
  
  // Link to Team
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Planned', 'Completed'],
    default: 'Planned'
  },
  
  // Lookup field (equivalent to TeamName lookup in Airtable)
  teamName: {
    type: String,
    required: true
  },
  
  // Formula field (equivalent to SessionTitle formula in Airtable)
  sessionTitle: {
    type: String,
    required: true
  },
  
  weekIdentifier: {
    type: String,
    required: true
  },
  
  // Additional fields
  notes: {
    type: String,
    default: null
  },
  
  duration: {
    type: Number, // in minutes
    default: 90
  },
  
  location: {
    type: String,
    default: null
  },
  
  weather: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
trainingSessionSchema.index({ sessionID: 1 });
trainingSessionSchema.index({ team: 1 });
trainingSessionSchema.index({ date: 1 });
trainingSessionSchema.index({ weekIdentifier: 1 });
trainingSessionSchema.index({ status: 1 });

// Pre-save middleware to generate sessionTitle
trainingSessionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('teamName') || this.isModified('date')) {
    const dateStr = this.date.toLocaleDateString('en-GB');
    this.sessionTitle = `${this.teamName} - ${dateStr}`;
  }
  next();
});

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);



