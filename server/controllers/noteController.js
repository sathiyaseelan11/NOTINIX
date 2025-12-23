const Note = require('../models/noteModel');
const automationService = require('../services/automationService');

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    try {
        console.log('[DEBUG] createNote request body:', req.body);
        const { title, content, source, tags, parentId, icon } = req.body;

        // Allow empty content for new pages, but title should ideally exist (or default to Untitled on client)
        if (title === undefined) {
            console.log('[DEBUG] createNote: Title is undefined');
            return res.status(400).json({ message: 'Title is required' });
        }

        const note = new Note({
            user: req.user._id,
            title: title || 'Untitled',
            content: content || '',
            source: source || 'manual',
            tags: tags || [],
            parentId: parentId || null,
            icon: icon || null,
        });

        console.log('[DEBUG] attempt to save note:', note);
        const createdNote = await note.save();
        console.log('[DEBUG] note saved successfully:', createdNote._id);

        // Trigger Automations
        try {
            console.log('[DEBUG] triggering automations');
            automationService.runAutomations('NOTE_CREATED', createdNote, req.user._id);
        } catch (autoErr) {
            console.error('[DEBUG] Automation trigger failed (non-blocking):', autoErr);
        }

        res.status(201).json(createdNote);
    } catch (error) {
        console.error('[DEBUG] Error creating note (STACK TRACE):', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (note) {
            if (note.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }
            res.json(note);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
    try {
        const { title, content, tags, parentId, icon } = req.body;
        const note = await Note.findById(req.params.id);

        if (note) {
            if (note.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            note.title = title !== undefined ? title : note.title;
            note.content = content !== undefined ? content : note.content;
            note.tags = tags || note.tags;
            // Only update if provided (allow moving notes or changing icons)
            if (parentId !== undefined) note.parentId = parentId;
            if (icon !== undefined) note.icon = icon;

            const updatedNote = await note.save();

            // Trigger Automations
            automationService.runAutomations('NOTE_UPDATED', updatedNote, req.user._id);

            res.json(updatedNote);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        console.log(`[DEBUG] Delete request for note ID: ${req.params.id} by user: ${req.user._id}`);
        const note = await Note.findById(req.params.id);

        if (note) {
            console.log(`[DEBUG] Note found. Owner ID: ${note.user}`);
            if (note.user.toString() !== req.user._id.toString()) {
                console.log(`[DEBUG] Unauthorized delete attempt`);
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            await note.deleteOne();
            console.log(`[DEBUG] Note deleted successfully`);
            res.json({ message: 'Note removed' });
        } else {
            console.log(`[DEBUG] Note not found in DB`);
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('[DEBUG] Error deleting note:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote,
};
