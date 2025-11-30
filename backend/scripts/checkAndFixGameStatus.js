require('dotenv').config();
const mongoose = require('mongoose');

// Register all models
require('../src/models/Player');
require('../src/models/Game');
require('../src/models/GameRoster');
require('../src/models/Substitution');
require('../src/models/Job');

const GameRoster = require('../src/models/GameRoster');
const Game = require('../src/models/Game');
const Substitution = require('../src/models/Substitution');
const Job = require('../src/models/Job');
const { updatePlayedStatusForGame } = require('../src/services/minutesCalculation');

async function checkAndFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const gameId = '692741987c238c622887937c';
    
    // Check if jobs exist for this game
    console.log('🔍 Checking job queue...\n');
    const jobs = await Job.find({ 
      jobType: 'recalc-minutes',
      'payload.gameId': gameId
    }).sort({ createdAt: -1 }).limit(5);
    
    if (jobs.length === 0) {
      console.log('⚠️  No jobs found for this game');
    } else {
      console.log(`📋 Found ${jobs.length} job(s):\n`);
      jobs.forEach((job, idx) => {
        console.log(`   Job ${idx + 1}:`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Created: ${job.createdAt}`);
        console.log(`      Updated: ${job.updatedAt}`);
        if (job.error) {
          console.log(`      Error: ${job.error}`);
        }
        console.log('');
      });
    }
    
    // Check current roster status
    console.log('📊 Current roster status:\n');
    const rosters = await GameRoster.find({ game: gameId })
      .populate('player', 'fullName');
    
    const playedCount = rosters.filter(r => r.playedInGame).length;
    const notPlayedCount = rosters.filter(r => !r.playedInGame).length;
    
    console.log(`   Played: ${playedCount}`);
    console.log(`   Not Played: ${notPlayedCount}\n`);
    
    if (playedCount === 0) {
      console.log('⚠️  No players marked as played. Updating now...\n');
      
      // Manually trigger update
      const result = await updatePlayedStatusForGame(gameId);
      
      console.log('✅ Update completed:');
      console.log(`   Players Updated: ${result.playersUpdated}`);
      console.log(`   Players Played: ${result.playersPlayed}`);
      console.log(`   Players Not Played: ${result.playersNotPlayed}\n`);
      
      // Verify after update
      const rostersAfter = await GameRoster.find({ game: gameId })
        .populate('player', 'fullName');
      
      console.log('📊 Updated roster status:\n');
      console.log('   ✅ PLAYED:');
      rostersAfter.filter(r => r.playedInGame).forEach(r => {
        console.log(`      - ${r.player?.fullName || r.player} (${r.status})`);
      });
      
      console.log('\n   ❌ NOT PLAYED:');
      rostersAfter.filter(r => !r.playedInGame).forEach(r => {
        console.log(`      - ${r.player?.fullName || r.player} (${r.status})`);
      });
      
      const playedAfter = rostersAfter.filter(r => r.playedInGame).length;
      const notPlayedAfter = rostersAfter.filter(r => !r.playedInGame).length;
      
      console.log(`\n   Total Played: ${playedAfter}`);
      console.log(`   Total Not Played: ${notPlayedAfter}`);
      
      // Expected: 11 starters + 1 subbed in = 12 played
      if (playedAfter === 12) {
        console.log('\n✅ CORRECT! 12 players marked as played (11 starters + 1 subbed in)');
      } else {
        console.log(`\n⚠️  Expected 12 played, got ${playedAfter}`);
      }
    } else {
      console.log('✅ Players already have playedInGame status set');
    }
    
    // Create a job for future processing (if needed)
    console.log('\n📋 Creating job for worker to process...');
    const newJob = await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`✅ Job created: ${newJob._id}`);
    console.log('   (Worker will process this job automatically)\n');
    
    await mongoose.disconnect();
    console.log('✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAndFix();

