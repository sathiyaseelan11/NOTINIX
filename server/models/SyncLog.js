const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    integration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Integration',
        required: true
    },
    platform: {
        type: String,
        enum: ['notion', 'obsidian'],
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'partial', 'running'],
        default: 'running'
    },
    itemsProcessed: {
        type: Number,
        default: 0
    },
    itemsCreated: {
        type: Number,
        default: 0
    },
    itemsUpdated: {
        type: Number,
        default: 0
    },
    details: {
        type: String // Error message or summary
    },
    durationMs: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SyncLog || mongoose.model('SyncLog', syncLogSchema);
