const Automation = require('../models/Automation');

// Get My Automations
const getAutomations = async (req, res) => {
    try {
        const automations = await Automation.find({ user: req.user._id });
        res.json(automations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Automation
const createAutomation = async (req, res) => {
    try {
        const { name, triggerType, actions, conditions } = req.body;
        const automation = await Automation.create({
            user: req.user._id,
            name,
            triggerType,
            actions,
            conditions
        });
        res.status(201).json(automation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Toggle Active Status
const toggleAutomation = async (req, res) => {
    try {
        const automation = await Automation.findOne({ _id: req.params.id, user: req.user._id });
        if (!automation) return res.status(404).json({ message: 'Not found' });

        automation.active = !automation.active;
        await automation.save();
        res.json(automation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete
const deleteAutomation = async (req, res) => {
    try {
        await Automation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAutomations,
    createAutomation,
    toggleAutomation,
    deleteAutomation
};
