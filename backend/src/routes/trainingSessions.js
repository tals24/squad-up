const express = require('express');
const { authenticateJWT, checkTeamAccess } = require('../middleware/jwtAuth');
const trainingSessionController = require('../controllers/training/trainingSessionController');

const router = express.Router();

router.get('/', authenticateJWT, trainingSessionController.getAllTrainingSessions);
router.get('/:id', authenticateJWT, checkTeamAccess, trainingSessionController.getTrainingSessionById);
router.post('/', authenticateJWT, trainingSessionController.createTrainingSession);
router.put('/:id', authenticateJWT, checkTeamAccess, trainingSessionController.updateTrainingSession);
router.delete('/:id', authenticateJWT, checkTeamAccess, trainingSessionController.deleteTrainingSession);

module.exports = router;
