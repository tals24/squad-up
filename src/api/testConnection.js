// Test connection to backend API
const API_BASE_URL = 'http://localhost:3001/api';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health check passed:', healthData);
    } else {
      console.error('❌ Backend health check failed:', healthResponse.status);
      return false;
    }
    
    // Test data endpoint (this will require authentication)
    const dataResponse = await fetch(`${API_BASE_URL}/data/all`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      console.log('✅ Backend data endpoint accessible:', data);
      return true;
    } else {
      console.log('⚠️ Backend data endpoint requires authentication:', dataResponse.status);
      return true; // This is expected without auth
    }
    
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

// Test function that can be called from browser console
window.testBackend = testBackendConnection;

