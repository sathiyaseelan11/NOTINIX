const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'assistant', 'system'],
    },
    content: {
        type: String,
        required: true,
    },
    sources: [{
        id: String,
        title: String
    }],
}, {
    timestamps: true,
    _id: false
});

const chatSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        default: 'New Chat',
    },
    messages: [messageSchema],
}, {
    timestamps: true,
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

module.exports = Chat;
