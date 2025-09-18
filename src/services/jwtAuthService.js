// JWT-based authentication service to replace Firebase
class JwtAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.token = localStorage.getItem('authToken');
    this.userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Initialize current user if token exists
    if (this.token && this.userData) {
      this.currentUser = this.userData;
    }
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Get current user (replaces Firebase auth)
  async me() {
    return new Promise((resolve, reject) => {
      if (this.currentUser && this.token) {
        resolve(this.formatUser(this.currentUser));
      } else {
        reject(new Error('No authenticated user'));
      }
    });
  }

  // Login with email and password
  async login(email, password) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        this.token = data.token;
        this.userData = data.user;
        this.currentUser = data.user;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Notify listeners
        this.authStateListeners.forEach(listener => listener(this.currentUser));
        
        return this.formatUser(data.user);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Sign out
  async signOut() {
    this.token = null;
    this.userData = null;
    this.currentUser = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Notify listeners
    this.authStateListeners.forEach(listener => listener(null));
  }

  // Verify current token
  async verifyToken() {
    if (!this.token) {
      throw new Error('No token available');
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.user;
        this.userData = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        return this.formatUser(data.user);
      } else {
        // Token is invalid, clear auth
        await this.signOut();
        throw new Error('Token verification failed');
      }
    } catch (error) {
      await this.signOut();
      throw error;
    }
  }

  // Format user data to match expected format
  formatUser(userData) {
    return {
      id: userData.id,
      userID: userData.userID,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      department: userData.department,
      phoneNumber: userData.phoneNumber,
      displayName: userData.fullName,
      uid: userData.id // For compatibility
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }

  // Get auth token for API requests
  getAuthToken() {
    return this.token;
  }
}

// Create singleton instance
const jwtAuthService = new JwtAuthService();
export default jwtAuthService;
