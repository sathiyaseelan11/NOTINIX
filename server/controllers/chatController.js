const Chat = require('../models/chatModel');
const Note = require('../models/noteModel');
const openaiService = require('../services/openaiService');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
    baseURL: 'https://api.groq.com/openai/v1', // Groq API endpoint
    dangerouslyAllowBrowser: true
});

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id }).sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single chat by ID
// @route   GET /api/chats/:id
// @access  Private
const getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (chat) {
            if (chat.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }
            res.json(chat);
        } else {
            res.status(404).json({ message: 'Chat not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new chat (optional, usually handled by sending first message)
// @route   POST /api/chats
// @access  Private
const createChat = async (req, res) => {
    try {
        const chat = new Chat({
            user: req.user._id,
            messages: [{ role: 'system', content: 'You are a helpful AI assistant.' }]
        });
        const createdChat = await chat.save();
        res.status(201).json(createdChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send message to a chat
// @route   POST /api/chats/:id/message
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { message, fileContent, fileName, isKnowledgeMode, noteIds } = req.body;
        const chatId = req.params.id;

        // 1. Find Chat or Create new one if ID is 'new'
        let chat;
        if (chatId === 'new') {
            chat = new Chat({
                user: req.user._id,
                title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                messages: [{ role: 'system', content: 'You are a helpful AI assistant.' }]
            });
        } else {
            chat = await Chat.findById(chatId);
            if (!chat) return res.status(404).json({ message: 'Chat not found' });
            if (chat.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
        }

        // 2. Add User Message
        chat.messages.push({ role: 'user', content: message });

        // 3. Call AI Logic
        let aiResponseContent = "";
        let sources = [];

        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
            aiResponseContent = "[Mock AI] I'm sorry, I cannot connect to OpenAI without a valid API Key.";
        } else {
            try {
                if (isKnowledgeMode) {
                    // --- KNOWLEDGE BASE MODE (Strict RAG) ---
                    let relevantNotes = [];

                    if (noteIds && noteIds.length > 0) {
                        // User specified explicit context
                        relevantNotes = await Note.find({ user: req.user._id, _id: { $in: noteIds } }).select('title content');
                    } else {
                        // Auto-search context using keywords (simple RAG)
                        const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
                        if (keywords.length > 0) {
                            relevantNotes = await Note.find({
                                user: req.user._id,
                                $or: [
                                    { title: { $regex: keywords.join('|'), $options: 'i' } },
                                    { content: { $regex: keywords.join('|'), $options: 'i' } },
                                    { tags: { $in: keywords } }
                                ]
                            }).select('title content').limit(5);
                        }
                    }

                    // Use Shared OpenAI Service for Knowledge Chat
                    aiResponseContent = await openaiService.chatWithKnowledge(message, relevantNotes, !!(noteIds && noteIds.length > 0));
                    sources = relevantNotes.map(n => ({ id: n._id, title: n.title }));

                } else {
                    // --- GENERAL MODE (Context-Aware Chat) ---

                    // A. Fetch Context
                    let contextStr = "";

                    // File Context
                    if (fileContent) {
                        contextStr += `CONTEXT FROM UPLOADED FILE (${fileName || 'document'}):\n${fileContent}\n\n`;
                    }

                    // Recent Notes Context (Loose context)
                    const recentNotes = await Note.find({ user: req.user._id })
                        .sort({ updatedAt: -1 })
                        .limit(3)
                        .select('title content');

                    if (recentNotes.length > 0) {
                        contextStr += "CONTEXT FROM RECENT NOTES:\n";
                        recentNotes.forEach(n => {
                            if (n.content) {
                                contextStr += `- ${n.title}: ${n.content.substring(0, 200)}...\n`;
                            }
                        });
                    }

                    // B. Construct Messages
                    const systemMessage = {
                        role: "system",
                        content: `You are Notinix AI, a powerful second brain assistant. 
                        ${contextStr}
                        Use the provided context to answer the user's questions accurately. If the information is in the uploaded file, prioritize that.
                        Answer specifically and concisely.`
                    };

                    const history = chat.messages
                        .filter(m => m.role !== 'system')
                        .slice(-10)
                        .map(m => ({ role: m.role, content: m.content }));

                    const contextMessages = [systemMessage, ...history];

                    // C. Call OpenAI
                    const completion = await openai.chat.completions.create({
                        messages: contextMessages,
                        model: "llama-3.3-70b-versatile",
                    });
                    aiResponseContent = completion.choices[0].message.content;
                }
            } catch (aiError) {
                console.error("OpenAI Error:", aiError);
                if (aiError.status === 429) {
                    aiResponseContent = "⚠️ **Rate Limit Reached**: The OpenAI API is temporarily rate-limited. Please try again in a few seconds.";
                } else if (aiError.status === 401) {
                    aiResponseContent = "⚠️ **Invalid API Key**: Your OpenAI API Key is incorrect.";
                } else {
                    aiResponseContent = "I encountered an error processing your request: " + (aiError.message || "Unknown Error");
                }
            }
        }

        // 4. Add AI Message with Sources
        chat.messages.push({
            role: 'assistant',
            content: aiResponseContent,
            sources: sources
        });

        await chat.save();
        res.json(chat);

    } catch (error) {
        console.error("SendMessage Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a chat
// @route   DELETE /api/chats/:id
// @access  Private
const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (chat) {
            if (chat.user.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }
            await chat.deleteOne();
            res.json({ message: 'Chat removed' });
        } else {
            res.status(404).json({ message: 'Chat not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChats,
    getChatById,
    createChat,
    sendMessage,
    deleteChat
};
