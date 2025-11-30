# MongoDB Queries for PlayedInGame Testing

## Quick Queries for Game: 692741987c238c622887937c

### 1. Check GameRoster Status

```javascript
// Connect to MongoDB
mongosh
use squad-up

// Find all rosters for this game
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c") 
}).pretty()

// Count players who played
db.gamerosters.countDocuments({ 
  game: ObjectId("692741987c238c622887937c"),
  playedInGame: true 
})

// Count players who didn't play
db.gamerosters.countDocuments({ 
  game: ObjectId("692741987c238c622887937c"),
  playedInGame: false 
})

// Show only players who played
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c"),
  playedInGame: true 
}).pretty()

// Show only players who didn't play
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c"),
  playedInGame: false 
}).pretty()

// Group by status and playedInGame
db.gamerosters.aggregate([
  { $match: { game: ObjectId("692741987c238c622887937c") } },
  { $group: {
      _id: { status: "$status", played: "$playedInGame" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id.status": 1, "_id.played": -1 } }
])
```

### 2. Check Substitutions

```javascript
// Find all substitutions for this game
db.substitutions.find({ 
  gameId: ObjectId("692741987c238c622887937c") 
}).pretty()

// Count substitutions
db.substitutions.countDocuments({ 
  gameId: ObjectId("692741987c238c622887937c") 
})
```

### 3. Expected Results

For game `692741987c238c622887937c`:
- **11 Starting Lineup players** → should have `playedInGame: true`
- **1 Bench player subbed in** → should have `playedInGame: true`
- **3 Bench players NOT subbed in** → should have `playedInGame: false`

**Total Expected:**
- `playedInGame: true` → 12 players
- `playedInGame: false` → 3 players (at minimum, could be more if there are unavailable players)

### 4. Verify Logic

```javascript
// Get all rosters with status
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c") 
}, {
  player: 1,
  status: 1,
  playedInGame: 1
}).sort({ status: 1 })

// Check if all starters have playedInGame = true
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c"),
  status: "Starting Lineup",
  playedInGame: false 
})

// Should return 0 documents (all starters should be played)

// Check bench players
db.gamerosters.find({ 
  game: ObjectId("692741987c238c622887937c"),
  status: "Bench"
}, {
  player: 1,
  playedInGame: 1
}).pretty()
```

## Testing Job Queue

### 1. Check Job Queue Status

```javascript
// Find recent recalc-minutes jobs
db.jobs.find({ 
  jobType: "recalc-minutes",
  "payload.gameId": ObjectId("692741987c238c622887937c")
}).sort({ createdAt: -1 }).limit(5).pretty()

// Check job status
db.jobs.find({ 
  jobType: "recalc-minutes",
  "payload.gameId": ObjectId("692741987c238c622887937c")
}, {
  status: 1,
  createdAt: 1,
  updatedAt: 1,
  error: 1
}).sort({ createdAt: -1 }).limit(5)

// Count jobs by status
db.jobs.aggregate([
  { $match: { jobType: "recalc-minutes" } },
  { $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])
```

### 2. Manually Create a Job (for testing)

```javascript
// Create a test job
db.jobs.insertOne({
  jobType: "recalc-minutes",
  payload: { gameId: ObjectId("692741987c238c622887937c") },
  status: "pending",
  runAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  retryCount: 0,
  maxRetries: 3
})

// Check if worker picks it up (status should change to "processing" then "completed")
```

### 3. Check Worker Logs

The worker should show:
```
🔄 Processing job <jobId> (recalc-minutes) for game <gameId>
✅ Recalculated minutes for game <gameId>
✅ Updated played status for game <gameId>: X played, Y not played
✅ Job <jobId> completed successfully
```

## Quick Verification Script

Run the provided script:
```bash
cd backend
node scripts/checkGamePlayedStatus.js
```

This will show:
- All rosters with their playedInGame status
- Summary counts
- Comparison with expected values
- Any mismatches

