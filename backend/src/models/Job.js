const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobType: {
    type: String,
    required: true,
    enum: ['recalc-minutes', 'recalc-goals-assists', 'recalc-analytics'],
    index: true // For efficient querying
  },
  
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
    // Example: { gameId: '...' }
  },
  
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
    index: true // For efficient querying
  },
  
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  maxRetries: {
    type: Number,
    default: 5,
    min: 1
  },
  
  lastError: {
    type: String,
    default: null
  },
  
  runAt: {
    type: Date,
    default: Date.now,
    index: true // For efficient querying
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Compound index for efficient job polling
jobSchema.index({ status: 1, runAt: 1 });

// Index for finding jobs by type and status
jobSchema.index({ jobType: 1, status: 1 });

// TTL Index for automatic cleanup of completed jobs
// This index will automatically delete documents 30 days after
// the 'completedAt' time, but only if the 'status' is 'completed'.
jobSchema.index(
  { completedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days in seconds
    partialFilterExpression: { status: 'completed' }
  }
);

// Pre-save hook to update updatedAt
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find and lock a job (atomic operation)
jobSchema.statics.findAndLock = async function() {
  const now = new Date();
  
  // Find one pending job that's ready to run (runAt <= now)
  // Atomically update status to 'running'
  const job = await this.findOneAndUpdate(
    {
      status: 'pending',
      runAt: { $lte: now }
    },
    {
      $set: {
        status: 'running',
        startedAt: now
      }
    },
    {
      new: true, // Return updated document
      sort: { runAt: 1, createdAt: 1 } // Process oldest first
    }
  );
  
  return job;
};

// Instance method to mark job as completed
jobSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
};

// Instance method to mark job as failed (with retry logic)
jobSchema.methods.markFailed = async function(error, backoffSeconds = 60) {
  this.retryCount += 1;
  this.lastError = error.message || String(error);
  
  if (this.retryCount >= this.maxRetries) {
    // Max retries exceeded - mark as permanently failed
    this.status = 'failed';
    this.completedAt = new Date();
  } else {
    // Schedule retry with exponential backoff
    const backoffMs = backoffSeconds * 1000 * Math.pow(2, this.retryCount - 1);
    this.status = 'pending';
    this.runAt = new Date(Date.now() + backoffMs);
    this.startedAt = null; // Reset startedAt for retry
  }
  
  await this.save();
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

