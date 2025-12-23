const Integration = require('../models/Integration');
const SyncLog = require('../models/SyncLog');
const notionService = require('../services/notionService');

// Get all integrations status
const getStatus = async (req, res) => {
    try {
        const integrations = await Integration.find({ user: req.user._id });
        const lastLogs = await SyncLog.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            integrations,
            logs: lastLogs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Connect Notion (Mock for now as we don't have real OAuth client ID/Secret)
// In real app, this redirects to Notion OAuth
const connectNotion = async (req, res) => {
    const { apiKey } = req.body; // Allow manual API Key entry for specific "Internal Integration"

    if (!apiKey) {
        return res.status(400).json({ message: 'API Key is required for Manual Integration' });
    }

    try {
        const integration = await Integration.findOneAndUpdate(
            { user: req.user._id, platform: 'notion' },
            {
                accessToken: apiKey,
                workspaceName: 'Notion Workspace (Manual)', // We could fetch this via API
                config: { type: 'manual_token' }
            },
            { upsert: true, new: true }
        );

        res.json(integration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Trigger Sync
const triggerSync = async (req, res) => {
    const { platform } = req.params;

    try {
        if (platform === 'notion') {
            // Run in background? Node is single threaded, but we can just await it for this demo
            const log = await notionService.syncNotion(req.user._id);
            res.json(log);
        } else {
            res.status(400).json({ message: 'Unsupported platform' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStatus,
    connectNotion,
    triggerSync
};
