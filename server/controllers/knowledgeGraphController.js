const Note = require('../models/noteModel');

// @desc    Get knowledge graph data
// @route   GET /api/graph
// @access  Private
const getKnowledgeGraph = async (req, res) => {
    try {
        console.log(`[DEBUG] getKnowledgeGraph for user: ${req.user?._id}`);
        const notes = await Note.find({ user: req.user._id })
            .select('_id title tags icon parentId semanticLinks content');

        console.log(`[DEBUG] Found ${notes.length} notes for graph`);

        // Build nodes
        const nodes = notes.map(note => ({
            id: note._id.toString(),
            title: note.title,
            icon: note.icon,
            tags: note.tags,
        }));

        // Build edges (links)
        const edges = [];

        // Add parent-child relationships
        notes.forEach(note => {
            if (note.parentId) {
                edges.push({
                    source: note.parentId.toString(),
                    target: note._id.toString(),
                    type: 'hierarchy',
                    strength: 1.0,
                });
            }
        });

        // Add semantic links
        notes.forEach(note => {
            if (note.semanticLinks && note.semanticLinks.length > 0) {
                note.semanticLinks.forEach(link => {
                    edges.push({
                        source: note._id.toString(),
                        target: link.noteId.toString(),
                        type: link.aiGenerated ? 'semantic-ai' : 'semantic',
                        strength: link.strength,
                    });
                });
            }
        });

        // Extract backlinks from content (simple implementation)
        const backlinkPattern = /\[\[([^\]]+)\]\]/g;
        for (const note of notes) {
            if (!note.content) continue; // Safety check

            const matches = note.content.matchAll(backlinkPattern);
            for (const match of matches) {
                const linkedTitle = match[1];
                const linkedNote = notes.find(n => n.title === linkedTitle);

                if (linkedNote) {
                    edges.push({
                        source: note._id.toString(),
                        target: linkedNote._id.toString(),
                        type: 'backlink',
                        strength: 0.8,
                    });
                }
            }
        }

        res.json({ nodes, edges });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get connections for a specific note
// @route   GET /api/graph/node/:noteId
// @access  Private
const getNodeConnections = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId)
            .populate('semanticLinks.noteId', 'title icon');

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find notes that link to this note
        const incomingLinks = await Note.find({
            user: req.user._id,
            'semanticLinks.noteId': note._id,
        }).select('title icon');

        // Find child notes
        const children = await Note.find({
            user: req.user._id,
            parentId: note._id,
        }).select('title icon');

        // Find parent note
        let parent = null;
        if (note.parentId) {
            parent = await Note.findById(note.parentId).select('title icon');
        }

        res.json({
            outgoingLinks: note.semanticLinks || [],
            incomingLinks,
            children,
            parent,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate semantic links using AI
// @route   POST /api/graph/semantic-links
// @access  Private
const generateSemanticLinks = async (req, res) => {
    try {
        const { noteId } = req.body;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get all user notes for comparison
        const allNotes = await Note.find({
            user: req.user._id,
            _id: { $ne: noteId },
        }).select('_id title content tags');

        // AI-based semantic similarity (placeholder for now)
        const suggestedLinks = await findSemanticallySimilarNotes(note, allNotes);

        // Add to note
        suggestedLinks.forEach(link => {
            const existingLink = note.semanticLinks.find(
                l => l.noteId.toString() === link.noteId.toString()
            );

            if (!existingLink) {
                note.semanticLinks.push({
                    noteId: link.noteId,
                    strength: link.strength,
                    aiGenerated: true,
                });
            }
        });

        await note.save();

        res.json({ suggestedLinks: suggestedLinks.length, note });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get AI-generated topic clusters
// @route   GET /api/graph/clusters
// @access  Private
const getTopicClusters = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user._id })
            .select('_id title tags content');

        // Simple tag-based clustering (will be replaced with AI clustering)
        const tagMap = {};

        notes.forEach(note => {
            note.tags.forEach(tag => {
                if (!tagMap[tag]) {
                    tagMap[tag] = [];
                }
                tagMap[tag].push({
                    id: note._id,
                    title: note.title,
                });
            });
        });

        const clusters = Object.entries(tagMap).map(([tag, noteList]) => ({
            name: tag,
            count: noteList.length,
            notes: noteList,
        }));

        res.json(clusters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function (will be enhanced with AI)
async function findSemanticallySimilarNotes(sourceNote, candidateNotes) {
    // Placeholder: simple tag overlap
    const suggestedLinks = [];

    candidateNotes.forEach(candidate => {
        const commonTags = sourceNote.tags.filter(tag => candidate.tags.includes(tag));

        if (commonTags.length > 0) {
            suggestedLinks.push({
                noteId: candidate._id,
                strength: Math.min(commonTags.length * 0.3, 0.9),
            });
        }
    });

    return suggestedLinks.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

module.exports = {
    getKnowledgeGraph,
    getNodeConnections,
    generateSemanticLinks,
    getTopicClusters,
};
