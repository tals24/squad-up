const mongoose = require('mongoose');

const sessionDrillSchema = new mongoose.Schema({
  // Primary Key (equivalent to EntryID formula in Airtable)
  entryID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Links to TrainingSession and Drill
  trainingSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingSession',
    required: true
  },
  
  drill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drill',
    required: true
  },
  
  sessionPart: {
    type: String,
    required: true,
    enum: ['Warm-up', 'Main Part', 'Small Game']
  },
  
  // Lookup field (equivalent to DrillName lookup in Airtable)
  drillName: {
    type: String,
    required: true
  },
  
  smallGameNotes: {
    type: String,
    default: null
  },
  
  // Additional fields for session planning
  duration: {
    type: Number, // in minutes
    default: null
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionDrillSchema.index({ entryID: 1 });
sessionDrillSchema.index({ trainingSession: 1 });
sessionDrillSchema.index({ drill: 1 });
sessionDrillSchema.index({ sessionPart: 1 });

// Pre-save middleware to generate drillName lookup
sessionDrillSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('drill')) {
    await this.populate('drill');
    if (this.drill) {
      this.drillName = this.drill.drillName;
    }
  }
  next();
});

module.exports = mongoose.model('SessionDrill', sessionDrillSchema);



