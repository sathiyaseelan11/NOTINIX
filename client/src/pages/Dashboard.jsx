import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckSquare, Sparkles, TrendingUp, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { tasksAPI, aiAPI } from '../services/api';
import { format } from 'date-fns';
import LoadingScreen from '../components/LoadingScreen';

const Dashboard = () => {
    const { user } = useAuth();
    const [recentNotes, setRecentNotes] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [aiSummary, setAiSummary] = useState('');
    const [stats, setStats] = useState({
        totalNotes: 0,
        totalTasks: 0,
        completedToday: 0,
        focusScore: 85,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const startTime = Date.now();
        setLoading(true);
        try {
            // Fetch everything in parallel to be fast and resilient
            const [notesRes, todayTasksRes, allTasksRes] = await Promise.allSettled([
                api.get('/notes'),
                tasksAPI.getTasks({ filter: 'today' }),
                tasksAPI.getTasks({}),
            ]);

            // Handle Notes
            if (notesRes.status === 'fulfilled') {
                const notes = notesRes.value.data || [];
                setRecentNotes(notes.slice(0, 5));
                setStats(prev => ({ ...prev, totalNotes: notes.length }));
            } else {
                console.error('[Dashboard] Notes Fetch Failed:', notesRes.reason);
            }

            // Handle Today's Tasks
            if (todayTasksRes.status === 'fulfilled') {
                setTodayTasks(todayTasksRes.value.data || []);
            } else {
                console.error('[Dashboard] Today Tasks Fetch Failed:', todayTasksRes.reason);
            }

            // Handle All Tasks & Secondary Stats
            if (allTasksRes.status === 'fulfilled') {
                const allTasks = allTasksRes.value.data || [];
                const completedToday = allTasks.filter(t =>
                    t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
                ).length;

                setStats(prev => ({
                    ...prev,
                    totalTasks: allTasks.length,
                    completedToday,
                    focusScore: Math.min(85 + completedToday * 3, 100),
                }));
            } else {
                console.error('Failed to fetch all tasks:', allTasksRes.reason);
            }

            // AI summary is non-critical, fetch separately
            try {
                const summaryRes = await aiAPI.getDailySummary();
                setAiSummary(summaryRes?.data?.summary || 'AI summary will appear here.');
            } catch (err) {
                setAiSummary('AI insights currently unavailable.');
            }

        } catch (error) {
            console.error('Dashboard root error:', error);
        } finally {
            // Ensure minimum 2.5 second loading time
            const elapsed = Date.now() - startTime;
            const minLoadTime = 2500;
            if (elapsed < minLoadTime) {
                setTimeout(() => setLoading(false), minLoadTime - elapsed);
            } else {
                setLoading(false);
            }
        }
    };

    const handleToggleTask = async (taskId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'done' ? 'todo' : 'done';
            await tasksAPI.updateTask(taskId, { status: newStatus });
            fetchDashboardData();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-[var(--foreground)] mb-2">
                    Welcome to Notinix, {user?.username || 'User'}! 👋
                </h1>
                <p className="text-[var(--muted-foreground)]">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<FileText className="w-6 h-6" />}
                    label="Total Notes"
                    value={stats.totalNotes}
                    color="blue"
                />
                <StatCard
                    icon={<CheckSquare className="w-6 h-6" />}
                    label="Total Tasks"
                    value={stats.totalTasks}
                    color="green"
                />
                <StatCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    label="Completed Today"
                    value={stats.completedToday}
                    color="purple"
                />
                <StatCard
                    icon={<Sparkles className="w-6 h-6" />}
                    label="Focus Score"
                    value={`${stats.focusScore}%`}
                    color="yellow"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Notes */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-heading font-semibold text-[var(--foreground)] flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Recent Notes
                        </h2>
                        <Link to="/notes" className="text-[var(--primary)] hover:opacity-80 text-sm">
                            View all →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentNotes.length > 0 ? (
                            recentNotes.map(note => (
                                <Link
                                    key={note._id}
                                    to={`/notes/${note._id}`}
                                    className="block p-3 bg-[var(--background)] border border-[var(--card-border)] rounded-lg hover:border-[var(--primary)] transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{note.icon || '📄'}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[var(--foreground)] font-medium truncate">
                                                {note.title}
                                            </h3>
                                            <p className="text-[var(--muted-foreground)] text-sm truncate mt-1">
                                                {note.content.substring(0, 80)}...
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No notes yet</p>
                        )}
                    </div>

                    <Link
                        to="/notes"
                        className="mt-4 w-full btn flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Note
                    </Link>
                </div>

                {/* Today's Tasks */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-heading font-semibold text-[var(--foreground)] flex items-center gap-2">
                            <CheckSquare className="w-5 h-5" />
                            Today's Tasks
                        </h2>
                        <Link to="/tasks" className="text-[var(--primary)] hover:opacity-80 text-sm">
                            View all →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {todayTasks.length > 0 ? (
                            todayTasks.map(task => (
                                <div
                                    key={task._id}
                                    className="flex items-start gap-3 p-3 bg-[var(--background)] border border-[var(--card-border)] rounded-lg"
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'done'}
                                        onChange={() => handleToggleTask(task._id, task.status)}
                                        className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--background)] checked:bg-[var(--primary)]"
                                    />
                                    <div className="flex-1">
                                        <h3 className={`text-[var(--foreground)] ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {task.priority && (
                                                <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="text-xs text-gray-500">
                                                    Due: {format(new Date(task.dueDate), 'h:mm a')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No tasks for today</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'text-blue-400 bg-blue-500/10',
        green: 'text-green-400 bg-green-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
        yellow: 'text-yellow-400 bg-yellow-500/10',
    };

    return (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
                {icon}
            </div>
            <div>
                <p className="text-[var(--muted-foreground)] text-sm mb-1">{label}</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
            </div>
        </div>
    );
};

export default Dashboard;
