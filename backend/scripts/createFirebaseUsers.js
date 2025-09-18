/**
 * Create Firebase Auth users for the mock coaches
 * Run this after generating mock data
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin (using existing service account)
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
    password: 'password123',
    displayName: 'John Martinez',
    team: 'Eagles FC'
  },
  {
    email: 'coach2@squadup.com', 
    password: 'password123',
    displayName: 'Sarah Thompson',
    team: 'Tigers United'
  },
  {
    email: 'coach3@squadup.com',
    password: 'password123', 
    displayName: 'Mike Rodriguez',
    team: 'Wolves Academy'
  }
];

async function createFirebaseUsers() {
  console.log('🔥 Creating Firebase Auth users for coaches...');
  
  for (const coach of coaches) {
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(coach.email);
        console.log(`✅ User ${coach.email} already exists`);
        continue;
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }
      
      // Create new user
      userRecord = await admin.auth().createUser({
        email: coach.email,
        password: coach.password,
        displayName: coach.displayName,
        emailVerified: true,
      });
      
      console.log(`✅ Created Firebase user: ${coach.email} (${coach.team})`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${coach.email}:`, error.message);
    }
  }
  
  console.log('');
  console.log('🎉 Firebase Auth setup complete!');
  console.log('');
  console.log('🔑 Login Credentials:');
  coaches.forEach(coach => {
    console.log(`   ${coach.displayName}: ${coach.email} / ${coach.password} (${coach.team})`);
  });
  console.log('');
  console.log('🚀 You can now login at: http://localhost:5173');
}

// Run the script
createFirebaseUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
