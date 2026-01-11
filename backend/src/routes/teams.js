const express = require('express');
const { authenticateJWT, requireRole, checkTeamAccess } = require('../middleware/jwtAuth');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.get('/', authenticateJWT, teamController.getAllTeams);
router.get('/:id', authenticateJWT, checkTeamAccess, teamController.getTeamById);
router.post('/', authenticateJWT, requireRole(['Admin', 'Department Manager']), teamController.createTeam);
router.put('/:id', authenticateJWT, checkTeamAccess, teamController.updateTeam);
router.delete('/:id', authenticateJWT, requireRole(['Admin', 'Department Manager']), teamController.deleteTeam);

module.exports = router;
