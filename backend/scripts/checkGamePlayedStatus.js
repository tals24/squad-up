require('dotenv').config();
const mongoose = require('mongoose');

// Register all models
require('../src/models/Player');
require('../src/models/Game');
require('../src/models/GameRoster');
require('../src/models/Substitution');

const GameRoster = require('../src/models/GameRoster');
const Game = require('../src/models/Game');
const Substitution = require('../src/models/Substitution');

async function checkGame() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const gameId = '692741987c238c622887937c';
    
    // Get game info
    const game = await Game.findById(gameId);
    if (!game) {
      console.log('❌ Game not found');
      process.exit(1);
    }
    
    console.log(`📋 Game: ${game.gameTitle || game.teamName + ' vs ' + game.opponent}`);
    console.log(`   Status: ${game.status}`);
    console.log(`   Date: ${game.date}\n`);
    
    // Get substitutions
    const substitutions = await Substitution.find({ gameId })
      .populate('playerInId', 'fullName')
      .populate('playerOutId', 'fullName');
    
    console.log(`🔄 Substitutions: ${substitutions.length}`);
    substitutions.forEach(sub => {
      console.log(`   Min ${sub.minute}: ${sub.playerOutId?.fullName || sub.playerOutId} OUT → ${sub.playerInId?.fullName || sub.playerInId} IN`);
    });
    console.log('');
    
    // Get all rosters
    const rosters = await GameRoster.find({ game: gameId })
      .populate('player', 'fullName')
      .sort({ status: 1, 'player.fullName': 1 });
    
    console.log(`👥 Rosters (${rosters.length} total):\n`);
    
    const stats = {
      startingLineup: { total: 0, played: 0, notPlayed: 0 },
      bench: { total: 0, played: 0, notPlayed: 0 },
      unavailable: { total: 0, played: 0, notPlayed: 0 },
      notInSquad: { total: 0, played: 0, notPlayed: 0 }
    };
    
    // Group by status
    const byStatus = {
      'Starting Lineup': [],
      'Bench': [],
      'Unavailable': [],
      'Not in Squad': []
    };
    
    rosters.forEach(roster => {
      const status = roster.status;
      const playerName = roster.player?.fullName || roster.player;
      const played = roster.playedInGame;
      
      byStatus[status] = byStatus[status] || [];
      byStatus[status].push({ playerName, played, roster });
      
      // Update stats
      if (status === 'Starting Lineup') {
        stats.startingLineup.total++;
        if (played) stats.startingLineup.played++;
        else stats.startingLineup.notPlayed++;
      } else if (status === 'Bench') {
        stats.bench.total++;
        if (played) stats.bench.played++;
        else stats.bench.notPlayed++;
      } else if (status === 'Unavailable') {
        stats.unavailable.total++;
        if (played) stats.unavailable.played++;
        else stats.unavailable.notPlayed++;
      } else {
        stats.notInSquad.total++;
        if (played) stats.notInSquad.played++;
        else stats.notInSquad.notPlayed++;
      }
    });
    
    // Display by status
    Object.entries(byStatus).forEach(([status, players]) => {
      if (players.length === 0) return;
      
      console.log(`📊 ${status} (${players.length}):`);
      players.forEach(({ playerName, played }) => {
        const icon = played ? '✅ PLAYED' : '❌ NOT PLAYED';
        console.log(`   ${icon} | ${playerName}`);
      });
      console.log('');
    });
    
    // Summary
    const totalPlayed = stats.startingLineup.played + stats.bench.played + stats.unavailable.played + stats.notInSquad.played;
    const totalNotPlayed = stats.startingLineup.notPlayed + stats.bench.notPlayed + stats.unavailable.notPlayed + stats.notInSquad.notPlayed;
    
    console.log('📈 Summary:');
    console.log(`   Starting Lineup: ${stats.startingLineup.total} total (${stats.startingLineup.played} played, ${stats.startingLineup.notPlayed} not played)`);
    console.log(`   Bench: ${stats.bench.total} total (${stats.bench.played} played, ${stats.bench.notPlayed} not played)`);
    console.log(`   Unavailable: ${stats.unavailable.total} total`);
    console.log(`   Not in Squad: ${stats.notInSquad.total} total`);
    console.log(`\n   ✅ TOTAL PLAYED: ${totalPlayed}`);
    console.log(`   ❌ TOTAL NOT PLAYED: ${totalNotPlayed}`);
    
    // Expected: 11 starters + 1 subbed in = 12 played, 3 bench not subbed in = 3 not played
    const expectedPlayed = 12;
    const expectedNotPlayed = 3;
    
    console.log(`\n🎯 Expected:`);
    console.log(`   Played: ${expectedPlayed} (11 starters + 1 subbed in)`);
    console.log(`   Not Played: ${expectedNotPlayed} (3 bench not subbed in)`);
    
    if (totalPlayed === expectedPlayed && totalNotPlayed === expectedNotPlayed) {
      console.log(`\n✅ CORRECT! Status matches expectations.`);
    } else {
      console.log(`\n⚠️  MISMATCH! Expected ${expectedPlayed} played and ${expectedNotPlayed} not played.`);
      console.log(`   Got ${totalPlayed} played and ${totalNotPlayed} not played.`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkGame();

