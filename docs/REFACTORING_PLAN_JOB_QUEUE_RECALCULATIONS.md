# Refactoring Plan: Job Queue System for Robust Recalculations

## Problem Statement

### The Issue

Currently, when a user saves a substitution (`POST /api/games/:gameId/substitutions`) or a red card (`POST /api/games/:gameId/disciplinary-actions`), the API endpoint triggers a "fire-and-forget" call to `recalculatePlayerMinutes(...)`.

**The Problem:**
- If the calculation fails (due to temporary database lock, network error, etc.), the error is just logged
- The substitution/card is still saved successfully
- This leads to **permanently stale data**, where game events are saved but `minutesPlayed` stats are incorrect and never get fixed
- No retry mechanism exists
- No visibility into failed calculations

**Current Implementation (Fragile):**

```javascript
// In substitutions.js and disciplinaryActions.js
try {
  await recalculatePlayerMinutes(gameId, false);
  console.log(`✅ Recalculated player minutes...`);
} catch (error) {
  console.error(`❌ Error recalculating minutes:`, error);
  // Don't fail the request if recalculation fails
}
```

**Impact:**
- **Data Integrity**: Stale `minutesPlayed` values in `GameReport` documents
- **User Experience**: Incorrect statistics displayed to users
- **No Recovery**: Failed calculations are never retried
- **Silent Failures**: Errors are logged but not actionable

---

## Solution Overview

**Implement a robust, retriable job queue system using MongoDB.**

This will:
1. **Decouple** the calculation from the API response (non-blocking)
2. **Guarantee eventual consistency** through retries
3. **Provide visibility** into job status and failures
4. **Enable monitoring** and alerting for failed jobs
5. **Support horizontal scaling** (multiple workers can process jobs)

**Architecture:**
- **Publishers**: API endpoints create jobs instead of calling calculations directly
- **Queue**: MongoDB collection (`jobs`) stores pending/completed/failed jobs
- **Consumer**: Standalone worker script processes jobs with retry logic

---

## Phase 1: Database Model (The Job Queue)

### File: `backend/src/models/Job.js` (NEW)

**Mongoose Schema:**

```javascript
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
```

**Key Features:**
- **Atomic Job Locking**: `findAndLock()` uses `findOneAndUpdate()` to atomically claim a job
- **Retry Logic**: Exponential backoff (60s, 120s, 240s, 480s, 960s)
- **Status Tracking**: `pending` → `running` → `completed`/`failed`
- **Efficient Indexing**: Compound indexes for fast job polling
- **Metadata**: Tracks when jobs start, complete, and fail

---

## Phase 2: Refactor API Endpoints (The "Publishers")

### File: `backend/src/routes/substitutions.js`

**Changes Required:**

1. **Import Job model:**
```javascript
const Job = require('../models/Job');
```

2. **Remove direct `recalculatePlayerMinutes` calls** (lines 56-62, 162-168, 204-210)

3. **Replace with job creation** after successful save:

**POST Route (Create Substitution):**
```javascript
// After substitution.save() (line 53)
await substitution.save();

// ✅ Create job for minutes recalculation (non-blocking)
try {
  await Job.create({
    jobType: 'recalc-minutes',
    payload: { gameId: gameId },
    status: 'pending',
    runAt: new Date() // Process immediately
  });
  console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution creation`);
} catch (error) {
  // Log but don't fail the request if job creation fails
  console.error(`❌ Error creating recalc-minutes job:`, error);
}

// Populate references for response
await substitution.populate([...]);
```

**PUT Route (Update Substitution):**
```javascript
// After substitution.save() (line 159)
await substitution.save();

// ✅ Create job for minutes recalculation
try {
  await Job.create({
    jobType: 'recalc-minutes',
    payload: { gameId: gameId },
    status: 'pending',
    runAt: new Date()
  });
  console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution update`);
} catch (error) {
  console.error(`❌ Error creating recalc-minutes job:`, error);
}
```

**DELETE Route (Delete Substitution):**
```javascript
// After substitution deletion (line 198)
const substitution = await Substitution.findOneAndDelete({ _id: subId, gameId });

// ✅ Create job for minutes recalculation
try {
  await Job.create({
    jobType: 'recalc-minutes',
    payload: { gameId: gameId },
    status: 'pending',
    runAt: new Date()
  });
  console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution deletion`);
} catch (error) {
  console.error(`❌ Error creating recalc-minutes job:`, error);
}
```

**Remove Import:**
```javascript
// ❌ REMOVE this line:
// const { recalculatePlayerMinutes } = require('../services/minutesCalculation');
```

---

### File: `backend/src/routes/disciplinaryActions.js`

**Changes Required:**

1. **Import Job model:**
```javascript
const Job = require('../models/Job');
```

2. **Remove direct `recalculatePlayerMinutes` calls** (lines 51-59, 166-174, 207-215)

3. **Replace with job creation** (only for red cards):

**POST Route (Create Disciplinary Action):**
```javascript
// After disciplinaryAction.save() (line 48)
await disciplinaryAction.save();

// ✅ Create job for minutes recalculation if red card (only red cards affect minutes)
if (cardType === 'red' || cardType === 'second-yellow') {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId: gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after red card`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**PUT Route (Update Disciplinary Action):**
```javascript
// After action.save() (line 163)
await action.save();

// ✅ Create job for minutes recalculation if red card
if (action.cardType === 'red' || action.cardType === 'second-yellow') {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId: gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after red card update`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**DELETE Route (Delete Disciplinary Action):**
```javascript
// After action deletion (line 201)
const action = await DisciplinaryAction.findOneAndDelete({ _id: actionId, gameId });

// ✅ Create job for minutes recalculation if red card was deleted
if (action.cardType === 'red' || action.cardType === 'second-yellow') {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId: gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after red card deletion`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**Remove Import:**
```javascript
// ❌ REMOVE this line:
// const { recalculatePlayerMinutes } = require('../services/minutesCalculation');
```

---

## Phase 3: Create the Worker (The "Consumer")

### File: `backend/src/worker.js` (NEW)

**Standalone Worker Script:**

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const { recalculatePlayerMinutes } = require('./services/minutesCalculation');

// Configuration
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/squad-up';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
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
```

**Key Features:**
- **Non-blocking**: API endpoints return immediately after creating job
- **Atomic Job Locking**: `findAndLock()` prevents multiple workers from processing the same job
- **Retry Logic**: Exponential backoff with configurable max retries
- **Error Handling**: Failed jobs are logged and retried
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals

---

## Phase 4: Package.json Script

### File: `backend/package.json`

**Add worker script:**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "worker": "node src/worker.js",
    "worker:dev": "nodemon src/worker.js"
  }
}
```

**Usage:**
```bash
# Production
npm run worker

# Development (with auto-reload)
npm run worker:dev
```

---

## Phase 5: Deployment Considerations

### Running the Worker

**Option 1: Separate Process (Recommended)**
- Run worker as separate Node.js process
- Use process manager (PM2, systemd, Docker, etc.)
- Example with PM2:
  ```bash
  pm2 start backend/src/worker.js --name "job-worker"
  ```

**Option 2: Same Process (Not Recommended)**
- Could run worker in same process as API server
- Not recommended due to resource contention
- If API server crashes, worker also crashes

**Option 3: Docker Container**
```dockerfile
# Dockerfile.worker
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/worker.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    # ...
  
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - mongodb
```

---

## Phase 6: Monitoring & Observability

### Job Status Endpoint (Optional)

**File: `backend/src/routes/jobs.js` (NEW)**

```javascript
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { authenticateJWT } = require('../middleware/jwtAuth');

router.use(authenticateJWT);

// GET /api/jobs/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsMap = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };
    
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      stats: statsMap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/failed
router.get('/failed', async (req, res) => {
  try {
    const failedJobs = await Job.find({ status: 'failed' })
      .sort({ updatedAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      jobs: failedJobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Register in `backend/src/server.js`:**
```javascript
const jobsRouter = require('./routes/jobs');
app.use('/api/jobs', jobsRouter);
```

---

## Phase 7: Testing Plan

### Test 1: Happy Path (Primary Test)

**Steps:**
1. Start the worker: `npm run worker`
2. Create a substitution via API: `POST /api/games/:gameId/substitutions`
3. Verify API returns `200 OK` immediately
4. Check MongoDB `jobs` collection:
   ```javascript
   db.jobs.find().sort({ createdAt: -1 }).limit(1)
   ```
   - Should see a new job with `jobType: 'recalc-minutes'`, `status: 'pending'`
5. Wait 5-10 seconds (polling interval)
6. Check job status again:
   - Should be `status: 'completed'`
   - Should have `completedAt` timestamp
7. Check `GameReport` documents:
   - `minutesPlayed` should be updated correctly
   - `minutesCalculationMethod` should be `'calculated'`

**Expected Results:**
- ✅ API responds immediately (no blocking)
- ✅ Job is created in database
- ✅ Worker processes job within polling interval
- ✅ Minutes are recalculated correctly
- ✅ GameReport documents are updated

---

### Test 2: Job Creation Verification

**Steps:**
1. Create a substitution
2. Query MongoDB:
   ```javascript
   db.jobs.find({ jobType: 'recalc-minutes' }).sort({ createdAt: -1 }).limit(5)
   ```
3. Verify job document structure:
   ```json
   {
     "_id": "...",
     "jobType": "recalc-minutes",
     "payload": { "gameId": "..." },
     "status": "pending",
     "retryCount": 0,
     "runAt": ISODate("..."),
     "createdAt": ISODate("...")
   }
   ```

**Expected Results:**
- ✅ Job document has correct structure
- ✅ `payload.gameId` matches the game ID from the request
- ✅ `status` is `'pending'`
- ✅ `runAt` is set to current time (or near future)

---

### Test 3: Worker Execution

**Steps:**
1. Create a job manually in MongoDB (or via API)
2. Start worker: `npm run worker`
3. Watch console logs:
   ```
   🚀 Starting job queue worker...
   ✅ Worker connected to MongoDB
   🔄 Processing job ... (recalc-minutes) for game ...
   ✅ Recalculated minutes for game ...
   ✅ Job ... completed successfully
   ```
4. Verify job status in MongoDB:
   ```javascript
   db.jobs.findOne({ _id: ObjectId("...") })
   ```
   - `status` should be `'completed'`
   - `completedAt` should be set
   - `retryCount` should still be `0`

**Expected Results:**
- ✅ Worker finds and locks job
- ✅ Worker processes job successfully
- ✅ Job status updates to `'completed'`
- ✅ Minutes are recalculated in GameReport

---

### Test 4: Failure/Retry Logic

**Steps:**
1. Temporarily modify `calculatePlayerMinutes` to throw an error:
   ```javascript
   // In minutesCalculation.js
   async function calculatePlayerMinutes(gameId) {
     throw new Error('Simulated calculation failure');
   }
   ```
2. Create a substitution (creates a job)
3. Start worker
4. Watch console logs:
   ```
   🔄 Processing job ... (recalc-minutes) for game ...
   ❌ Job ... failed: Error: Simulated calculation failure
   🔄 Job ... will retry (attempt 1/5)
   ```
5. Check job in MongoDB:
   ```javascript
   db.jobs.findOne({ _id: ObjectId("...") })
   ```
   - `status` should be `'pending'` (not `'failed'`)
   - `retryCount` should be `1`
   - `lastError` should contain error message
   - `runAt` should be in the future (backoff)
6. Wait for backoff period (60 seconds for first retry)
7. Verify worker retries the job
8. Repeat until `retryCount` reaches `5`
9. Verify job status becomes `'failed'` after max retries

**Expected Results:**
- ✅ Worker catches error and marks job for retry
- ✅ `retryCount` increments
- ✅ `runAt` is set to future time (exponential backoff)
- ✅ Worker retries after backoff period
- ✅ Job eventually fails after max retries

---

### Test 5: Multiple Workers (Concurrency)

**Steps:**
1. Start two worker processes:
   ```bash
   npm run worker  # Terminal 1
   npm run worker  # Terminal 2
   ```
2. Create multiple jobs (e.g., 10 substitutions)
3. Verify only one worker processes each job (check logs)
4. Verify no duplicate processing (check `GameReport` updates)

**Expected Results:**
- ✅ Only one worker processes each job (atomic locking prevents duplicates)
- ✅ All jobs are eventually processed
- ✅ No duplicate calculations

---

### Test 6: Red Card Only (Disciplinary Actions)

**Steps:**
1. Create a yellow card: `POST /api/games/:gameId/disciplinary-actions` with `cardType: 'yellow'`
2. Verify NO job is created (yellow cards don't affect minutes)
3. Create a red card: `POST /api/games/:gameId/disciplinary-actions` with `cardType: 'red'`
4. Verify job IS created
5. Verify worker processes the job

**Expected Results:**
- ✅ Yellow cards don't create jobs
- ✅ Red cards create jobs
- ✅ Worker processes red card jobs correctly

---

### Test 7: API Response Time

**Steps:**
1. Measure API response time before refactoring (with direct `recalculatePlayerMinutes` call)
2. Measure API response time after refactoring (with job creation)
3. Compare

**Expected Results:**
- ✅ API response time is significantly faster (no blocking calculation)
- ✅ User experience improved (instant response)

---

## Phase 8: Migration Strategy

### Existing Data

**No migration needed** - the job queue is additive. Existing data is unaffected.

**However, if you want to recalculate all existing games:**

1. Create a migration script: `backend/scripts/migrate-recalculate-all.js`
```javascript
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const Game = require('../src/models/Game');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const games = await Game.find({ status: 'Played' });
  
  for (const game of games) {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId: game._id },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`Created job for game ${game._id}`);
  }
  
  console.log(`Created ${games.length} jobs`);
  await mongoose.connection.close();
}

migrate();
```

2. Run migration:
```bash
node backend/scripts/migrate-recalculate-all.js
```

3. Start worker to process all jobs

---

## Phase 9: Rollback Plan

If issues arise:

1. **Quick Rollback:** Revert API endpoint changes (restore direct `recalculatePlayerMinutes` calls)
2. **Keep Worker Running:** Worker can continue processing existing jobs
3. **Gradual Migration:** Re-enable job queue for specific endpoints one at a time

**Rollback Code (substitutions.js):**
```javascript
// Restore direct call
await substitution.save();

// Rollback: Direct calculation (reintroduces blocking)
try {
  await recalculatePlayerMinutes(gameId, false);
  console.log(`✅ Recalculated player minutes...`);
} catch (error) {
  console.error(`❌ Error recalculating minutes:`, error);
}
```

---

## Summary

### What We're Fixing

- ❌ **Before:** Fire-and-forget calculations that can fail silently, leaving stale data
- ✅ **After:** Robust job queue with retries, eventual consistency, and visibility

### Key Benefits

1. **Data Integrity:** Failed calculations are retried automatically
2. **Performance:** API endpoints respond instantly (non-blocking)
3. **Reliability:** Exponential backoff handles transient failures
4. **Visibility:** Job status tracking enables monitoring and alerting
5. **Scalability:** Multiple workers can process jobs in parallel

### Implementation Checklist

- [ ] Create `backend/src/models/Job.js` (Phase 1)
- [ ] Refactor `backend/src/routes/substitutions.js` (Phase 2)
- [ ] Refactor `backend/src/routes/disciplinaryActions.js` (Phase 2)
- [ ] Create `backend/src/worker.js` (Phase 3)
- [ ] Add worker script to `package.json` (Phase 4)
- [ ] Test happy path (Test 1)
- [ ] Test job creation (Test 2)
- [ ] Test worker execution (Test 3)
- [ ] Test failure/retry logic (Test 4)
- [ ] Test multiple workers (Test 5)
- [ ] Test red card only (Test 6)
- [ ] Measure API response time (Test 7)
- [ ] Deploy worker as separate process (Phase 5)
- [ ] (Optional) Add monitoring endpoints (Phase 6)

---

## Files Modified/Created

**New Files:**
- `backend/src/models/Job.js` - Job queue model
- `backend/src/worker.js` - Worker script
- `backend/src/routes/jobs.js` - (Optional) Job monitoring endpoints

**Modified Files:**
- `backend/src/routes/substitutions.js` - Replace direct calls with job creation
- `backend/src/routes/disciplinaryActions.js` - Replace direct calls with job creation
- `backend/package.json` - Add worker script

---

**End of Plan**

