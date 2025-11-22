require('dotenv').config();
const mongoose = require('mongoose');

// Import all models that are used by the services
// This ensures they are registered with Mongoose before use
require('./models/Job');
require('./models/Game');
require('./models/GameRoster');
require('./models/Substitution');
require('./models/DisciplinaryAction');
require('./models/Player');
require('./models/GameReport');

const Job = require('./models/Job');
const { recalculatePlayerMinutes } = require('./services/minutesCalculation');

// Configuration
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/squad-up';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Worker connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Process a single job
async function processJob(job) {
  console.log(`🔄 Processing job ${job._id} (${job.jobType}) for game ${job.payload.gameId}`);
  
  try {
    // Route to appropriate handler based on jobType
    switch (job.jobType) {
      case 'recalc-minutes':
        await handleRecalcMinutes(job);
        break;
      
      case 'recalc-goals-assists':
        // Future: await handleRecalcGoalsAssists(job);
        console.warn(`⚠️ Job type ${job.jobType} not yet implemented`);
        await job.markFailed(new Error('Job type not implemented'));
        return;
      
      default:
        console.error(`❌ Unknown job type: ${job.jobType}`);
        await job.markFailed(new Error(`Unknown job type: ${job.jobType}`));
        return;
    }
    
    // Mark job as completed
    await job.markCompleted();
    console.log(`✅ Job ${job._id} completed successfully`);
    
  } catch (error) {
    console.error(`❌ Job ${job._id} failed:`, error);
    
    // Mark job as failed (with retry logic)
    await job.markFailed(error);
    
    if (job.status === 'failed') {
      console.error(`❌ Job ${job._id} exceeded max retries (${job.maxRetries})`);
    } else {
      console.log(`🔄 Job ${job._id} will retry (attempt ${job.retryCount}/${job.maxRetries})`);
    }
  }
}

// Handler for recalc-minutes job type
async function handleRecalcMinutes(job) {
  const { gameId } = job.payload;
  
  if (!gameId) {
    throw new Error('Missing gameId in job payload');
  }
  
  // Call the recalculation service
  // Note: We pass updateReports=true to actually update GameReport documents
  await recalculatePlayerMinutes(gameId, true);
  
  console.log(`✅ Recalculated minutes for game ${gameId}`);
}

// Main polling loop
async function pollForJobs() {
  try {
    // Find and lock a job (atomic operation)
    const job = await Job.findAndLock();
    
    if (!job) {
      // No jobs available
      return;
    }
    
    // Process the job
    await processJob(job);
    
  } catch (error) {
    console.error('❌ Error in polling loop:', error);
  }
}

// Start the worker
async function startWorker() {
  console.log('🚀 Starting job queue worker...');
  console.log(`📊 Polling interval: ${POLL_INTERVAL_MS}ms`);
  
  // Connect to database
  await connectDB();
  
  // Start polling loop
  setInterval(pollForJobs, POLL_INTERVAL_MS);
  
  // Also poll immediately on startup
  pollForJobs();
  
  console.log('✅ Worker started and polling for jobs');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down worker...');
  await mongoose.connection.close();
  console.log('✅ Worker shut down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down worker...');
  await mongoose.connection.close();
  console.log('✅ Worker shut down gracefully');
  process.exit(0);
});

// Start the worker
startWorker().catch((error) => {
  console.error('❌ Fatal error starting worker:', error);
  process.exit(1);
});

