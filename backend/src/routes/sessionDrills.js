const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const sessionDrillController = require('../controllers/training/sessionDrillController');

const router = express.Router();

router.get('/', authenticateJWT, sessionDrillController.getAllSessionDrills);
router.get('/:id', authenticateJWT, sessionDrillController.getSessionDrillById);
router.post('/', authenticateJWT, sessionDrillController.createSessionDrill);
router.put('/:id', authenticateJWT, sessionDrillController.updateSessionDrill);
router.delete('/:id', authenticateJWT, sessionDrillController.deleteSessionDrill);
router.post('/batch', authenticateJWT, sessionDrillController.batchSaveTrainingPlan);

module.exports = router;
