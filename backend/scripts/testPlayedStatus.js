require('dotenv').config();
const mongoose = require('mongoose');

// Register all models before using them
require('../src/models/Player');
require('../src/models/Game');
require('../src/models/GameRoster');
require('../src/models/Substitution');

const { updatePlayedStatusForGame } = require('../src/services/minutesCalculation');
const GameRoster = require('../src/models/GameRoster');
const Game = require('../src/models/Game');
const Substitution = require('../src/models/Substitution');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find a game with status "Played" or "Done"
    const game = await Game.findOne({ status: { $in: ['Played', 'Done'] } });
    if (!game) {
      console.log('❌ No Played/Done game found.');
      console.log('💡 Tip: Create a game and set status to "Played" first.\n');
      process.exit(1);
    }
    
    console.log(`🧪 Testing played status for game:`);
    console.log(`   Game ID: ${game._id}`);
    console.log(`   Status: ${game.status}`);
    console.log(`   Title: ${game.gameTitle || game.teamName + ' vs ' + game.opponent}\n`);
    
    // Get substitutions for this game
    const substitutions = await Substitution.find({ gameId: game._id })
      .populate('playerInId', 'fullName')
      .populate('playerOutId', 'fullName');
    
    console.log(`📊 Substitutions in this game: ${substitutions.length}`);
    substitutions.forEach(sub => {
      console.log(`   Min ${sub.minute}: ${sub.playerOutId?.fullName || sub.playerOutId} OUT → ${sub.playerInId?.fullName || sub.playerInId} IN`);
    });
    console.log('');
    
    // Check rosters before
    const rostersBefore = await GameRoster.find({ game: game._id })
      .populate('player', 'fullName');
    
    console.log(`📋 Rosters BEFORE update (${rostersBefore.length} players):`);
    const beforeStats = {
      startingLineup: 0,
      bench: 0,
      played: 0,
      notPlayed: 0
    };
    
    rostersBefore.forEach(r => {
      const playerName = r.player?.fullName || r.player;
      const status = r.status;
      const played = r.playedInGame ? '✅ PLAYED' : '❌ NOT PLAYED';
      
      if (status === 'Starting Lineup') beforeStats.startingLineup++;
      if (status === 'Bench') beforeStats.bench++;
      if (r.playedInGame) beforeStats.played++;
      else beforeStats.notPlayed++;
      
      console.log(`   ${played} | ${playerName.padEnd(25)} | Status: ${status}`);
    });
    
    console.log(`\n📊 Summary BEFORE:`);
    console.log(`   Starting Lineup: ${beforeStats.startingLineup}`);
    console.log(`   Bench: ${beforeStats.bench}`);
    console.log(`   Played: ${beforeStats.played}`);
    console.log(`   Not Played: ${beforeStats.notPlayed}\n`);
    
    // Run update
    console.log('🔄 Running updatePlayedStatusForGame...\n');
    const result = await updatePlayedStatusForGame(game._id);
    console.log('✅ Update result:', result);
    console.log('');
    
    // Check rosters after
    const rostersAfter = await GameRoster.find({ game: game._id })
      .populate('player', 'fullName');
    
    console.log(`📋 Rosters AFTER update (${rostersAfter.length} players):`);
    const afterStats = {
      startingLineup: 0,
      bench: 0,
      played: 0,
      notPlayed: 0
    };
    
    rostersAfter.forEach(r => {
      const playerName = r.player?.fullName || r.player;
      const status = r.status;
      const played = r.playedInGame ? '✅ PLAYED' : '❌ NOT PLAYED';
      
      if (status === 'Starting Lineup') afterStats.startingLineup++;
      if (status === 'Bench') afterStats.bench++;
      if (r.playedInGame) afterStats.played++;
      else afterStats.notPlayed++;
      
      console.log(`   ${played} | ${playerName.padEnd(25)} | Status: ${status}`);
    });
    
    console.log(`\n📊 Summary AFTER:`);
    console.log(`   Starting Lineup: ${afterStats.startingLineup}`);
    console.log(`   Bench: ${afterStats.bench}`);
    console.log(`   Played: ${afterStats.played}`);
    console.log(`   Not Played: ${afterStats.notPlayed}\n`);
    
    // Validation checks
    console.log('🔍 Validation Checks:');
    let allPassed = true;
    
    // Check 1: All starting lineup should have playedInGame = true
    const startersNotPlayed = rostersAfter.filter(r => 
      r.status === 'Starting Lineup' && !r.playedInGame
    );
    if (startersNotPlayed.length > 0) {
      console.log(`   ❌ FAIL: ${startersNotPlayed.length} starting lineup players marked as NOT PLAYED`);
      allPassed = false;
    } else {
      console.log(`   ✅ PASS: All starting lineup players marked as PLAYED`);
    }
    
    // Check 2: Bench players subbed in should have playedInGame = true
    const subbedInPlayerIds = new Set(
      substitutions.map(sub => 
        typeof sub.playerInId === 'object' ? sub.playerInId._id.toString() : sub.playerInId.toString()
      )
    );
    const benchSubbedIn = rostersAfter.filter(r => {
      const playerId = typeof r.player === 'object' ? r.player._id.toString() : r.player.toString();
      return r.status === 'Bench' && subbedInPlayerIds.has(playerId);
    });
    const benchSubbedInNotPlayed = benchSubbedIn.filter(r => !r.playedInGame);
    if (benchSubbedInNotPlayed.length > 0) {
      console.log(`   ❌ FAIL: ${benchSubbedInNotPlayed.length} bench players who were subbed in marked as NOT PLAYED`);
      allPassed = false;
    } else {
      console.log(`   ✅ PASS: All bench players who were subbed in marked as PLAYED`);
    }
    
    // Check 3: Bench players NOT subbed in should have playedInGame = false
    const benchNotSubbedIn = rostersAfter.filter(r => {
      const playerId = typeof r.player === 'object' ? r.player._id.toString() : r.player.toString();
      return r.status === 'Bench' && !subbedInPlayerIds.has(playerId);
    });
    const benchNotSubbedInPlayed = benchNotSubbedIn.filter(r => r.playedInGame);
    if (benchNotSubbedInPlayed.length > 0) {
      console.log(`   ❌ FAIL: ${benchNotSubbedInPlayed.length} bench players NOT subbed in marked as PLAYED`);
      allPassed = false;
    } else {
      console.log(`   ✅ PASS: All bench players NOT subbed in marked as NOT PLAYED`);
    }
    
    console.log('');
    if (allPassed) {
      console.log('🎉 All validation checks PASSED!');
    } else {
      console.log('⚠️  Some validation checks FAILED. Review the output above.');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

test();

