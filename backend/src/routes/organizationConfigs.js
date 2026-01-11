const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/jwtAuth');
const organizationConfigController = require('../controllers/organizationConfigController');

const router = express.Router();

router.get('/:orgId/config', authenticateJWT, organizationConfigController.getOrganizationConfig);
router.put('/:orgId/config', authenticateJWT, requireRole(['Admin']), organizationConfigController.updateOrganizationConfig);
router.get('/:orgId/config/feature/:featureName', authenticateJWT, organizationConfigController.checkFeatureEnabled);

module.exports = router;
