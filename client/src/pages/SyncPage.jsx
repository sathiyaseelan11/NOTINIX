import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Clock, Database, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';

const SyncPage = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState({ integrations: [], logs: [] });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        const startTime = Date.now();
        try {
            const { data } = await api.get('/sync/status');
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch sync status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectNotion = async () => {
        if (!apiKeyInput.trim()) return alert('Please enter an Integration Token');
        try {
            await api.post('/sync/notion/connect', { apiKey: apiKeyInput });
            setApiKeyInput('');
            fetchStatus();
            alert('Notion Connected!');
        } catch (error) {
            alert('Failed to connect: ' + error.response?.data?.message || error.message);
        }
    };

    const handleTriggerSync = async (platform) => {
        setSyncing(true);
        try {
            await api.post(`/sync/${platform}/trigger`);
            // Poll for update or just wait a bit and refresh
            setTimeout(fetchStatus, 2000);
            alert('Sync started successfully!');
        } catch (error) {
            alert('Failed to trigger sync: ' + error.response?.data?.message || error.message);
        } finally {
            setSyncing(false);
        }
    };

    const notionIntegration = status.integrations.find(i => i.platform === 'notion');

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
            <div className="max-w-5xl mx-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
                        <RefreshCw className={`w-8 h-8 ${syncing ? 'animate-spin' : ''}`} />
                        Sync & Integations
                    </h1>
                    <p className="text-gray-400 mt-2">Connect your external knowledge bases to unify your second brain.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Notion Card */}
                    <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-black text-xl font-bold">N</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Notion</h3>
                                    <div className="flex items-center gap-2 text-sm">
                                        {notionIntegration ? (
                                            <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Connected</span>
                                        ) : (
                                            <span className="text-gray-500">Not connected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {notionIntegration && (
                                <button
                                    onClick={() => handleTriggerSync('notion')}
                                    disabled={syncing}
                                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                                >
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            )}
                        </div>

                        {!notionIntegration ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-400">Enter your internal integration token to connect.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="secret_..."
                                        className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                    />
                                    <button
                                        onClick={handleConnectNotion}
                                        className="px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border-subtle)] text-white text-sm font-medium rounded-md transition-colors border border-[var(--border-subtle)]"
                                    >
                                        Connect
                                    </button>
                                </div>
                                <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                    Get Token <ExternalLink size={10} />
                                </a>
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-hover)] rounded-lg p-3 text-sm text-gray-300">
                                <p className="flex items-center gap-2 mb-1">
                                    <Database size={14} className="text-gray-500" />
                                    Workspace: <span className="text-white font-medium">{notionIntegration.workspaceName}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-500" />
                                    Last Synced: <span className="text-white">{notionIntegration.lastSyncedAt ? new Date(notionIntegration.lastSyncedAt).toLocaleString() : 'Never'}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Obsidian Card (Placeholder) */}
                    <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-75">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#7A3EE8] rounded-md flex items-center justify-center text-white text-xl font-bold">O</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Obsidian</h3>
                                    <span className="text-gray-500 text-sm">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Local vault sync requires a desktop companion app.
                            For now, use the <b>Import</b> feature in the notes list.
                        </p>
                    </div>
                </div>

                {/* Sync Logs */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-subtle)]">
                        <h2 className="text-lg font-bold text-white">Sync Activity</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--bg-hover)] text-gray-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Platform</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Items</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] text-gray-300">
                                {status.logs.length > 0 ? (
                                    status.logs.map(log => (
                                        <tr key={log._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                            <td className="px-4 py-3 capitalize">{log.platform}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                                    log.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {log.status === 'success' && <CheckCircle size={10} />}
                                                    {log.status === 'failed' && <AlertTriangle size={10} />}
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.itemsProcessed} processed <span className="text-gray-600">({log.itemsCreated} new)</span>
                                            </td>
                                            <td className="px-4 py-3">{log.durationMs}ms</td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            No sync activity recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncPage;
