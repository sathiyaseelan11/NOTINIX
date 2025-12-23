const express = require('express');
const router = express.Router();
const {
    getChats,
    getChatById,
    createChat,
    sendMessage,
    deleteChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getChats).post(protect, createChat);
router.route('/:id').get(protect, getChatById).delete(protect, deleteChat);
router.route('/:id/message').post(protect, sendMessage);

module.exports = router;
