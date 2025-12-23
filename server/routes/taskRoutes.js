const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    extractTasksFromNote,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.post('/from-note/:noteId', protect, extractTasksFromNote);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
