const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const scoutReportController = require('../controllers/scoutReportController');

const router = express.Router();

router.get('/', authenticateJWT, scoutReportController.getAllScoutReports);
router.get('/:id', authenticateJWT, scoutReportController.getScoutReportById);
router.post('/', authenticateJWT, scoutReportController.createScoutReport);
router.put('/:id', authenticateJWT, scoutReportController.updateScoutReport);
router.delete('/:id', authenticateJWT, scoutReportController.deleteScoutReport);

module.exports = router;
