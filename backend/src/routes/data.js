const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const dataController = require('../controllers/dataController');

const router = express.Router();

router.get('/all', authenticateJWT, dataController.getAllData);
router.post('/airtable-sync', authenticateJWT, dataController.airtableSync);

module.exports = router;
