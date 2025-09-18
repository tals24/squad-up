import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Get current user (replaces User.me())
  async me() {
    return new Promise(async (resolve, reject) => {
      if (this.currentUser) {
        try {
          const user = await this.formatUser(this.currentUser);
          resolve(user);
        } catch (error) {
          reject(error);
        }
      } else {
        // Wait for auth state to be determined
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            try {
              const formattedUser = await this.formatUser(user);
              resolve(formattedUser);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('No user authenticated'));
          }
        });
      }
    });
  }

  // Sign in with email and password
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.formatUser(userCredential.user);
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign in with Google
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await this.formatUser(result.user);
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign in with redirect (for popup blockers)
  async loginWithRedirect(redirectUrl = window.location.href) {
    try {
      // Store redirect URL for after login
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      
      // Use Google sign-in with redirect
      const result = await signInWithPopup(auth, googleProvider);
      return this.formatUser(result.user);
    } catch (error) {
      // If popup fails, try redirect
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (redirectError) {
        throw new Error(this.getErrorMessage(redirectError.code));
      }
    }
  }

  // Register new user
  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return await this.formatUser(userCredential.user);
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return true;
    } catch (error) {
      throw new Error('Failed to sign out');
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Format user object to match Base44 format
  async formatUser(firebaseUser) {
    // Get the Firebase ID token for API calls
    const accessToken = await firebaseUser.getIdToken();
    
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email,
      role: 'user', // Default role, you can customize this based on your needs
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      accessToken: accessToken, // Store token for API calls
      // Add any other properties you need
    };
    
    // Store user data in localStorage for API calls
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  }

  // Get user-friendly error messages
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      default:
        return 'An error occurred during authentication.';
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user synchronously
  getCurrentUser() {
    // Return user data from localStorage if available
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

// Export individual methods for backward compatibility
export const {
  me,
  login,
  loginWithGoogle,
  loginWithRedirect,
  register,
  logout,
  resetPassword,
  onAuthStateChange,
  isAuthenticated,
  getCurrentUser
} = authService;

