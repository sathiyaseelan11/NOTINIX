const express = require('express');
const router = express.Router();
const {
    searchNotesAI,
    summarizeNote,
    extractTasksFromNote,
    autoTagNote,
    applyAutoTags,
    findRelatedNotes,
    getDailySummary,
    chatWithKnowledge,
    editNoteText
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// AI endpoints
router.post('/search', protect, searchNotesAI); // Legacy
router.post('/summarize', protect, summarizeNote);
router.post('/extract-tasks', protect, extractTasksFromNote);
router.post('/auto-tag', protect, autoTagNote);
router.post('/apply-tags', protect, applyAutoTags);
router.post('/find-related', protect, findRelatedNotes);
router.get('/daily-summary', protect, getDailySummary);
router.post('/chat-knowledge', protect, chatWithKnowledge);
router.post('/edit-text', protect, editNoteText);

module.exports = router;
