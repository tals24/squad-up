/**
 * Backfill Jobs for Existing Games
 * 
 * This script creates recalc-minutes Jobs for all games that are in 'Played' or 'Done'
 * status but don't have calculated stats yet.
 * 
 * Run this script ONCE after fixing the worker to recalculate all historical games.
 * 
 * Usage:
 *   node src/scripts/backfillJobs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const Job = require('../models/Job');
const GameReport = require('../models/GameReport');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/squad-up';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function backfillJobs() {
  try {
    // Find all games that are in 'Played' or 'Done' status
    const gamesNeedingRecalc = await Game.find({
      status: { $in: ['Played', 'Done'] }
    }).select('_id status teamName opponent date');

    console.log(`\n📊 Found ${gamesNeedingRecalc.length} games in 'Played' or 'Done' status`);

    if (gamesNeedingRecalc.length === 0) {
      console.log('✅ No games need backfilling');
      return;
    }

    let jobsCreated = 0;
    let jobsSkipped = 0;

    for (const game of gamesNeedingRecalc) {
      // Check if a Job already exists for this game
      const existingJob = await Job.findOne({
        'payload.gameId': game._id,
        jobType: 'recalc-minutes',
        status: { $in: ['pending', 'running', 'completed'] }
      });

      if (existingJob) {
        console.log(`⏭️  Skipping game ${game._id} (${game.teamName} vs ${game.opponent}) - Job already exists (${existingJob.status})`);
        jobsSkipped++;
        continue;
      }

      // Check if GameReports already exist with calculated stats
      const existingReports = await GameReport.find({
        gameId: game._id,
        $or: [
          { minutesPlayed: { $gt: 0 } },
          { goals: { $gt: 0 } },
          { assists: { $gt: 0 } }
        ]
      });

      if (existingReports.length > 0) {
        console.log(`⏭️  Skipping game ${game._id} (${game.teamName} vs ${game.opponent}) - Stats already calculated`);
        jobsSkipped++;
        continue;
      }

      // Create Job for this game
      await Job.create({
        jobType: 'recalc-minutes',
        payload: { gameId: game._id },
        status: 'pending',
        runAt: new Date()
      });

      console.log(`✅ Created Job for game ${game._id} (${game.teamName} vs ${game.opponent}, ${game.status}, ${game.date.toISOString().split('T')[0]})`);
      jobsCreated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Jobs created: ${jobsCreated}`);
    console.log(`   ⏭️  Jobs skipped: ${jobsSkipped}`);
    console.log(`   📈 Total games: ${gamesNeedingRecalc.length}`);
    
    if (jobsCreated > 0) {
      console.log(`\n🔔 Make sure the worker is running to process these Jobs:`);
      console.log(`   npm run worker:dev`);
    }

  } catch (error) {
    console.error('❌ Error backfilling Jobs:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Job backfill script...\n');
  
  await connectDB();
  await backfillJobs();
  
  console.log('\n✅ Backfill complete!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

