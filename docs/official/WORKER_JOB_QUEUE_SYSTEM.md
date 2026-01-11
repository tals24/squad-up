# Job Queue Worker Documentation

## Overview

The **Job Queue Worker** (`backend/src/worker.js`) is a standalone Node.js process that processes background jobs from a MongoDB-based job queue. It ensures reliable, asynchronous processing of time-consuming tasks like recalculating player minutes, goals, and assists.

### Purpose

The worker decouples heavy computational tasks from API request handling, providing:
- **Non-blocking API responses** - Users get instant feedback
- **Reliable job processing** - Automatic retries with exponential backoff
- **Eventual consistency** - Failed jobs are retried until success
- **Scalability** - Multiple workers can process jobs in parallel

---

## Architecture

### Components

```
┌─────────────────┐
│  API Endpoints  │  Creates jobs when events occur
│ (substitutions, │  (e.g., substitution saved)
│disciplinaryActs)│
└────────┬────────┘
         │
         │ Creates Job
         ▼
┌─────────────────┐
│  MongoDB Jobs   │  Job queue collection
│    Collection   │  Status: pending → running → completed/failed
└────────┬────────┘
         │
         │ Worker polls & locks
         ▼
┌─────────────────┐
│  Worker Process │  Processes jobs sequentially
│  (worker.js)    │  Handles retries & errors
└────────┬────────┘
         │
         │ Executes service
         ▼
┌─────────────────┐
│  Services       │  recalculatePlayerMinutes()
│  (minutesCalc)  │  Updates GameReport documents
└─────────────────┘
```

### Job Lifecycle

1. **Created** - API endpoint creates a job with `status: 'pending'`
2. **Locked** - Worker atomically claims the job (`status: 'running'`)
3. **Processed** - Worker executes the job handler
4. **Completed** - Job marked as `status: 'completed'` (success)
5. **Failed** - Job marked as `status: 'failed'` (max retries exceeded) OR `status: 'pending'` (will retry)
6. **Auto-Deleted** - Completed jobs are automatically deleted 30 days after `completedAt` (TTL index)

---

## Installation & Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB database running and accessible
- Environment variables configured (`.env` file)

### Environment Variables

The worker requires the following environment variable:

```bash
MONGODB_URI=mongodb://localhost:27017/squad-up
# Or for production:
# MONGODB_URI=mongodb://user:password@host:port/database
```

### Running the Worker

#### Development Mode (with auto-reload)

```bash
cd backend
npm run worker:dev
```

#### Production Mode

```bash
cd backend
npm run worker
```

#### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start backend/src/worker.js --name "job-worker"

# View logs
pm2 logs job-worker

# Restart worker
pm2 restart job-worker

# Stop worker
pm2 stop job-worker
```

#### Using Docker

```dockerfile
# Dockerfile.worker
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/worker.js"]
```

```bash
docker build -f Dockerfile.worker -t squad-up-worker .
docker run -d --name worker --env-file .env squad-up-worker
```

---

## Configuration

### Polling Interval

The worker polls for new jobs every **5 seconds** by default. This can be adjusted in `worker.js`:

```javascript
const POLL_INTERVAL_MS = 5000; // Change to desired interval (in milliseconds)
```

**Recommendations:**
- **Development**: 5 seconds (fast feedback)
- **Production**: 5-10 seconds (balance between responsiveness and resource usage)
- **High Load**: 10-30 seconds (reduce database queries)

### Retry Configuration

Jobs are configured with:
- **Max Retries**: 5 attempts
- **Backoff Strategy**: Exponential backoff
  - 1st retry: 60 seconds
  - 2nd retry: 120 seconds
  - 3rd retry: 240 seconds
  - 4th retry: 480 seconds
  - 5th retry: 960 seconds

These can be adjusted in the `Job` model (`backend/src/models/Job.js`).

### Automatic Cleanup (TTL Index)

Completed jobs are automatically deleted **30 days** after their `completedAt` timestamp using MongoDB's TTL (Time-To-Live) index.

**Configuration:**
- **Retention Period**: 30 days
- **Applies To**: Only jobs with `status: 'completed'`
- **Preserved**: Pending, running, and failed jobs are never auto-deleted

**How it works:**
- When a job is marked as completed, `completedAt` is set to the current timestamp
- MongoDB's TTL monitor runs every 60 seconds
- Jobs with `status: 'completed'` and `completedAt` older than 30 days are automatically deleted
- This prevents the `jobs` collection from growing indefinitely

**Note:** The TTL index is created automatically when the model is first loaded. You can verify it exists:

```javascript
// In MongoDB shell
db.jobs.getIndexes()
// Should show TTL index on completedAt field
```

---

## Job Types

### Currently Supported

#### 1. `recalc-minutes`

Recalculates player minutes played based on game events (substitutions, red cards).

**Triggered by:**
- Creating/updating/deleting a substitution
- Creating/updating/deleting a red card (disciplinary action)

**Payload:**
```json
{
  "gameId": "6910f3eaaf6f17e37ede0bdf"
}
```

**Handler:** `handleRecalcMinutes(job)`
- Calls `recalculatePlayerMinutes(gameId, true)`
- Updates `GameReport` documents with calculated `minutesPlayed`
- Sets `minutesCalculationMethod: 'calculated'`

### Future Job Types

#### 2. `recalc-goals-assists` (Planned)

Recalculates goals and assists from the Goals collection.

#### 3. `recalc-analytics` (Planned)

Recalculates game analytics and statistics.

---

## How It Works

### 1. Job Creation

When an API endpoint needs to trigger a calculation, it creates a job:

```javascript
// In substitutions.js or disciplinaryActions.js
await Job.create({
  jobType: 'recalc-minutes',
  payload: { gameId: gameId },
  status: 'pending',
  runAt: new Date() // Process immediately
});
```

### 2. Job Polling

The worker continuously polls for pending jobs:

```javascript
// Every 5 seconds
const job = await Job.findAndLock();
```

The `findAndLock()` method:
- Finds the oldest pending job (`runAt <= now`)
- Atomically updates status to `'running'`
- Returns the job (or `null` if none available)

**Atomic Locking** prevents multiple workers from processing the same job.

### 3. Job Processing

Once a job is locked, the worker processes it:

```javascript
switch (job.jobType) {
  case 'recalc-minutes':
    await handleRecalcMinutes(job);
    break;
  // ... other job types
}
```

### 4. Success Handling

If processing succeeds:

```javascript
await job.markCompleted();
// Status: 'completed'
// completedAt: Date.now()
```

### 5. Failure Handling

If processing fails:

```javascript
await job.markFailed(error);
// retryCount += 1
// lastError = error.message
// If retryCount < maxRetries:
//   status: 'pending'
//   runAt: Date.now() + backoff
// Else:
//   status: 'failed'
```

---

## Monitoring & Observability

### Console Logs

The worker provides detailed console logging:

#### Startup
```
🚀 Starting job queue worker...
📊 Polling interval: 5000ms
✅ Worker connected to MongoDB
✅ Worker started and polling for jobs
```

#### Job Processing
```
🔄 Processing job 6910f513507120cb67b43d6f (recalc-minutes) for game 6910f3eaaf6f17e37ede0bdf
✅ Recalculated minutes for game 6910f3eaaf6f17e37ede0bdf
✅ Job 6910f513507120cb67b43d6f completed successfully
```

#### Errors & Retries
```
❌ Job 6910f513507120cb67b43d6f failed: Error: Missing gameId
🔄 Job 6910f513507120cb67b43d6f will retry (attempt 1/5)
```

#### Max Retries Exceeded
```
❌ Job 6910f513507120cb67b43d6f exceeded max retries (5)
```

### MongoDB Queries

#### Check Job Status

```javascript
// Find all pending jobs
db.jobs.find({ status: 'pending' })

// Find all failed jobs
db.jobs.find({ status: 'failed' })

// Find jobs by type
db.jobs.find({ jobType: 'recalc-minutes' })

// Find jobs for a specific game
db.jobs.find({ 'payload.gameId': '6910f3eaaf6f17e37ede0bdf' })
```

#### Job Statistics

```javascript
// Count jobs by status
db.jobs.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])

// Find jobs that need attention (failed or stuck running)
db.jobs.find({
  $or: [
    { status: 'failed' },
    { status: 'running', startedAt: { $lt: new Date(Date.now() - 300000) } } // Running > 5 min
  ]
})

// Check TTL index status
db.jobs.getIndexes()
// Look for index on completedAt with expireAfterSeconds

// Verify cleanup is working (should return 0 or very few)
db.jobs.countDocuments({
  status: 'completed',
  completedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

### Health Checks

#### Check if Worker is Running

```bash
# Using PM2
pm2 status job-worker

# Using process manager
ps aux | grep worker.js

# Check MongoDB for stuck jobs
# Jobs with status 'running' and startedAt > 5 minutes ago
```

---

## Error Handling

### Transient Errors (Retried)

These errors trigger automatic retries:
- Database connection issues
- Temporary database locks
- Network timeouts
- Missing data (e.g., game not found yet)

### Permanent Errors (Failed)

These errors mark the job as permanently failed:
- Invalid job payload (e.g., missing `gameId`)
- Unknown job type
- Schema validation errors
- Max retries exceeded (5 attempts)

### Manual Intervention

For permanently failed jobs:

1. **Investigate the error:**
   ```javascript
   db.jobs.findOne({ _id: ObjectId('...') })
   // Check lastError field
   ```

2. **Fix the underlying issue** (e.g., fix data, correct payload)

3. **Reset and retry the job:**
   ```javascript
   db.jobs.updateOne(
     { _id: ObjectId('...') },
     {
       $set: {
         status: 'pending',
         retryCount: 0,
         lastError: null,
         runAt: new Date()
       }
     }
   )
   ```

---

## Troubleshooting

### Issue: Worker Not Processing Jobs

**Symptoms:**
- Jobs remain in `pending` status
- No console logs from worker

**Solutions:**
1. Check if worker is running: `pm2 status` or `ps aux | grep worker`
2. Check MongoDB connection: Verify `MONGODB_URI` in `.env`
3. Check worker logs: `pm2 logs job-worker` or console output
4. Verify models are loaded: Check for "Schema hasn't been registered" errors

### Issue: Jobs Stuck in "Running" Status

**Symptoms:**
- Jobs have `status: 'running'` but worker is not processing them
- `startedAt` timestamp is old (> 5 minutes)

**Cause:**
- Worker crashed while processing a job
- Worker was forcefully killed

**Solution:**
```javascript
// Reset stuck jobs to pending
db.jobs.updateMany(
  {
    status: 'running',
    startedAt: { $lt: new Date(Date.now() - 300000) } // > 5 min ago
  },
  {
    $set: {
      status: 'pending',
      startedAt: null
    }
  }
)
```

### Issue: Jobs Failing Repeatedly

**Symptoms:**
- Jobs reach `status: 'failed'` quickly
- `retryCount` is 5
- `lastError` shows the same error

**Solutions:**
1. **Check the error message:**
   ```javascript
   db.jobs.find({ status: 'failed' }).sort({ updatedAt: -1 }).limit(5)
   ```

2. **Common causes:**
   - Missing `gameId` in payload → Fix API endpoint
   - Game not found → Verify game exists
   - Model not registered → Check worker.js imports
   - Database connection issues → Check MongoDB

3. **Fix and retry:**
   - Fix the underlying issue
   - Reset the job (see "Manual Intervention" above)

### Issue: High CPU/Memory Usage

**Symptoms:**
- Worker consumes excessive resources
- System becomes slow

**Solutions:**
1. **Increase polling interval:**
   ```javascript
   const POLL_INTERVAL_MS = 10000; // 10 seconds instead of 5
   ```

2. **Limit concurrent processing:**
   - Currently processes one job at a time (by design)
   - For parallel processing, run multiple worker instances

3. **Optimize job handlers:**
   - Review `recalculatePlayerMinutes` for performance issues
   - Add database indexes if needed

### Issue: Duplicate Job Processing

**Symptoms:**
- Same calculation runs multiple times
- GameReport updated multiple times

**Solutions:**
- **This should not happen** - atomic locking prevents it
- If it does occur:
  1. Check for multiple worker instances running
  2. Verify `findAndLock()` is working correctly
  3. Check MongoDB indexes on `jobs` collection

---

## Best Practices

### 1. Run Worker as Separate Process

**✅ Good:**
- Worker runs as standalone process
- Can restart independently of API server
- Better resource isolation

**❌ Bad:**
- Running worker in same process as API server
- Worker crashes take down API server

### 2. Use Process Manager

**✅ Good:**
- PM2, systemd, or Docker for production
- Automatic restarts on crash
- Log management

**❌ Bad:**
- Running worker directly with `node`
- No automatic recovery

### 3. Monitor Job Queue

**✅ Good:**
- Regular checks for failed jobs
- Alerting on high failure rates
- Dashboard for job statistics

**❌ Bad:**
- Ignoring failed jobs
- No visibility into queue health

### 4. Handle Job Failures

**✅ Good:**
- Investigate failed jobs promptly
- Fix underlying issues
- Reset and retry when appropriate

**❌ Bad:**
- Ignoring failed jobs
- Manually fixing data without addressing root cause

### 5. Test Job Processing

**✅ Good:**
- Test worker in development environment
- Verify jobs process correctly
- Test retry logic with simulated failures

**❌ Bad:**
- Deploying worker without testing
- Assuming jobs will always succeed

---

## Scaling

### Horizontal Scaling

Multiple worker instances can run simultaneously:

```bash
# Terminal 1
npm run worker

# Terminal 2
npm run worker

# Terminal 3
npm run worker
```

**How it works:**
- Each worker polls independently
- Atomic locking ensures only one worker processes each job
- Jobs are distributed across workers automatically

**Recommendations:**
- Start with 1 worker
- Add more workers if job queue grows
- Monitor worker utilization
- Balance between responsiveness and resource usage

### Vertical Scaling

For high-load scenarios:

1. **Optimize polling:**
   - Reduce polling interval (faster processing)
   - Increase batch size (process multiple jobs per poll)

2. **Optimize handlers:**
   - Cache frequently accessed data
   - Use database indexes
   - Optimize queries

3. **Resource allocation:**
   - Allocate more CPU/memory to worker
   - Use dedicated MongoDB connection pool

---

## Security Considerations

### Database Access

- Worker uses same MongoDB credentials as API server
- Ensure MongoDB user has read/write access to:
  - `jobs` collection
  - `games` collection
  - `gameRosters` collection
  - `substitutions` collection
  - `disciplinaryActions` collection
  - `gameReports` collection

### Environment Variables

- Store `MONGODB_URI` securely (not in version control)
- Use environment-specific values (dev/staging/prod)
- Rotate credentials regularly

### Error Messages

- Worker logs may contain sensitive information
- Ensure logs are not publicly accessible
- Sanitize error messages in production

---

## API Reference

### Job Model Methods

#### `Job.findAndLock()`

Atomically finds and locks a pending job.

**Returns:** `Job | null`

**Example:**
```javascript
const job = await Job.findAndLock();
if (job) {
  // Process job
}
```

#### `job.markCompleted()`

Marks a job as successfully completed.

**Example:**
```javascript
await job.markCompleted();
// Status: 'completed'
// completedAt: Date.now()
```

#### `job.markFailed(error, backoffSeconds = 60)`

Marks a job as failed and schedules retry (or permanent failure).

**Parameters:**
- `error` (Error) - The error that occurred
- `backoffSeconds` (number) - Base backoff time in seconds (default: 60)

**Example:**
```javascript
try {
  await processJob(job);
} catch (error) {
  await job.markFailed(error);
}
```

---

## Testing

### Manual Testing

1. **Create a test job:**
   ```javascript
   // In MongoDB shell
   db.jobs.insertOne({
     jobType: 'recalc-minutes',
     payload: { gameId: 'YOUR_GAME_ID' },
     status: 'pending',
     runAt: new Date()
   })
   ```

2. **Start worker:**
   ```bash
   npm run worker
   ```

3. **Observe processing:**
   - Check console logs
   - Verify job status changes to `completed`
   - Verify `GameReport` documents are updated

### Integration Testing

Test the full flow:

1. Create a substitution via API
2. Verify job is created in MongoDB
3. Start worker
4. Verify job is processed
5. Verify minutes are recalculated

### Error Testing

Test retry logic:

1. Temporarily break `recalculatePlayerMinutes` (throw error)
2. Create a job
3. Observe retries in console
4. Verify job eventually fails after 5 retries

---

## Maintenance

### Regular Tasks

1. **Monitor failed jobs:**
   - Weekly review of failed jobs
   - Investigate and fix root causes

2. **Check stuck jobs:**
   - Daily check for jobs stuck in `running` status
   - Reset if necessary

3. **Review job statistics:**
   - Track job processing times
   - Identify performance bottlenecks

4. **Monitor collection size:**
   - Check `jobs` collection size periodically
   - Verify TTL index is working (completed jobs should be deleted after 30 days)
   - Failed jobs are preserved for investigation (not auto-deleted)

5. **Update worker:**
   - Keep Node.js and dependencies updated
   - Test updates in development first

### Automatic Cleanup

The job queue includes an automatic cleanup mechanism to prevent infinite growth:

**TTL Index:**
- Automatically deletes completed jobs 30 days after completion
- Only applies to jobs with `status: 'completed'`
- Pending, running, and failed jobs are preserved

**Verification:**
```javascript
// Check TTL index exists
db.jobs.getIndexes()

// Count completed jobs (should be minimal if cleanup is working)
db.jobs.countDocuments({ status: 'completed' })

// Find old completed jobs (should be none older than 30 days)
db.jobs.find({
  status: 'completed',
  completedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

**Manual Cleanup (if needed):**
```javascript
// Manually delete old completed jobs (older than 30 days)
db.jobs.deleteMany({
  status: 'completed',
  completedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})

// Delete old failed jobs (optional - for investigation purposes)
// Note: Failed jobs are NOT auto-deleted by TTL index
db.jobs.deleteMany({
  status: 'failed',
  completedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days
})
```

### Backup & Recovery

1. **Backup job queue:**
   ```bash
   mongodump --collection=jobs --db=squad-up
   ```

2. **Recovery:**
   - Restore from backup if needed
   - Reset stuck/failed jobs
   - Restart worker

---

## Changelog

### Version 1.0.0 (Current)

- Initial implementation
- Support for `recalc-minutes` job type
- Atomic job locking
- Exponential backoff retry logic
- Graceful shutdown handling
- **TTL index for automatic cleanup** - Completed jobs auto-deleted after 30 days

### Future Enhancements

- [ ] Support for `recalc-goals-assists` job type
- [ ] Support for `recalc-analytics` job type
- [ ] Job priority system
- [ ] Job scheduling (delayed execution)
- [ ] Web dashboard for job monitoring
- [ ] Email alerts for failed jobs
- [ ] Metrics collection (Prometheus/Grafana)
- [ ] Configurable TTL retention period (currently fixed at 30 days)
- [ ] TTL index for failed jobs (optional cleanup after extended period)

---

## Support & Troubleshooting

### Getting Help

1. **Check logs:**
   - Worker console output
   - PM2 logs: `pm2 logs job-worker`
   - MongoDB logs

2. **Review documentation:**
   - This document
   - `REFACTORING_PLAN_JOB_QUEUE_RECALCULATIONS.md`

3. **Common issues:**
   - See "Troubleshooting" section above

### Reporting Issues

When reporting issues, include:
- Worker version/commit
- Error messages from console
- Job document from MongoDB
- Steps to reproduce
- Environment details (Node.js version, MongoDB version)

---

**Last Updated:** November 2025  
**Maintained By:** Development Team

