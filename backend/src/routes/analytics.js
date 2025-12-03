const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/goal-partnerships', analyticsController.getGoalPartnerships);
router.get('/player-goals', analyticsController.getPlayerGoals);
router.get('/player-substitutions', analyticsController.getPlayerSubstitutions);
router.get('/team-discipline', analyticsController.getTeamDiscipline);

module.exports = router;
