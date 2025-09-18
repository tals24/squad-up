require('dotenv').config();
const mongoose = require('mongoose');

async function fixFirebaseUidIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the existing firebaseUid index
    try {
      await collection.dropIndex('firebaseUid_1');
      console.log('Dropped existing firebaseUid index');
    } catch (error) {
      console.log('Index might not exist:', error.message);
    }

    // Create new sparse unique index
    await collection.createIndex(
      { firebaseUid: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('Created new sparse unique index for firebaseUid');

    await mongoose.connection.close();
    console.log('Fixed firebaseUid index successfully!');
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
}

fixFirebaseUidIndex();
