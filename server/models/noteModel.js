const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        enum: ['manual', 'notion', 'obsidian', 'upload'],
        default: 'manual',
    },
    tags: [{
        type: String,
    }],
    externalId: {
        type: String, // For Notion ID or filename
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        default: null,
    },
    icon: {
        type: String, // Emoji or URL
        default: null,
    },
    coverImage: {
        type: String, // URL
        default: null,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'active',
    },
    complexity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
    },
    semanticLinks: [{
        noteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Note',
        },
        strength: {
            type: Number,
            default: 0.5,
        },
        aiGenerated: {
            type: Boolean,
            default: false,
        },
    }],
    metadata: {
        readTime: Number,
        wordCount: Number,
        lastAISummary: String,
    },
}, {
    timestamps: true,
});

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);

module.exports = Note;
