const mongoose = require('mongoose');
const Game = require('../src/models/Game');
const Player = require('../src/models/Player');
const Team = require('../src/models/Team');
const GameRoster = require('../src/models/GameRoster');

async function addTestGameRoster() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/squadup');
    console.log('Connected to MongoDB');

    // Find a game
    const game = await Game.findOne();
    if (!game) {
      console.log('No games found. Please create a game first.');
      return;
    }
    console.log('Found game:', game.gameTitle || `${game.teamName} vs ${game.opponent}`);

    // Find a team
    const team = await Team.findOne();
    if (!team) {
      console.log('No teams found. Please create a team first.');
      return;
    }
    console.log('Found team:', team.teamName);

    // Find players for this team
    const players = await Player.find({ team: team._id }).limit(5);
    if (players.length === 0) {
      console.log('No players found for this team. Please create players first.');
      return;
    }
    console.log(`Found ${players.length} players for team ${team.teamName}`);

    // Create game roster entries
    const rosterEntries = [];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const statuses = ['Starting Lineup', 'Bench', 'Not in Squad'];
      const status = statuses[i % statuses.length];

      const rosterEntry = new GameRoster({
        game: game._id,
        player: player._id,
        status: status
      });

      await rosterEntry.save();
      rosterEntries.push(rosterEntry);
      console.log(`Created roster entry for ${player.fullName} - ${status}`);
    }

    console.log(`Successfully created ${rosterEntries.length} game roster entries`);
    
    // Verify the entries
    const allRosters = await GameRoster.find({ game: game._id }).populate('player');
    console.log('All rosters for this game:', allRosters.map(r => ({
      player: r.player?.fullName,
      status: r.status
    })));

  } catch (error) {
    console.error('Error adding test game roster:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTestGameRoster();
