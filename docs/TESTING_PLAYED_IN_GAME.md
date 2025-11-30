# Testing Guide: PlayedInGame Indicator

This guide explains how to verify that the `playedInGame` feature is working correctly.

## Prerequisites

1. Backend server running (`npm start` in `backend/` directory)
2. Worker process running (`node src/worker.js` in `backend/` directory)
3. Frontend running (`npm run dev` in root directory)
4. MongoDB accessible

## Test Scenarios

### 1. Verify Database Schema Update

**Check that `playedInGame` field exists in GameRoster:**

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use squad-up

# Check GameRoster schema
db.gamerosters.findOne()
```

You should see a `playedInGame` field (default: `false`).

### 2. Test Service Function Directly

**Test `updatePlayedStatusForGame` function:**

Create a test script `backend/scripts/testPlayedStatus.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const { updatePlayedStatusForGame } = require('../src/services/minutesCalculation');
const GameRoster = require('../src/models/GameRoster');
const Game = require('../models/Game');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a game with status "Played" or "Done"
  const game = await Game.findOne({ status: { $in: ['Played', 'Done'] } });
  if (!game) {
    console.log('❌ No Played/Done game found. Create a game first.');
    process.exit(1);
  }
  
  console.log(`\n🧪 Testing played status for game: ${game._id}`);
  
  // Check rosters before
  const rostersBefore = await GameRoster.find({ game: game._id });
  console.log('\n📊 Rosters BEFORE update:');
  rostersBefore.forEach(r => {
    console.log(`  - Player ${r.player}: status=${r.status}, playedInGame=${r.playedInGame}`);
  });
  
  // Run update
  const result = await updatePlayedStatusForGame(game._id);
  console.log('\n✅ Update result:', result);
  
  // Check rosters after
  const rostersAfter = await GameRoster.find({ game: game._id });
  console.log('\n📊 Rosters AFTER update:');
  rostersAfter.forEach(r => {
    console.log(`  - Player ${r.player}: status=${r.status}, playedInGame=${r.playedInGame}`);
  });
  
  await mongoose.disconnect();
}

test().catch(console.error);
```

Run it:
```bash
cd backend
node scripts/testPlayedStatus.js
```

**Expected Results:**
- Starting Lineup players → `playedInGame: true`
- Bench players who were subbed in → `playedInGame: true`
- Bench players NOT subbed in → `playedInGame: false`
- Unavailable/Not in Squad → `playedInGame: false`

### 3. Test Job Queue Integration

**Verify that jobs are created and processed:**

1. **Create a substitution:**
   - Go to a game with status "Played"
   - Add a substitution (bench player → on pitch)
   - Check backend console for: `📋 Created recalc-minutes job for game...`

2. **Check worker console:**
   - Should see: `🔄 Processing job...`
   - Should see: `✅ Recalculated minutes for game...`
   - Should see: `✅ Updated played status for game...`

3. **Verify database:**
   ```bash
   # Check that playedInGame was updated
   mongosh
   use squad-up
   db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID"), playedInGame: true })
   ```

### 4. Test Analytics Filtering

**Verify that GameReports API filters by playedInGame:**

1. **Create test data:**
   - Create reports for players who played AND players who didn't play
   - Ensure some players have `playedInGame: true` and others `false`

2. **Test API endpoint:**
   ```bash
   # Get all game reports (should only return players who played)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/game-reports
   ```

3. **Test by game:**
   ```bash
   # Get reports for specific game
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/game-reports/game/YOUR_GAME_ID
   ```

**Expected:** Only reports for players with `playedInGame: true` should be returned.

### 5. Test Frontend Display

**Verify PlayerDetailPage shows correct stats:**

1. Navigate to a player detail page
2. Check the "Performance Stats" card
3. Look for "Game Participation" section showing:
   - **Games Played**: Count of games where `playedInGame: true`
   - **Games in Squad**: Count of games where status is "Starting Lineup" or "Bench"

**Expected:**
- Games Played ≤ Games in Squad (always)
- If player was on bench but never subbed in → Games Played < Games in Squad

### 6. End-to-End Test Scenario

**Complete workflow test:**

1. **Setup:**
   - Create a new game (status: "Scheduled")
   - Set lineup: 11 starters + 5 bench players

2. **Start game:**
   - Click "Start Game"
   - Check backend console for job creation
   - Wait for worker to process (check worker console)
   - Verify: All starters have `playedInGame: true`
   - Verify: All bench players have `playedInGame: false`

3. **Add substitution:**
   - Sub in a bench player at minute 30
   - Check backend console for job creation
   - Wait for worker to process
   - Verify: The subbed-in player now has `playedInGame: true`

4. **Create reports:**
   - Use "Auto-Fill Reports" button (creates reports for ALL players)
   - Manually create reports for some players

5. **Check analytics:**
   - Go to player detail page
   - Verify "Games Played" count is correct
   - Verify only players who played appear in analytics

6. **Finalize game:**
   - Submit final report
   - Change game status to "Done"
   - Verify job is created and processed
   - Verify `playedInGame` status is still correct

## Debugging Tips

### Check Job Queue Status

```bash
mongosh
use squad-up
db.jobs.find({ jobType: 'recalc-minutes' }).sort({ createdAt: -1 }).limit(5)
```

Look for:
- `status: 'completed'` → Job processed successfully
- `status: 'pending'` → Job waiting to be processed
- `status: 'failed'` → Job failed (check `error` field)

### Check GameRoster Status

```bash
# Find all rosters for a game
db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID") }).pretty()

# Find players who played
db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID"), playedInGame: true })

# Find players who didn't play
db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID"), playedInGame: false })
```

### Check Substitutions

```bash
# Find all substitutions for a game
db.substitutions.find({ gameId: ObjectId("YOUR_GAME_ID") }).pretty()
```

### Manual Job Trigger (for testing)

If you need to manually trigger a job:

```bash
mongosh
use squad-up
db.jobs.insertOne({
  jobType: 'recalc-minutes',
  payload: { gameId: ObjectId("YOUR_GAME_ID") },
  status: 'pending',
  runAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Common Issues

### Issue: `playedInGame` not updating

**Check:**
1. Is worker process running?
2. Are jobs being created? (check `jobs` collection)
3. Are jobs completing? (check job `status`)
4. Check worker console for errors

### Issue: Analytics showing wrong players

**Check:**
1. Verify `playedInGame` field is set correctly in database
2. Check that GameReports API is filtering correctly
3. Clear browser cache and refresh

### Issue: Job not processing

**Check:**
1. Worker process is running
2. MongoDB connection is working
3. Job `status` is 'pending' (not 'processing' stuck)
4. Check worker console for errors

## Success Criteria

✅ Database schema has `playedInGame` field  
✅ Service function correctly calculates played status  
✅ Jobs are created when events occur  
✅ Worker processes jobs and updates `playedInGame`  
✅ GameReports API filters by `playedInGame`  
✅ Frontend displays correct "Games Played" vs "Games in Squad"  
✅ Analytics exclude non-playing players  

