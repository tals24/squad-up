const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/jwtAuth');
const OrganizationConfig = require('../models/OrganizationConfig');
const { inferAgeGroupFromTeam } = require('../utils/ageGroupUtils');

const router = express.Router();

/**
 * GET /api/organizations/:orgId/config
 * Get organization configuration
 * Access: All authenticated users (Coaches, Managers, Admins)
 */
router.get('/:orgId/config', authenticateJWT, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    // For single-org: orgId can be 'default' or actual ObjectId
    // If orgId is 'default', find config with null organizationId
    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    let config = await OrganizationConfig.findOne(query);

    // If no config exists, return default values WITHOUT saving
    // This follows REST principles (GET should not modify data)
    if (!config) {
      return res.json({
        success: true,
        data: {
          _id: null, // Indicates this is not saved
          organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
          features: {
            shotTrackingEnabled: false,
            positionSpecificMetricsEnabled: false,
            detailedDisciplinaryEnabled: true,
            goalInvolvementEnabled: true
          },
          ageGroupOverrides: [],
          isDefault: true, // Flag to indicate this is a default response
          createdAt: null,
          updatedAt: null
        }
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get organization config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization configuration'
    });
  }
});

/**
 * PUT /api/organizations/:orgId/config
 * Update organization configuration
 * Access: Admin only
 */
router.put('/:orgId/config', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { features, ageGroupOverrides } = req.body;

    // Validate request body
    if (!features && !ageGroupOverrides) {
      return res.status(400).json({
        success: false,
        error: 'Must provide features or ageGroupOverrides'
      });
    }

    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    // Find or create config
    let config = await OrganizationConfig.findOne(query);

    if (!config) {
      config = await OrganizationConfig.create({
        organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
        features: features || {
          shotTrackingEnabled: false,
          positionSpecificMetricsEnabled: false,
          detailedDisciplinaryEnabled: true,
          goalInvolvementEnabled: true
        },
        ageGroupOverrides: ageGroupOverrides || []
      });
    } else {
      // Update existing config
      if (features) {
        config.features = { ...config.features, ...features };
      }
      if (ageGroupOverrides) {
        config.ageGroupOverrides = ageGroupOverrides;
      }
      await config.save();
    }

    res.json({
      success: true,
      data: config,
      message: 'Organization configuration updated successfully'
    });
  } catch (error) {
    console.error('Update organization config error:', error);
    
    // Handle duplicate age group validation error
    if (error.message && error.message.includes('Duplicate age group')) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate age group overrides are not allowed'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update organization configuration'
    });
  }
});

/**
 * GET /api/organizations/:orgId/config/feature/:featureName
 * Check if a specific feature is enabled (for a team/age group)
 * Access: All authenticated users
 * Query params: ?teamId=xxx (optional, for age group override check)
 */
router.get('/:orgId/config/feature/:featureName', authenticateJWT, async (req, res) => {
  try {
    const { orgId, featureName } = req.params;
    const { teamId } = req.query;

    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    const config = await OrganizationConfig.findOne(query);

    if (!config) {
      // Return default values if config doesn't exist
      const defaultFeatures = {
        shotTrackingEnabled: false,
        positionSpecificMetricsEnabled: false,
        detailedDisciplinaryEnabled: true,
        goalInvolvementEnabled: true
      };
      return res.json({
        success: true,
        data: {
          enabled: defaultFeatures[featureName] || false
        }
      });
    }

    // Get global feature value
    let enabled = config.features[featureName] || false;

    // If teamId provided, check for age group override
    if (teamId) {
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      
      if (team) {
        // Infer age group from team name or division
        const ageGroup = inferAgeGroupFromTeam(team);
        
        if (ageGroup) {
          const override = config.ageGroupOverrides.find(
            o => o.ageGroup === ageGroup
          );
          
          if (override && override[featureName] !== null && override[featureName] !== undefined) {
            enabled = override[featureName];
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        enabled
      }
    });
  } catch (error) {
    console.error('Check feature enabled error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature status'
    });
  }
});

module.exports = router;

