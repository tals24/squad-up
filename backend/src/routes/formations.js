const express = require('express');
const { authenticateJWT, checkTeamAccess } = require('../middleware/jwtAuth');
const formationController = require('../controllers/formationController');

const router = express.Router();

router.get('/', authenticateJWT, formationController.getAllFormations);
router.get('/:id', authenticateJWT, formationController.getFormationById);
router.post('/', authenticateJWT, formationController.createFormation);
router.put('/:id', authenticateJWT, checkTeamAccess, formationController.updateFormation);
router.delete('/:id', authenticateJWT, checkTeamAccess, formationController.deleteFormation);

module.exports = router;
