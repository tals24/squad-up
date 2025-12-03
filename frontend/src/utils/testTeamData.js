/**
 * Test script to check team data structure
 * This can be run in the browser console to debug team data
 */

export const testTeamData = async () => {
  try {
    console.log('🧪 Testing team data...');
    
    // Import the getTeams function
    const { getTeams } = await import('@/api/functions');
    
    const response = await getTeams();
    console.log('🔍 Raw response:', response);
    
    if (response.data?.success && response.data?.data) {
      const teams = response.data.data;
      console.log('🔍 Teams count:', teams.length);
      console.log('🔍 Teams data:', teams);
      
      // Check first team structure
      if (teams.length > 0) {
        const firstTeam = teams[0];
        console.log('🔍 First team structure:', firstTeam);
        console.log('🔍 First team keys:', Object.keys(firstTeam));
        console.log('🔍 First team _id:', firstTeam._id);
        console.log('🔍 First team id:', firstTeam.id);
        console.log('🔍 First team teamName:', firstTeam.teamName);
        console.log('🔍 First team TeamName:', firstTeam.TeamName);
        console.log('🔍 First team Name:', firstTeam.Name);
      }
    } else {
      console.error('❌ No teams data found');
    }
  } catch (error) {
    console.error('❌ Error testing team data:', error);
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.testTeamData = testTeamData;
}
