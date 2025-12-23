const Note = require('../models/noteModel');
const Task = require('../models/taskModel');

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not found in request' });
        }
        console.log(`[DEBUG] getTasks for user: ${req.user._id}`);
        const { status, priority, filter } = req.query;
        let query = { user: req.user._id };

        if (status) query.status = status;
        if (priority) query.priority = priority;

        // Special filters
        if (filter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query.dueDate = { $gte: today, $lt: tomorrow };
        } else if (filter === 'overdue') {
            query.dueDate = { $lt: new Date() };
            query.completed = false;
        } else if (filter === 'upcoming') {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            query.dueDate = { $gte: today, $lte: nextWeek };
        }

        const tasks = await Task.find(query)
            .populate('sourceNoteId', 'title')
            .sort({ dueDate: 1, priority: -1 });

        console.log(`[DEBUG] Found ${tasks.length} tasks`);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('sourceNoteId');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        console.log(`[DEBUG] createTask for user: ${req.user?._id}`);
        const { title, description, status, priority, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const task = await Task.create({
            user: req.user._id,
            title,
            description: description || '',
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate: dueDate || null,
        });

        console.log(`[DEBUG] Task created: ${task._id}`);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // If task is being marked as completed
        if (req.body.status === 'done' && task.status !== 'done') {
            req.body.completed = true;
            req.body.completedAt = new Date();
        } else if (req.body.status !== 'done') {
            req.body.completed = false;
            req.body.completedAt = null;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('sourceNoteId');

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        console.log(`[DEBUG] deleteTask request for ID: ${req.params.id} by user: ${req.user?._id}`);
        const task = await Task.findById(req.params.id);

        if (!task) {
            console.log(`[DEBUG] deleteTask: Task not found ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user._id.toString()) {
            console.log(`[DEBUG] deleteTask: Unauthorized attempt by ${req.user._id} for task owned by ${task.user}`);
            return res.status(403).json({ message: 'Not authorized' });
        }

        await task.deleteOne();
        console.log(`[DEBUG] deleteTask: Task ${req.params.id} deleted successfully`);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('[DEBUG] deleteTask ERROR (STACK TRACE):', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Extract tasks from note using AI
// @route   POST /api/tasks/from-note/:noteId
// @access  Private
const extractTasksFromNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Use OpenAI service to extract tasks
        const openaiService = require('../services/openaiService');
        const extractedTasks = await openaiService.extractTasks(note.content);

        // Create tasks
        const tasks = await Promise.all(
            extractedTasks.map(taskData =>
                Task.create({
                    user: req.user._id,
                    title: taskData.title,
                    description: taskData.description || '',
                    priority: taskData.priority || 'medium',
                    sourceNoteId: note._id,
                    projectId: note.projectId,
                    aiGenerated: true,
                })
            )
        );

        res.status(201).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    extractTasksFromNote,
};
