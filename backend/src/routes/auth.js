const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/verify', authenticateJWT, authController.verifyToken);
router.get('/me', authenticateJWT, authController.getCurrentUser);
router.put('/profile', authenticateJWT, authController.updateProfile);
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
