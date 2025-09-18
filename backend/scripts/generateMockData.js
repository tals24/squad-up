/**
 * SquadUp Mock Data Generator
 * 
 * Generates comprehensive mock data for testing:
 * - 3 Teams (different divisions)
 * - 3 Coach Users (one per team)
 * - 22 Players per team (66 total) with realistic positions
 * - 10 Games per team (30 total) with varied statuses
 * - 5 Scout Reports per player (330 total)
 * - Game Rosters for all games
 * - Timeline Events for finished games
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Player = require('../src/models/Player');
const Game = require('../src/models/Game');
const GameRoster = require('../src/models/GameRoster');
const TimelineEvent = require('../src/models/TimelineEvent');
const Drill = require('../src/models/Drill');
const Formation = require('../src/models/Formation');

// Configuration
const TEAMS_COUNT = 3;
const PLAYERS_PER_TEAM = 22;
const GAMES_PER_TEAM = 10;
const SCOUT_REPORTS_PER_PLAYER = 5;
const MIN_FINISHED_GAMES = 3;

// Team data
const TEAMS_DATA = [
  {
    name: 'Eagles FC',
    season: '2024/2025',
    division: 'Premier Division',
    color: '#1e40af', // Blue
  },
  {
    name: 'Tigers United',
    season: '2024/2025', 
    division: 'Championship Division',
    color: '#ea580c', // Orange
  },
  {
    name: 'Wolves Academy',
    season: '2024/2025',
    division: 'Youth Division',
    color: '#059669', // Green
  }
];

// Position distribution for a 22-player squad
const POSITION_DISTRIBUTION = [
  // Goalkeepers (3)
  'Goalkeeper', 'Goalkeeper', 'Goalkeeper',
  // Defenders (7)
  'Defender', 'Defender', 'Defender', 'Defender', 'Defender', 'Wing-back', 'Wing-back',
  // Midfielders (8)
  'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder',
  // Forwards/Strikers (4)
  'Forward', 'Forward', 'Striker', 'Striker'
];

// Common player names for football
const FIRST_NAMES = [
  'Marcus', 'James', 'David', 'Michael', 'Robert', 'Daniel', 'Andrew', 'Christopher',
  'Matthew', 'Joshua', 'Ryan', 'Nathan', 'Alex', 'Ben', 'Tom', 'Luke', 'Jack',
  'Oliver', 'Harry', 'Charlie', 'George', 'Jacob', 'Thomas', 'William', 'Lewis',
  'Connor', 'Jamie', 'Sam', 'Joe', 'Adam', 'Josh', 'Jordan', 'Callum', 'Kyle',
  'Sean', 'Cameron', 'Aaron', 'Ethan', 'Mason', 'Noah', 'Liam', 'Owen', 'Tyler'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia',
  'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez',
  'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez',
  'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young',
  'Allen', 'Sanchez', 'Wright', 'King', 'Scott', 'Green', 'Baker', 'Adams',
  'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter'
];

// Opponent teams for games
const OPPONENT_TEAMS = [
  'City Rovers', 'United Athletic', 'Sporting Club', 'FC Academy', 'Rangers FC',
  'Athletic United', 'City Warriors', 'Lions FC', 'Panthers United', 'Hawks Athletic',
  'Thunder FC', 'Lightning United', 'Storm Athletic', 'Blazers FC', 'Dynamo Club',
  'Victory FC', 'Champion United', 'Elite Athletic', 'Premier FC', 'Star United'
];

// Game locations
const LOCATIONS = [
  'Home Stadium', 'City Sports Complex', 'Municipal Football Ground', 'Training Ground A',
  'Sports Academy Field', 'Community Stadium', 'Regional Sports Center', 'Away Ground',
  'Central Park Stadium', 'University Sports Field', 'Athletic Club Ground'
];

// Scout report templates
const SCOUT_REPORT_TEMPLATES = [
  {
    type: 'Technical Skills Assessment',
    notes: [
      'Excellent ball control and first touch',
      'Good passing accuracy under pressure', 
      'Needs improvement in weak foot usage',
      'Strong aerial ability and heading',
      'Quick decision making in final third'
    ]
  },
  {
    type: 'Physical Assessment', 
    notes: [
      'Good pace and acceleration',
      'Strong physical presence',
      'Excellent stamina throughout 90 minutes',
      'Needs to improve core strength',
      'Good agility and balance'
    ]
  },
  {
    type: 'Tactical Understanding',
    notes: [
      'Understands positional play well',
      'Good communication with teammates',
      'Needs to improve defensive pressing',
      'Excellent at reading the game',
      'Strong leadership qualities'
    ]
  },
  {
    type: 'Mental Attributes',
    notes: [
      'Shows great determination and work rate',
      'Confident on the ball',
      'Needs to improve concentration',
      'Good under pressure situations',
      'Positive attitude in training'
    ]
  },
  {
    type: 'Match Performance',
    notes: [
      'Consistent performance level',
      'Key player in important matches',
      'Needs to be more clinical in front of goal',
      'Good at creating chances for teammates',
      'Strong defensive work rate'
    ]
  }
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generatePlayerName = () => {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  return `${firstName} ${lastName}`;
};

const generateKitNumber = (existingNumbers) => {
  let number;
  do {
    number = getRandomNumber(1, 99);
  } while (existingNumbers.includes(number));
  return number;
};

const generateBirthDate = () => {
  // Players aged 16-35
  const minAge = 16;
  const maxAge = 35;
  const today = new Date();
  const birthYear = today.getFullYear() - getRandomNumber(minAge, maxAge);
  const birthMonth = getRandomNumber(0, 11);
  const birthDay = getRandomNumber(1, 28);
  return new Date(birthYear, birthMonth, birthDay);
};

const generateGameDate = (baseDate, index) => {
  // Games spread over the season (August to May)
  const startDate = new Date(baseDate.getFullYear(), 7, 1); // August 1st
  const endDate = new Date(baseDate.getFullYear() + 1, 4, 31); // May 31st
  const daysBetween = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const gameInterval = daysBetween / GAMES_PER_TEAM;
  
  // Add some randomness to the interval
  const randomOffset = getRandomNumber(-7, 7); // +/- 7 days
  const gameDate = new Date(startDate.getTime() + (index * gameInterval * 24 * 60 * 60 * 1000) + (randomOffset * 24 * 60 * 60 * 1000));
  
  return gameDate;
};

const generateScore = () => {
  // Realistic football scores
  const scores = [
    [0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [2, 0], [0, 2],
    [2, 2], [3, 0], [0, 3], [3, 1], [1, 3], [3, 2], [2, 3], [4, 0],
    [0, 4], [4, 1], [1, 4], [3, 3], [4, 2], [2, 4], [5, 0], [0, 5]
  ];
  return getRandomElement(scores);
};

// Clear existing data
const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');
  
  await Promise.all([
    TimelineEvent.deleteMany({}),
    GameRoster.deleteMany({}), 
    Game.deleteMany({}),
    Player.deleteMany({}),
    Team.deleteMany({}),
    User.deleteMany({ role: 'Coach' }) // Only delete coach users, keep existing admins
  ]);
  
  console.log('✅ Database cleared');
};

// Generate coach users
const generateCoaches = async () => {
  console.log('👨‍💼 Generating coach users...');
  
  const coaches = [];
  const coachNames = ['John Martinez', 'Sarah Thompson', 'Mike Rodriguez'];
  
  for (let i = 0; i < TEAMS_COUNT; i++) {
    const coach = new User({
      firebaseUid: `coach_${i + 1}_${Date.now()}`,
      email: `coach${i + 1}@squadup.com`,
      fullName: coachNames[i],
      role: 'Coach',
      department: TEAMS_DATA[i].division,
      phoneNumber: faker.phone.number(),
      profileImage: `https://i.pravatar.cc/150?img=${i + 10}`
    });
    
    coaches.push(coach);
  }
  
  await User.insertMany(coaches);
  console.log(`✅ Created ${coaches.length} coach users`);
  
  return coaches;
};

// Generate teams
const generateTeams = async (coaches) => {
  console.log('⚽ Generating teams...');
  
  const teams = [];
  
  for (let i = 0; i < TEAMS_COUNT; i++) {
    const teamData = TEAMS_DATA[i];
    const coach = coaches[i];
    
    const team = new Team({
      teamName: teamData.name,
      season: teamData.season,
      division: teamData.division,
      coach: coach._id
    });
    
    teams.push(team);
  }
  
  await Team.insertMany(teams);
  console.log(`✅ Created ${teams.length} teams`);
  
  return teams;
};

// Generate players
const generatePlayers = async (teams) => {
  console.log('🏃‍♂️ Generating players...');
  
  const allPlayers = [];
  
  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    const team = teams[teamIndex];
    const usedNumbers = [];
    const teamPlayers = [];
    
    // Create 22 players for each team
    for (let playerIndex = 0; playerIndex < PLAYERS_PER_TEAM; playerIndex++) {
      const position = POSITION_DISTRIBUTION[playerIndex];
      const kitNumber = generateKitNumber(usedNumbers);
      usedNumbers.push(kitNumber);
      
      const player = new Player({
        fullName: generatePlayerName(),
        kitNumber: kitNumber,
        position: position,
        dateOfBirth: generateBirthDate(),
        profileImage: `https://i.pravatar.cc/150?img=${teamIndex * 22 + playerIndex + 1}`,
        team: team._id,
        teamRecordID: team.teamID,
        nationalID: `ID${getRandomNumber(100000, 999999)}`,
        phoneNumber: faker.phone.number(),
        email: faker.internet.email()
      });
      
      teamPlayers.push(player);
    }
    
    allPlayers.push(...teamPlayers);
    console.log(`  ✅ Generated ${teamPlayers.length} players for ${team.teamName}`);
  }
  
  await Player.insertMany(allPlayers);
  console.log(`✅ Created ${allPlayers.length} total players`);
  
  return allPlayers;
};

// Generate games
const generateGames = async (teams) => {
  console.log('🏆 Generating games...');
  
  const allGames = [];
  const currentDate = new Date();
  
  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    const team = teams[teamIndex];
    const teamGames = [];
    
    for (let gameIndex = 0; gameIndex < GAMES_PER_TEAM; gameIndex++) {
      const gameDate = generateGameDate(currentDate, gameIndex);
      const opponent = getRandomElement(OPPONENT_TEAMS);
      const location = getRandomElement(LOCATIONS);
      
      // Determine game status based on date and ensure minimum finished games
      let status;
      if (gameIndex < MIN_FINISHED_GAMES) {
        status = 'Done'; // Ensure first 3 games are finished
      } else if (gameDate < currentDate) {
        status = getRandomElement(['Done', 'Played']);
      } else {
        status = getRandomElement(['Scheduled', 'Scheduled', 'Scheduled']); // Bias towards scheduled
      }
      
      // Generate scores for finished games
      let ourScore = null;
      let opponentScore = null;
      let finalScoreDisplay = null;
      
      if (status === 'Done' || status === 'Played') {
        [ourScore, opponentScore] = generateScore();
        finalScoreDisplay = `${ourScore} - ${opponentScore}`;
      }
      
      const game = new Game({
        gameTitle: `${team.season} ${team.teamName} vs ${opponent}`,
        team: team._id,
        season: team.season,
        teamName: team.teamName,
        date: gameDate,
        opponent: opponent,
        location: location,
        status: status,
        ourScore: ourScore,
        opponentScore: opponentScore,
        finalScoreDisplay: finalScoreDisplay,
        defenseSummary: status === 'Done' ? 'Solid defensive performance with good organization' : null,
        midfieldSummary: status === 'Done' ? 'Controlled the midfield well, good passing accuracy' : null,
        attackSummary: status === 'Done' ? 'Created several good scoring opportunities' : null,
        generalSummary: status === 'Done' ? 'Overall positive team performance with areas for improvement' : null
      });
      
      teamGames.push(game);
    }
    
    allGames.push(...teamGames);
    const finishedGames = teamGames.filter(g => g.status === 'Done' || g.status === 'Played').length;
    console.log(`  ✅ Generated ${teamGames.length} games for ${team.teamName} (${finishedGames} finished)`);
  }
  
  await Game.insertMany(allGames);
  console.log(`✅ Created ${allGames.length} total games`);
  
  return allGames;
};

// Generate game rosters
const generateGameRosters = async (games, players) => {
  console.log('📋 Generating game rosters...');
  
  const allRosters = [];
  
  for (const game of games) {
    // Get players for this team
    const teamPlayers = players.filter(p => p.team.toString() === game.team.toString());
    
    // Shuffle players and assign roles
    const shuffledPlayers = [...teamPlayers].sort(() => Math.random() - 0.5);
    
    // Starting lineup (11 players)
    const startingLineup = shuffledPlayers.slice(0, 11);
    // Bench (7 players)
    const benchPlayers = shuffledPlayers.slice(11, 18);
    // Not in squad (4 players)
    const notInSquad = shuffledPlayers.slice(18);
    
    // Create roster entries
    for (const player of startingLineup) {
      allRosters.push(new GameRoster({
        game: game._id,
        player: player._id,
        status: 'Starting Lineup',
        gameTitle: game.gameTitle,
        playerName: player.fullName,
        rosterEntry: `${game.gameTitle} - ${player.fullName}`
      }));
    }
    
    for (const player of benchPlayers) {
      allRosters.push(new GameRoster({
        game: game._id,
        player: player._id,
        status: 'Bench',
        gameTitle: game.gameTitle,
        playerName: player.fullName,
        rosterEntry: `${game.gameTitle} - ${player.fullName}`
      }));
    }
    
    for (const player of notInSquad) {
      allRosters.push(new GameRoster({
        game: game._id,
        player: player._id,
        status: 'Not in Squad',
        gameTitle: game.gameTitle,
        playerName: player.fullName,
        rosterEntry: `${game.gameTitle} - ${player.fullName}`
      }));
    }
  }
  
  await GameRoster.insertMany(allRosters);
  console.log(`✅ Created ${allRosters.length} roster entries`);
  
  return allRosters;
};

// Generate scout reports (Timeline Events)
const generateScoutReports = async (players, coaches, games) => {
  console.log('📊 Generating scout reports...');
  
  const allReports = [];
  
  for (const player of players) {
    // Find the coach for this player's team
    const team = await Team.findById(player.team);
    const coach = coaches.find(c => c._id.toString() === team.coach.toString());
    
    for (let reportIndex = 0; reportIndex < SCOUT_REPORTS_PER_PLAYER; reportIndex++) {
      const template = getRandomElement(SCOUT_REPORT_TEMPLATES);
      const reportDate = getRandomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        new Date() // Today
      );
      
      // For scout reports, we'll use a "dummy" training game entry
      // or we can create them tied to actual games for now
      const availableGames = games.filter(g => g.team.toString() === player.team.toString());
      const randomGame = getRandomElement(availableGames);
      
      const report = new TimelineEvent({
        player: player._id,
        game: randomGame._id, // Scout reports will be tied to games for now
        author: coach._id,
        date: reportDate,
        eventType: 'Scout Report',
        minutesPlayed: 0, // Not applicable for scout reports
        goals: 0,
        assists: 0,
        generalRating: getRandomNumber(2, 5), // Rating between 2-5
        generalNotes: `${template.type}: ${getRandomElement(template.notes)}`
      });
      
      allReports.push(report);
    }
  }
  
  await TimelineEvent.insertMany(allReports);
  console.log(`✅ Created ${allReports.length} scout reports`);
  
  return allReports;
};

// Generate game reports for finished games
const generateGameReports = async (games, gameRosters, coaches) => {
  console.log('🎯 Generating game reports for finished games...');
  
  const allGameReports = [];
  const finishedGames = games.filter(g => g.status === 'Done' || g.status === 'Played');
  
  for (const game of finishedGames) {
    // Get roster for this game (starting lineup and bench players who might have played)
    const gameRoster = gameRosters.filter(r => 
      r.game.toString() === game._id.toString() && 
      (r.status === 'Starting Lineup' || r.status === 'Bench')
    );
    
    // Find the coach for this team
    const team = await Team.findById(game.team);
    const coach = coaches.find(c => c._id.toString() === team.coach.toString());
    
    // Generate reports for players who participated
    const playersWhoPlayed = gameRoster.slice(0, getRandomNumber(11, Math.min(16, gameRoster.length)));
    
    for (const rosterEntry of playersWhoPlayed) {
      const minutesPlayed = rosterEntry.status === 'Starting Lineup' 
        ? getRandomNumber(60, 90) 
        : getRandomNumber(10, 45);
      
      const goals = getRandomNumber(0, 3) < 2 ? getRandomNumber(0, 2) : 0; // Most players don't score
      const assists = getRandomNumber(0, 3) < 2 ? getRandomNumber(0, 2) : 0;
      
      const gameReport = new TimelineEvent({
        player: rosterEntry.player,
        game: game._id,
        author: coach._id,
        date: game.date,
        eventType: 'Game Report',
        minutesPlayed: minutesPlayed,
        goals: goals,
        assists: assists,
        generalRating: getRandomNumber(2, 5),
        generalNotes: `Performance in ${game.gameTitle}. ${getRandomElement([
          'Good overall performance',
          'Solid defensive work',
          'Created several chances',
          'Good passing accuracy',
          'Strong physical presence',
          'Excellent work rate',
          'Key player in the match',
          'Room for improvement',
          'Positive contribution to team'
        ])}.`
      });
      
      allGameReports.push(gameReport);
    }
  }
  
  await TimelineEvent.insertMany(allGameReports);
  console.log(`✅ Created ${allGameReports.length} game reports for ${finishedGames.length} finished games`);
  
  return allGameReports;
};

// Generate some basic drills
const generateDrills = async (coaches) => {
  console.log('🏃‍♂️ Generating training drills...');
  
  const drillTemplates = [
    {
      name: 'Passing Accuracy',
      description: 'Focus on short and medium range passing accuracy under pressure',
      category: 'Technical',
      targetAgeGroup: ['U16', 'U18', 'Senior']
    },
    {
      name: 'Shooting Practice',
      description: 'Finishing drills from various angles and distances',
      category: 'Technical',
      targetAgeGroup: ['U14', 'U16', 'U18', 'Senior']
    },
    {
      name: 'Defensive Shape',
      description: 'Maintaining defensive line and shape during attacks',
      category: 'Tactical',
      targetAgeGroup: ['U16', 'U18', 'Senior']
    },
    {
      name: 'Sprint Intervals',
      description: 'High intensity running to build match fitness',
      category: 'Physical',
      targetAgeGroup: ['U14', 'U16', 'U18', 'Senior']
    },
    {
      name: 'Ball Control',
      description: 'First touch and close control in tight spaces',
      category: 'Technical',
      targetAgeGroup: ['U12', 'U14', 'U16', 'U18']
    }
  ];
  
  const drills = [];
  
  for (const coach of coaches) {
    for (const template of drillTemplates) {
      const drill = new Drill({
        drillName: template.name,
        description: template.description,
        category: template.category,
        targetAgeGroup: template.targetAgeGroup,
        videoLink: `https://example.com/drill-${template.name.toLowerCase().replace(' ', '-')}`,
        author: coach._id
      });
      
      drills.push(drill);
    }
  }
  
  await Drill.insertMany(drills);
  console.log(`✅ Created ${drills.length} training drills`);
  
  return drills;
};

// Main function
const generateMockData = async () => {
  try {
    console.log('🚀 Starting SquadUp mock data generation...');
    console.log('================================================');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Generate data in order (dependencies matter)
    const coaches = await generateCoaches();
    const teams = await generateTeams(coaches);
    const players = await generatePlayers(teams);
    const games = await generateGames(teams);
    const gameRosters = await generateGameRosters(games, players);
    const scoutReports = await generateScoutReports(players, coaches, games);
    const gameReports = await generateGameReports(games, gameRosters, coaches);
    const drills = await generateDrills(coaches);
    
    console.log('================================================');
    console.log('🎉 Mock data generation completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👨‍💼 Coaches: ${coaches.length}`);
    console.log(`   ⚽ Teams: ${teams.length}`);
    console.log(`   🏃‍♂️ Players: ${players.length}`);
    console.log(`   🏆 Games: ${games.length}`);
    console.log(`   📋 Game Rosters: ${gameRosters.length}`);
    console.log(`   📊 Scout Reports: ${scoutReports.length}`);
    console.log(`   🎯 Game Reports: ${gameReports.length}`);
    console.log(`   🏃‍♂️ Drills: ${drills.length}`);
    console.log('');
    console.log('🔑 Coach Login Credentials:');
    coaches.forEach((coach, index) => {
      console.log(`   ${coach.fullName}: ${coach.email} (${TEAMS_DATA[index].name})`);
    });
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the generator
if (require.main === module) {
  generateMockData()
    .then(() => {
      console.log('✅ Mock data generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Mock data generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateMockData };
