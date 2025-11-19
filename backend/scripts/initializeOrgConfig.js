require('dotenv').config();
const mongoose = require('mongoose');
const OrganizationConfig = require('../src/models/OrganizationConfig');

/**
 * Migration script to initialize organization configuration
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Checks if organization config exists
 * 3. Creates default config if missing
 * 4. Displays current config status
 * 
 * Usage: node scripts/initializeOrgConfig.js
 */
async function initializeOrgConfig() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if config already exists
    const existingConfig = await OrganizationConfig.findOne({ organizationId: null });
    
    if (!existingConfig) {
      console.log('📝 Creating default organization config...');
      await OrganizationConfig.create({
        organizationId: null,
        features: {
          shotTrackingEnabled: false,
          positionSpecificMetricsEnabled: false,
          detailedDisciplinaryEnabled: true,  // Already implemented
          goalInvolvementEnabled: true        // Already implemented
        },
        ageGroupOverrides: []
      });
      console.log('✅ Organization config initialized with default values');
      console.log('   Features:');
      console.log('   - shotTrackingEnabled: false');
      console.log('   - positionSpecificMetricsEnabled: false');
      console.log('   - detailedDisciplinaryEnabled: true');
      console.log('   - goalInvolvementEnabled: true');
      console.log('   Age Group Overrides: []');
    } else {
      console.log('ℹ️  Organization config already exists');
      console.log('   Features:', JSON.stringify(existingConfig.features, null, 2));
      console.log('   Age group overrides count:', existingConfig.ageGroupOverrides.length);
      
      if (existingConfig.ageGroupOverrides.length > 0) {
        console.log('   Overrides:');
        existingConfig.ageGroupOverrides.forEach(override => {
          console.log(`   - ${override.ageGroup}:`, {
            shotTracking: override.shotTrackingEnabled,
            positionMetrics: override.positionSpecificMetricsEnabled
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
initializeOrgConfig()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

