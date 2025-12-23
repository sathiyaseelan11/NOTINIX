const Automation = require('../models/Automation');
const openaiService = require('./openaiService');
const Note = require('../models/noteModel'); // Need Note model to update it

// The Engine
const runAutomations = async (triggerType, data, userId) => {
    try {
        console.log(`Checking automations for ${triggerType} user:${userId}`);

        // Find active rules for this user & trigger
        const rules = await Automation.find({
            user: userId,
            triggerType: triggerType,
            active: true
        });

        if (rules.length === 0) return;

        console.log(`Found ${rules.length} rules to execute.`);

        for (const rule of rules) {
            // Check Conditions (Simple implementation)
            if (rule.conditions && rule.conditions.length > 0) {
                // TODO: Implement condition evaluator matching data
                // For now, assume pass if rule exists
            }

            // Execute Actions
            for (const action of rule.actions) {
                console.log(`Executing Action: ${action.type} for rule [${rule.name}]`);
                await executeAction(action, data, userId);
            }

            // Update Stats
            rule.lastRunAt = new Date();
            rule.runCount += 1;
            await rule.save();
        }

    } catch (error) {
        console.error('Automation Engine Error:', error);
    }
};

const executeAction = async (action, data, userId) => {
    switch (action.type) {
        case 'AI_SUMMARIZE':
            if (data._id) {
                console.log(`[Action] Summarizing Note ${data._id}`);
                try {
                    // Fetch full note to get content if needed, though 'data' might be the note document
                    // Safer to fetch fresh
                    const note = await Note.findById(data._id);
                    if (note) {
                        const summary = await openaiService.summarizeNote(note.content, 'brief');
                        note.metadata = note.metadata || {};
                        note.metadata.lastAISummary = summary;
                        await note.save();
                        console.log(`[Action] Summary saved for note ${note._id}`);
                    }
                } catch (err) {
                    console.error('AI_SUMMARIZE Action Failed:', err);
                }
            }
            break;
        case 'AI_AUTOTAG':
            console.log(`[Action] Auto-tagging Note ${data._id}`);
            break;
        case 'CREATE_TASK':
            console.log(`[Action] Creating Task from ${data.title}`);
            break;
        default:
            console.warn('Unknown action type', action.type);
    }
};

module.exports = {
    runAutomations
};
