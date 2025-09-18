/**
 * Link existing coach users with Firebase UIDs
 * This fixes the 403 error by connecting mock data coaches with Firebase Auth
 */

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    }),
  });
}

const coaches = [
  {
    email: 'coach1@squadup.com',
    displayName: 'John Martinez'
  },
  {
    email: 'coach2@squadup.com',
    displayName: 'Sarah Thompson'
  },
  {
    email: 'coach3@squadup.com',
    displayName: 'Mike Rodriguez'
  }
];

async function linkFirebaseUsers() {
  try {
    console.log('🔗 Linking Firebase users with existing coach records...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    for (const coach of coaches) {
      try {
        // Get Firebase user
        const firebaseUser = await admin.auth().getUserByEmail(coach.email);
        console.log(`📧 Found Firebase user: ${coach.email} (UID: ${firebaseUser.uid})`);
        
        // Find existing coach in database
        const existingUser = await User.findOne({ email: coach.email });
        
        if (existingUser) {
          // Update existing user with Firebase UID
          existingUser.firebaseUid = firebaseUser.uid;
          await existingUser.save();
          console.log(`✅ Updated existing coach: ${coach.email}`);
        } else {
          console.log(`⚠️  No existing coach found for: ${coach.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${coach.email}:`, error.message);
      }
    }
    
    console.log('');
    console.log('🎉 Firebase linking complete!');
    console.log('');
    console.log('🔑 You can now login with:');
    coaches.forEach(coach => {
      console.log(`   ${coach.displayName}: ${coach.email} / password123`);
    });
    console.log('');
    console.log('✅ The 403 error should now be resolved!');
    
  } catch (error) {
    console.error('❌ Linking failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
linkFirebaseUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
