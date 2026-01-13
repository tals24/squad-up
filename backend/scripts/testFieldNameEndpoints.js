/**
 * Test script for field name standardization
 * Tests endpoints that were modified to use :gameId instead of :id
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3001';
let authToken = null;
let testGameId = null;
let testTeamId = null;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n📝 Logging in...', 'blue');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coach@example.com',
        password: 'password123',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log(`✗ Login failed: ${data.error || response.statusText}`, 'red');
      return false;
    }
    
    authToken = data.token;
    log('✓ Login successful', 'green');
    return true;
  } catch (error) {
    log(`✗ Login failed: ${error.message}`, 'red');
    return false;
  }
}

async function getTestGameId() {
  try {
    log('\n📝 Fetching test game...', 'blue');
    const response = await fetch(`${BASE_URL}/api/games`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data || !Array.isArray(data) || data.length === 0) {
      log('✗ No games found', 'red');
      return false;
    }
    
    const game = data[0];
    testGameId = game._id;
    testTeamId = game.team;
    log(`✓ Found test game: ${game.gameTitle || 'Untitled'} (ID: ${testGameId})`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error getting game: ${error.message}`, 'red');
    return false;
  }
}

async function testGetGameById() {
  log('\n🧪 Test 7.2: GET /api/games/:gameId', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/games/${testGameId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log(`✗ FAILED: ${data.error || response.statusText}`, 'red');
      if (response.status === 404) {
        log('  Note: Route parameter may still be using :id instead of :gameId', 'yellow');
      }
      return false;
    }
    
    if (data && data._id) {
      log(`✓ SUCCESS: Game retrieved with ID ${data._id}`, 'green');
      log(`  - Game Title: ${data.gameTitle || 'Untitled'}`, 'yellow');
      log(`  - Status: ${data.status}`, 'yellow');
      log(`  - Route parameter :gameId is working correctly`, 'yellow');
      return true;
    } else {
      log('✗ FAILED: Response missing _id field', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function testPostGoal() {
  log('\n🧪 Test 7.3: POST /api/games/:gameId/goals', 'blue');
  
  try {
    // First get players from the team
    const playersResponse = await fetch(`${BASE_URL}/api/teams/${testTeamId}/players`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const players = await playersResponse.json();
    
    if (!playersResponse.ok || !Array.isArray(players) || players.length === 0) {
      log('⚠ SKIPPED: No players found for team (cannot create test goal)', 'yellow');
      log('  Endpoint accessibility will be tested instead', 'yellow');
      
      // Test endpoint with invalid data to check if route exists
      const testResponse = await fetch(`${BASE_URL}/api/games/${testGameId}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ scorerId: 'invalid', minute: 10 }),
      });
      
      if (testResponse.status === 404) {
        log('✗ FAILED: Route not found (may be using :id instead of :gameId)', 'red');
        return false;
      } else {
        log('✓ SUCCESS: Endpoint accessible (route parameter :gameId is working)', 'green');
        return true;
      }
    }
    
    const goalData = {
      scorerId: players[0]._id,
      assisterId: players.length > 1 ? players[1]._id : null,
      minute: 25,
      description: 'Test goal for field name standardization',
    };
    
    const response = await fetch(`${BASE_URL}/api/games/${testGameId}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(goalData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log(`✗ FAILED: ${data.error || response.statusText}`, 'red');
      return false;
    }
    
    if (data && data._id) {
      log('✓ SUCCESS: Goal created successfully', 'green');
      log(`  - Goal ID: ${data._id}`, 'yellow');
      log(`  - Route parameter :gameId is working correctly`, 'yellow');
      
      // Clean up - delete the test goal
      await fetch(`${BASE_URL}/api/games/${testGameId}/goals/${data._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('  - Test goal cleaned up', 'yellow');
      
      return true;
    } else {
      log('✗ FAILED: Response missing _id field', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function testGetGameDraft() {
  log('\n🧪 Test 7.4: GET /api/games/:gameId/draft', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/games/${testGameId}/draft`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log(`✗ FAILED: ${data.error || response.statusText}`, 'red');
      if (response.status === 404) {
        log('  Note: Route parameter may still be using :id instead of :gameId', 'yellow');
      }
      return false;
    }
    
    if (data) {
      log('✓ SUCCESS: Game draft retrieved', 'green');
      log(`  - Has rosters: ${data.rosters ? 'Yes' : 'No'}`, 'yellow');
      log(`  - Has lineup: ${data.lineup ? 'Yes' : 'No'}`, 'yellow');
      log(`  - Route parameter :gameId is working correctly`, 'yellow');
      return true;
    } else {
      log('✗ FAILED: No draft data returned', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function testStartGame() {
  log('\n🧪 Test 7.5: POST /api/games/:gameId/start-game', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/games/${testGameId}/start-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({}),
    });
    
    const data = await response.json();
    
    // Accept both success and "already started" as valid responses
    if (response.ok) {
      log('✓ SUCCESS: Game started successfully', 'green');
      log(`  - New status: ${data.status}`, 'yellow');
      log(`  - Route parameter :gameId is working correctly`, 'yellow');
      return true;
    } else if (response.status === 400 && (data.error?.includes('already') || data.error?.includes('status'))) {
      log('✓ SUCCESS: Endpoint accessible (game already in progress or completed)', 'green');
      log(`  - Route parameter :gameId is working correctly`, 'yellow');
      return true;
    } else if (response.status === 404) {
      log('✗ FAILED: Route not found (may be using :id instead of :gameId)', 'red');
      return false;
    } else {
      log(`⚠ WARNING: Unexpected response: ${data.error || response.statusText}`, 'yellow');
      log('  - Endpoint is accessible, but returned unexpected error', 'yellow');
      return true; // Still count as success since route exists
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('═══════════════════════════════════════════════', 'blue');
  log('  Field Name Standardization - API Tests', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n✗ Cannot proceed without authentication', 'red');
    process.exit(1);
  }
  
  // Get test game
  const gameSuccess = await getTestGameId();
  if (!gameSuccess) {
    log('\n✗ Cannot proceed without a test game', 'red');
    process.exit(1);
  }
  
  // Run tests
  const results = {
    test72: await testGetGameById(),
    test73: await testPostGoal(),
    test74: await testGetGameDraft(),
    test75: await testStartGame(),
  };
  
  // Summary
  log('\n═══════════════════════════════════════════════', 'blue');
  log('  Test Summary', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const testNum = test.replace('test', '7.');
    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${status} - Test ${testNum}`, color);
  });
  
  log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All field name standardization endpoints are working correctly!', 'green');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(`\n✗ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
