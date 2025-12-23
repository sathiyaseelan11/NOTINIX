const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    triggerType: {
        type: String,
        enum: ['NOTE_CREATED', 'NOTE_UPDATED', 'TASK_COMPLETED', 'DAILY_DIGEST'],
        required: true
    },
    conditions: [{
        field: String, // e.g., 'tags', 'title'
        operator: String, // 'contains', 'equals'
        value: String
    }],
    actions: [{
        type: {
            type: String,
            enum: ['AI_SUMMARIZE', 'AI_AUTOTAG', 'CREATE_TASK', 'SEND_EMAIL'],
            required: true
        },
        config: Map // Flexible config for action
    }],
    active: {
        type: Boolean,
        default: true
    },
    lastRunAt: Date,
    runCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Automation || mongoose.model('Automation', automationSchema);
