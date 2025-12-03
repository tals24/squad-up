const express = require('express');
const { authenticateJWT, checkTeamAccess } = require('../middleware/jwtAuth');
const playerController = require('../controllers/playerController');

const router = express.Router();

router.get('/', authenticateJWT, playerController.getAllPlayers);
router.get('/:id', authenticateJWT, checkTeamAccess, playerController.getPlayerById);
router.post('/', authenticateJWT, playerController.createPlayer);
router.put('/:id', authenticateJWT, checkTeamAccess, playerController.updatePlayer);
router.delete('/:id', authenticateJWT, checkTeamAccess, playerController.deletePlayer);

module.exports = router;
