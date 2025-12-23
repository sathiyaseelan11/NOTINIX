const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: ['notion', 'obsidian'],
        required: true
    },
    accessToken: {
        type: String,
        required: false // Obsidian might not need one, Notion does
    },
    workspaceName: {
        type: String
    },
    workspaceIcon: {
        type: String
    },
    lastSyncedAt: {
        type: Date
    },
    config: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Ensure one integration per platform per user
integrationSchema.index({ user: 1, platform: 1 }, { unique: true });

module.exports = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
