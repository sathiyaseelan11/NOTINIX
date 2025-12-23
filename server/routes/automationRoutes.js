const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAutomations, createAutomation, toggleAutomation, deleteAutomation } = require('../controllers/automationController');

router.get('/', protect, getAutomations);
router.post('/', protect, createAutomation);
router.put('/:id/toggle', protect, toggleAutomation);
router.delete('/:id', protect, deleteAutomation);

module.exports = router;
