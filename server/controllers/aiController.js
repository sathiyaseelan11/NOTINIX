const Note = require('../models/noteModel');
const Task = require('../models/taskModel');
const openaiService = require('../services/openaiService');



// @desc    Extract tasks from a note using AI
// @route   POST /api/ai/extract-tasks
// @access  Private
async function extractTasksFromNote(req, res) {
    try {
        const { noteId } = req.body;
        const note = await Note.findById(noteId);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const extractedTasks = await openaiService.extractTasks(note.content);

        const createdTasks = [];
        for (const taskData of extractedTasks) {
            const task = await Task.create({
                user: req.user._id,
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || 'medium',
                sourceNoteId: noteId,
                aiGenerated: true,
            });
            createdTasks.push(task);
        }

        res.status(201).json({
            message: `Extracted ${createdTasks.length} tasks`,
            tasks: createdTasks,
        });

    } catch (error) {
        console.error('Extract tasks error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function summarizeNote(req, res) {
    try {
        const { noteId, type = 'brief' } = req.body;
        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        const summary = await openaiService.summarizeNote(note.content, type);
        note.metadata = note.metadata || {};
        note.metadata.lastAISummary = summary;
        await note.save();
        res.json({ summary });
    } catch (error) {
        console.error('Summarize note error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function autoTagNote(req, res) {
    try {
        const { noteId } = req.body;
        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        const result = await openaiService.autoTag(note.content);
        const currentTags = note.tags || [];
        const newTags = result.tags.filter(tag => !currentTags.includes(tag));

        res.json({
            suggestedTags: result.tags,
            newTags,
            suggestedPriority: result.priority,
            suggestedCategory: result.category,
        });
    } catch (error) {
        console.error('Auto-tag note error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function applyAutoTags(req, res) {
    try {
        const { noteId, tags, priority } = req.body;
        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        const currentTags = note.tags || [];
        const uniqueTags = [...new Set([...currentTags, ...tags])];
        note.tags = uniqueTags;
        if (priority) note.priority = priority;
        await note.save();
        res.json({ message: 'Tags applied successfully', note });
    } catch (error) {
        console.error('Apply auto-tags error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function findRelatedNotes(req, res) {
    try {
        const { noteId, limit = 5 } = req.body;
        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        const allNotes = await Note.find({
            user: req.user._id,
            _id: { $ne: noteId }
        }).select('_id title content tags');

        const scoredNotes = allNotes.map(otherNote => {
            let score = 0;
            const commonTags = (note.tags || []).filter(tag => (otherNote.tags || []).includes(tag));
            score += commonTags.length * 10;
            const keywords = note.title.toLowerCase().split(' ').filter(w => w.length > 3);
            keywords.forEach(keyword => {
                if (otherNote.title.toLowerCase().includes(keyword) || otherNote.content.toLowerCase().includes(keyword)) {
                    score += 5;
                }
            });
            return { noteId: otherNote._id, title: otherNote.title, score, commonTags };
        });

        const related = scoredNotes.filter(n => n.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
        res.json({ relatedNotes: related });
    } catch (error) {
        console.error('Find related notes error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function getDailySummary(req, res) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recentNotes = await Note.find({ user: req.user._id, createdAt: { $gte: today } }).select('title').limit(10);
        const recentTasks = await Task.find({ user: req.user._id, $or: [{ createdAt: { $gte: today } }, { updatedAt: { $gte: today } }] }).select('title status').limit(10);
        const summary = await openaiService.generateDailySummary(recentNotes, recentTasks);
        res.json({ summary, stats: { notesCreated: recentNotes.length, tasksActivity: recentTasks.length } });
    } catch (error) {
        console.error('Daily summary error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function chatWithKnowledge(req, res) {
    try {
        const { query, noteIds } = req.body;
        let relevantNotes = [];
        if (noteIds && noteIds.length > 0) {
            relevantNotes = await Note.find({ user: req.user._id, _id: { $in: noteIds } }).select('title content');
        } else {
            const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
            relevantNotes = await Note.find({
                user: req.user._id,
                $or: [
                    { title: { $regex: keywords.join('|'), $options: 'i' } },
                    { content: { $regex: keywords.join('|'), $options: 'i' } },
                    { tags: { $in: keywords } }
                ]
            }).select('title content').limit(5);
        }

        if (relevantNotes.length === 0) {
            return res.json({ answer: "I couldn't find any relevant notes to answer your question.", sources: [] });
        }

        const answer = await openaiService.chatWithKnowledge(query, relevantNotes, !!noteIds);
        res.json({ answer, sources: relevantNotes.map(n => ({ id: n._id, title: n.title })) });
    } catch (error) {
        console.error('Chat with knowledge error:', error);
        res.status(500).json({ message: error.message });
    }
}

async function searchNotesAI(req, res) {
    return chatWithKnowledge(req, res);
}

async function editNoteText(req, res) {
    try {
        const { text, instruction } = req.body;
        if (!text || !instruction) return res.status(400).json({ message: 'Text and instruction are required' });
        const editedText = await openaiService.editText(text, instruction);
        res.json({ editedText });
    } catch (error) {
        console.error('Edit text error:', error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    extractTasksFromNote,
    summarizeNote,
    autoTagNote,
    applyAutoTags,
    findRelatedNotes,
    getDailySummary,
    chatWithKnowledge,
    searchNotesAI,
    editNoteText
};
