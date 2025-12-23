const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStatus, connectNotion, triggerSync } = require('../controllers/syncController');

router.get('/status', protect, getStatus);
router.post('/notion/connect', protect, connectNotion);
router.post('/:platform/trigger', protect, triggerSync);

module.exports = router;
