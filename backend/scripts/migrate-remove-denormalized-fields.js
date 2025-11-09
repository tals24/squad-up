/**
 * Migration Script: Remove Denormalized Fields from GameRoster
 * 
 * This script removes the following denormalized fields from all GameRoster documents:
 * - playerName
 * - gameTitle
 * - rosterEntry
 * 
 * These fields are no longer needed as the frontend performs lookups from
 * gamePlayers and game state instead of relying on stale denormalized data.
 * 
 * Usage:
 *   node backend/scripts/migrate-remove-denormalized-fields.js
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    console.log('🚀 Starting migration: Remove denormalized fields from GameRoster');
    console.log(`📊 Connecting to MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Using default'}`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/squad-up');
    
    console.log('✅ Connected to MongoDB');
    
    // Use native MongoDB driver to avoid Mongoose schema interference
    const db = mongoose.connection.db;
    const collection = db.collection('gamerosters');
    
    // Count documents before migration
    const totalCount = await collection.countDocuments({});
    console.log(`📈 Total GameRoster documents: ${totalCount}`);
    
    // Count documents that have denormalized fields
    const documentsWithFields = await collection.countDocuments({
      $or: [
        { playerName: { $exists: true } },
        { gameTitle: { $exists: true } },
        { rosterEntry: { $exists: true } }
      ]
    });
    console.log(`📋 Documents with denormalized fields: ${documentsWithFields}`);
    
    if (documentsWithFields === 0) {
      console.log('✅ No documents need migration. All denormalized fields already removed.');
      await mongoose.connection.close();
      return;
    }
    
    // Remove denormalized fields from all GameRoster documents using native driver
    console.log('🔄 Removing denormalized fields...');
    const result = await collection.updateMany(
      {},
      {
        $unset: {
          playerName: "",
          gameTitle: "",
          rosterEntry: ""
        }
      }
    );
    
    console.log(`✅ Migration complete!`);
    console.log(`   - Documents matched: ${result.matchedCount}`);
    console.log(`   - Documents modified: ${result.modifiedCount}`);
    
    // Verify migration
    const remainingWithFields = await collection.countDocuments({
      $or: [
        { playerName: { $exists: true } },
        { gameTitle: { $exists: true } },
        { rosterEntry: { $exists: true } }
      ]
    });
    
    if (remainingWithFields === 0) {
      console.log('✅ Verification passed: All denormalized fields removed');
    } else {
      console.warn(`⚠️  Warning: ${remainingWithFields} documents still have denormalized fields`);
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();

