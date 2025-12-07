# Backend Scripts

Utility scripts for database maintenance and backfilling.

---

## Backfill Jobs

### Purpose
Creates recalc-minutes Jobs for all existing games in 'Played' or 'Done' status that don't have calculated statistics yet.

This is needed after fixing the worker bug, to recalculate stats for historical games.

### When to Use
- After deploying the worker fix
- After the worker was down for a period
- When you have games with missing minutes/goals/assists data

### Usage

```bash
cd backend
node src/scripts/backfillJobs.js
```

### What It Does

1. Finds all games with status 'Played' or 'Done'
2. Checks if each game already has:
   - An existing Job (pending/running/completed)
   - OR calculated stats in GameReports
3. Skips games that already have Jobs or stats
4. Creates new Jobs for games that need recalculation
5. Prints summary of Jobs created

### Example Output

```
🚀 Starting Job backfill script...

✅ Connected to MongoDB

📊 Found 15 games in 'Played' or 'Done' status

✅ Created Job for game 507f1f77bcf86cd799439011 (Hawks vs Eagles, Done, 2025-12-01)
✅ Created Job for game 507f1f77bcf86cd799439012 (Hawks vs Falcons, Done, 2025-11-28)
⏭️  Skipping game 507f1f77bcf86cd799439013 (Hawks vs Owls) - Job already exists (completed)
✅ Created Job for game 507f1f77bcf86cd799439014 (Hawks vs Ravens, Played, 2025-11-25)

📊 Summary:
   ✅ Jobs created: 12
   ⏭️  Jobs skipped: 3
   📈 Total games: 15

🔔 Make sure the worker is running to process these Jobs:
   npm run worker:dev

✅ Backfill complete!
```

### Safety

The script is **safe to run multiple times**:
- Checks for existing Jobs before creating new ones
- Checks for existing calculated stats
- Won't create duplicate Jobs
- Won't overwrite existing data

### After Running

Make sure the worker is running to process the newly created Jobs:

```bash
cd backend
npm run worker:dev
```

The worker will process all pending Jobs within ~5-10 seconds per game.

---

## Future Scripts

Other utility scripts can be added here:
- Data migrations
- Cleanup scripts
- Performance analysis
- Database consistency checks

