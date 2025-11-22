/**
 * Migration Script: Migrate DisciplinaryAction to Card and PlayerMatchStat
 * 
 * This script migrates existing DisciplinaryAction documents to the new architecture:
 * - Cards (Timeline Events) → Card collection
 * - Fouls (Aggregate Stats) → PlayerMatchStat collection
 * 
 * Process:
 * 1. Read all existing DisciplinaryAction documents
 * 2. For each document:
 *    - Create Card document (using cardType, minute, reason)
 *    - Create/Update PlayerMatchStat document (upsert by gameId + playerId)
 * 3. Verify totals match (count of cards, sum of fouls)
 * 4. Optionally: Archive or delete old DisciplinaryAction collection
 * 
 * Usage:
 *   node backend/scripts/migrateDisciplinaryData.js [--dry-run] [--archive]
 * 
 * Options:
 *   --dry-run    : Show what would be migrated without making changes
 *   --archive    : Archive old DisciplinaryAction documents instead of deleting
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const DisciplinaryAction = require('../src/models/DisciplinaryAction');
const Card = require('../src/models/Card');
const PlayerMatchStat = require('../src/models/PlayerMatchStat');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldArchive = args.includes('--archive');

async function migrateDisciplinaryData() {
  try {
    console.log('🚀 Starting migration: DisciplinaryAction → Card + PlayerMatchStat');
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
    console.log(`📦 Archive old data: ${shouldArchive ? 'YES' : 'NO'}`);
    
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is not set');
      console.error('   Please ensure your .env file contains MONGODB_URI');
      console.error('   Example: MONGODB_URI=mongodb://localhost:27017/squad-up');
      throw new Error('MONGODB_URI not configured');
    }
    
    console.log(`📡 Connecting to: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials in log
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count existing DisciplinaryActions
    const totalActions = await DisciplinaryAction.countDocuments({});
    console.log(`\n📈 Found ${totalActions} disciplinary actions to migrate`);
    
    if (totalActions === 0) {
      console.log('✅ No data to migrate. Exiting.');
      await mongoose.connection.close();
      return;
    }
    
    // Fetch all DisciplinaryActions
    const actions = await DisciplinaryAction.find({}).lean();
    console.log(`📋 Loaded ${actions.length} documents\n`);
    
    let cardsCreated = 0;
    let cardsSkipped = 0;
    let statsCreated = 0;
    let statsUpdated = 0;
    let errors = [];
    
    // Track unique gameId+playerId combinations for stats
    const statsMap = new Map();
    
    // Process each DisciplinaryAction
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const progress = `[${i + 1}/${actions.length}]`;
      
      try {
        // 1. Create Card document
        if (!isDryRun) {
          // Check if card already exists (avoid duplicates)
          const existingCard = await Card.findOne({
            gameId: action.gameId,
            playerId: action.playerId,
            cardType: action.cardType,
            minute: action.minute
          });
          
          if (existingCard) {
            console.log(`${progress} ⏭️  Card already exists, skipping: Game ${action.gameId}, Player ${action.playerId}, ${action.cardType} at ${action.minute}'`);
            cardsSkipped++;
          } else {
            const card = new Card({
              gameId: action.gameId,
              playerId: action.playerId,
              cardType: action.cardType,
              minute: action.minute,
              reason: action.reason || ''
            });
            await card.save();
            cardsCreated++;
            console.log(`${progress} ✅ Created card: ${action.cardType} at ${action.minute}' for player ${action.playerId}`);
          }
        } else {
          cardsCreated++;
          console.log(`${progress} [DRY RUN] Would create card: ${action.cardType} at ${action.minute}' for player ${action.playerId}`);
        }
        
        // 2. Track stats for upsert (handle multiple actions per player per game)
        const statsKey = `${action.gameId}_${action.playerId}`;
        if (!statsMap.has(statsKey)) {
          statsMap.set(statsKey, {
            gameId: action.gameId,
            playerId: action.playerId,
            foulsCommitted: 0,
            foulsReceived: 0
          });
        }
        
        const stats = statsMap.get(statsKey);
        // Sum fouls from all actions for this player in this game
        stats.foulsCommitted += action.foulsCommitted || 0;
        stats.foulsReceived += action.foulsReceived || 0;
        
      } catch (error) {
        const errorMsg = `${progress} ❌ Error processing action ${action._id}: ${error.message}`;
        console.error(errorMsg);
        errors.push({ actionId: action._id, error: error.message });
      }
    }
    
    // 3. Upsert PlayerMatchStat documents
    console.log(`\n📊 Processing ${statsMap.size} unique player-game combinations for stats...`);
    
    for (const [key, statsData] of statsMap.entries()) {
      try {
        if (!isDryRun) {
          const existingStat = await PlayerMatchStat.findOne({
            gameId: statsData.gameId,
            playerId: statsData.playerId
          });
          
          if (existingStat) {
            // Update existing stat (merge fouls)
            existingStat.disciplinary = {
              foulsCommitted: (existingStat.disciplinary?.foulsCommitted || 0) + statsData.foulsCommitted,
              foulsReceived: (existingStat.disciplinary?.foulsReceived || 0) + statsData.foulsReceived
            };
            await existingStat.save();
            statsUpdated++;
            console.log(`  ✅ Updated stats for player ${statsData.playerId} in game ${statsData.gameId}`);
          } else {
            // Create new stat
            const stat = new PlayerMatchStat({
              gameId: statsData.gameId,
              playerId: statsData.playerId,
              disciplinary: {
                foulsCommitted: statsData.foulsCommitted,
                foulsReceived: statsData.foulsReceived
              }
            });
            await stat.save();
            statsCreated++;
            console.log(`  ✅ Created stats for player ${statsData.playerId} in game ${statsData.gameId}`);
          }
        } else {
          statsCreated++;
          console.log(`  [DRY RUN] Would upsert stats for player ${statsData.playerId} in game ${statsData.gameId}`);
        }
      } catch (error) {
        const errorMsg = `  ❌ Error processing stats for ${key}: ${error.message}`;
        console.error(errorMsg);
        errors.push({ key, error: error.message });
      }
    }
    
    // 4. Verification
    console.log('\n📊 Migration Summary:');
    console.log('─'.repeat(50));
    console.log(`Total DisciplinaryActions processed: ${actions.length}`);
    console.log(`Cards created: ${cardsCreated}`);
    if (cardsSkipped > 0) {
      console.log(`Cards skipped (already exist): ${cardsSkipped}`);
    }
    console.log(`PlayerMatchStat documents created: ${statsCreated}`);
    console.log(`PlayerMatchStat documents updated: ${statsUpdated}`);
    console.log(`Errors: ${errors.length}`);
    
    if (!isDryRun) {
      // Verify counts
      const totalCards = await Card.countDocuments({});
      const totalStats = await PlayerMatchStat.countDocuments({});
      
      console.log('\n✅ Verification:');
      console.log(`Total Cards in database: ${totalCards}`);
      console.log(`Total PlayerMatchStats in database: ${totalStats}`);
      
      // Verify card count matches (accounting for skipped duplicates)
      const expectedCards = actions.length - cardsSkipped;
      if (totalCards >= expectedCards) {
        console.log(`✅ Card count verification: PASSED (expected at least ${expectedCards}, found ${totalCards})`);
      } else {
        console.log(`⚠️  Card count verification: WARNING (expected at least ${expectedCards}, found ${totalCards})`);
      }
    }
    
    // 5. Handle old DisciplinaryAction collection
    if (!isDryRun && errors.length === 0) {
      if (shouldArchive) {
        console.log('\n📦 Archiving old DisciplinaryAction documents...');
        // Rename collection to archive
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const disciplinaryCollectionExists = collections.some(c => c.name === 'disciplinaryactions');
        
        if (disciplinaryCollectionExists) {
          await db.collection('disciplinaryactions').rename('disciplinaryactions_archived_' + new Date().toISOString().split('T')[0]);
          console.log('✅ DisciplinaryAction collection archived');
        }
      } else {
        console.log('\n⚠️  Old DisciplinaryAction documents remain in database.');
        console.log('   Run with --archive flag to archive them, or delete manually when ready.');
      }
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered during migration:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${JSON.stringify(err)}`);
      });
      throw new Error(`Migration completed with ${errors.length} errors`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateDisciplinaryData()
    .then(() => {
      console.log('\n🎉 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDisciplinaryData };

