const OrganizationConfig = require('../models/OrganizationConfig');
const Team = require('../models/Team');
const { inferAgeGroupFromTeam } = require('../utils/ageGroupUtils');

exports.getOrganizationConfig = async (orgId) => {
  const query = orgId === 'default' || orgId === 'null' 
    ? { organizationId: null } 
    : { organizationId: orgId };

  let config = await OrganizationConfig.findOne(query);

  if (!config) {
    return {
      _id: null,
      organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
      features: {
        shotTrackingEnabled: false,
        positionSpecificMetricsEnabled: false,
        detailedDisciplinaryEnabled: true,
        goalInvolvementEnabled: true,
        gameDifficultyAssessmentEnabled: false
      },
      ageGroupOverrides: [],
      isDefault: true,
      createdAt: null,
      updatedAt: null
    };
  }

  const configData = config.toObject ? config.toObject() : JSON.parse(JSON.stringify(config));
  
  if (configData.ageGroupOverrides) {
    configData.ageGroupOverrides = configData.ageGroupOverrides.map(override => {
      const cleaned = { ageGroup: override.ageGroup };
      ['shotTrackingEnabled', 'positionSpecificMetricsEnabled', 'detailedDisciplinaryEnabled', 'goalInvolvementEnabled', 'gameDifficultyAssessmentEnabled'].forEach(feature => {
        if (feature in override) {
          cleaned[feature] = override[feature];
        }
      });
      return cleaned;
    });
  }
  
  return configData;
};

exports.updateOrganizationConfig = async (orgId, updateData) => {
  const { features, ageGroupOverrides } = updateData;

  if (!features && !ageGroupOverrides) {
    throw new Error('Must provide features or ageGroupOverrides');
  }

  const query = orgId === 'default' || orgId === 'null' 
    ? { organizationId: null } 
    : { organizationId: orgId };

  let config = await OrganizationConfig.findOne(query);

  if (!config) {
    config = await OrganizationConfig.create({
      organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
      features: features || {
        shotTrackingEnabled: false,
        positionSpecificMetricsEnabled: false,
        detailedDisciplinaryEnabled: true,
        goalInvolvementEnabled: true,
        gameDifficultyAssessmentEnabled: false
      },
      ageGroupOverrides: ageGroupOverrides || []
    });
  } else {
    if (features) {
      config.features = { ...config.features, ...features };
    }
    if (ageGroupOverrides) {
      config.ageGroupOverrides = ageGroupOverrides.map(override => {
        const overrideObj = { ageGroup: override.ageGroup };
        ['shotTrackingEnabled', 'positionSpecificMetricsEnabled', 'detailedDisciplinaryEnabled', 'goalInvolvementEnabled', 'gameDifficultyAssessmentEnabled'].forEach(feature => {
          if (override.hasOwnProperty(feature) && override[feature] !== null && override[feature] !== undefined) {
            overrideObj[feature] = override[feature];
          } else {
            overrideObj[feature] = null;
          }
        });
        return overrideObj;
      });
      config.markModified('ageGroupOverrides');
    }
    await config.save();
  }

  return config.toObject ? config.toObject() : config;
};

exports.checkFeatureEnabled = async (orgId, featureName, teamId) => {
  const query = orgId === 'default' || orgId === 'null' 
    ? { organizationId: null } 
    : { organizationId: orgId };

  const config = await OrganizationConfig.findOne(query);

  if (!config) {
    const defaultFeatures = {
      shotTrackingEnabled: false,
      positionSpecificMetricsEnabled: false,
      detailedDisciplinaryEnabled: true,
      goalInvolvementEnabled: true,
      gameDifficultyAssessmentEnabled: false
    };
    return { enabled: defaultFeatures[featureName] || false };
  }

  let enabled = config.features[featureName] || false;

  if (teamId) {
    const team = await Team.findById(teamId);
    
    if (team) {
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

  return { enabled };
};

