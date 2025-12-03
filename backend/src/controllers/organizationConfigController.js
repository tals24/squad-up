const organizationConfigService = require('../services/organizationConfigService');

exports.getOrganizationConfig = async (req, res) => {
  try {
    const { orgId } = req.params;
    const data = await organizationConfigService.getOrganizationConfig(orgId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get organization config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization configuration'
    });
  }
};

exports.updateOrganizationConfig = async (req, res) => {
  try {
    const { orgId } = req.params;
    const data = await organizationConfigService.updateOrganizationConfig(orgId, req.body);
    res.json({
      success: true,
      data,
      message: 'Organization configuration updated successfully'
    });
  } catch (error) {
    console.error('Update organization config error:', error);
    
    if (error.message === 'Must provide features or ageGroupOverrides') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
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
};

exports.checkFeatureEnabled = async (req, res) => {
  try {
    const { orgId, featureName } = req.params;
    const { teamId } = req.query;
    const result = await organizationConfigService.checkFeatureEnabled(orgId, featureName, teamId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Check feature enabled error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature status'
    });
  }
};

