import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingScreen from '../components/LoadingScreen'; // Added import
import { Zap, Plus, Trash2, ToggleRight, ToggleLeft, ArrowRight, Play } from 'lucide-react';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Reuse Auth logic
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const AutomationsPage = () => {
    const [automations, setAutomations] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);

    const [newRule, setNewRule] = useState({
        name: '',
        triggerType: 'NOTE_CREATED',
        actions: [{ type: 'AI_SUMMARIZE', config: {} }]
    });

    useEffect(() => {
        fetchAutomations();
    }, []);

    const fetchAutomations = async () => {
        const startTime = Date.now();
        try {
            const { data } = await api.get('/automations');
            setAutomations(data);
        } catch (error) {
            console.error('Failed to fetch automations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newRule.name) return alert('Name is required');
        try {
            await api.post('/automations', newRule);
            setShowCreate(false);
            setNewRule({ name: '', triggerType: 'NOTE_CREATED', actions: [{ type: 'AI_SUMMARIZE', config: {} }] });
            fetchAutomations();
        } catch (error) {
            alert('Error creating automation: ' + error.message);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await api.put(`/automations/${id}/toggle`);
            fetchAutomations(); // Refresh list deeply to ensure sync
        } catch (error) {
            console.error(error);
        }
    };

    const deleteRule = async (id) => {
        if (!window.confirm('Delete this automation?')) return;
        try {
            const response = await api.delete(`/automations/${id}`);
            setAutomations(automations.filter(a => a._id !== id));
        } catch (error) {
            console.error('Error deleting automation:', error);
            alert('Failed to delete automation');
        }
    };

    if (loading) return <LoadingScreen />; // Added LoadingScreen usage

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--background)]">
            <div className="max-w-4xl mx-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-[var(--foreground)] flex items-center gap-3">
                            <Zap className="text-yellow-400" />
                            Automations
                        </h1>
                        <p className="text-[var(--muted-foreground)] mt-2">Build workflows to put your second brain on autopilot.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} /> New Workflow
                    </button>
                </header>

                {showCreate && (
                    <div className="mb-8 p-6 bg-[var(--card)] border border-[var(--card-border)] rounded-xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Create New Workflow</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)]"
                                    placeholder="e.g. Auto-summarize new notes"
                                    value={newRule.name}
                                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                {/* Trigger */}
                                <div>
                                    <label className="block text-sm text-[var(--muted-foreground)] mb-1">When...</label>
                                    <select
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)]"
                                        value={newRule.triggerType}
                                        onChange={e => setNewRule({ ...newRule, triggerType: e.target.value })}
                                    >
                                        <option value="NOTE_CREATED">Note Created</option>
                                        <option value="NOTE_UPDATED">Note Updated</option>
                                        <option value="TASK_COMPLETED">Task Completed</option>
                                    </select>
                                </div>

                                <div className="flex justify-center text-[var(--muted-foreground)]">
                                    <ArrowRight />
                                </div>

                                {/* Action */}
                                <div>
                                    <label className="block text-sm text-[var(--muted-foreground)] mb-1">Then...</label>
                                    <select
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)]"
                                        value={newRule.actions[0].type}
                                        onChange={e => {
                                            const actions = [...newRule.actions];
                                            actions[0].type = e.target.value;
                                            setNewRule({ ...newRule, actions });
                                        }}
                                    >
                                        <option value="AI_SUMMARIZE">AI Summarize</option>
                                        <option value="AI_AUTOTAG">AI Auto-tag</option>
                                        <option value="CREATE_TASK">Create Task</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
                                <button onClick={handleCreate} className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-md">Create Rule</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {automations.map(auto => (
                        <div key={auto._id} className={`p-4 rounded-xl border transition-colors ${auto.active ? 'bg-[var(--card)] border-[var(--card-border)]' : 'bg-[var(--secondary)]/30 border-transparent opacity-60'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${auto.active ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'}`}>
                                        <Play size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--foreground)]">{auto.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-1">
                                            <span className="bg-[var(--secondary)] px-2 py-0.5 rounded text-xs uppercase">{auto.triggerType.replace('_', ' ')}</span>
                                            <ArrowRight size={12} />
                                            <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-xs uppercase">{auto.actions[0]?.type.replace('_', ' ')}</span>

                                            {auto.runCount > 0 && (
                                                <span className="ml-4 text-xs text-gray-500">Run {auto.runCount} times</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleStatus(auto._id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                                        {auto.active ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} />}
                                    </button>
                                    <button onClick={() => deleteRule(auto._id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {automations.length === 0 && !loading && (
                        <div className="text-center py-12 text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-dashed border-[var(--card-border)]">
                            <Zap size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No automations yet. Create a workflow to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutomationsPage;
