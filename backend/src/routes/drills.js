const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const drillController = require('../controllers/training/drillController');

const router = express.Router();

router.get('/', authenticateJWT, drillController.getAllDrills);
router.get('/:id', authenticateJWT, drillController.getDrillById);
router.post('/', authenticateJWT, drillController.createDrill);
router.put('/:id', authenticateJWT, drillController.updateDrill);
router.delete('/:id', authenticateJWT, drillController.deleteDrill);

module.exports = router;
