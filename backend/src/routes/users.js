const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/jwtAuth');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', authenticateJWT, requireRole(['Admin', 'Department Manager']), userController.getAllUsers);
router.get('/:id', authenticateJWT, userController.getUserById);
router.post('/', authenticateJWT, requireRole(['Admin']), userController.createUser);
router.put('/:id', authenticateJWT, requireRole(['Admin']), userController.updateUser);
router.delete('/:id', authenticateJWT, requireRole(['Admin']), userController.deleteUser);

module.exports = router;
