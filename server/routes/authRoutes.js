const express = require('express');
const router = express.Router();
const { authUser, registerUser, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
