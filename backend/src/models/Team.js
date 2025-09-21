const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  // Primary Key (equivalent to TeamID formula in Airtable)
  teamID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  teamName: {
    type: String,
    required: true
  },
  
  season: {
    type: String,
    required: true
  },
  
  division: {
    type: String,
    required: true
  },
  
  // Links to Users (using ObjectId references)
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  divisionManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  departmentManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
teamSchema.index({ teamID: 1 });
teamSchema.index({ season: 1 });
teamSchema.index({ division: 1 });
teamSchema.index({ coach: 1 });

module.exports = mongoose.model('Team', teamSchema, 'teams');


