import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { format, isToday, isPast, isFuture } from 'date-fns';
import LoadingScreen from '../components/LoadingScreen';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all'); // all, today, upcoming, overdue
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
    });

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = filter !== 'all' ? { filter } : {};
            const response = await tasksAPI.getTasks(params);
            setTasks(response.data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Unable to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await tasksAPI.createTask(newTask);
            setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
            setShowCreateModal(false);
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            alert(`Failed to create task: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleToggleTask = async (taskId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'done' ? 'todo' : 'done';
            await tasksAPI.updateTask(taskId, { status: newStatus });
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            const response = await tasksAPI.deleteTask(taskId);
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    const getTaskStats = () => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const pending = total - completed;
        const overdue = tasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate))).length;

        return { total, completed, pending, overdue };
    };

    const stats = getTaskStats();

    if (loading) return <LoadingScreen />;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-[var(--foreground)] mb-2">
                    Tasks
                </h1>
                <p className="text-[var(--muted-foreground)]">
                    Manage your tasks and to-dos
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<CheckSquare className="w-5 h-5" />}
                    label="Total"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Pending"
                    value={stats.pending}
                    color="yellow"
                />
                <StatCard
                    icon={<CheckSquare className="w-5 h-5" />}
                    label="Completed"
                    value={stats.completed}
                    color="green"
                />
                <StatCard
                    icon={<AlertCircle className="w-5 h-5" />}
                    label="Overdue"
                    value={stats.overdue}
                    color="red"
                />
            </div>

            {/* Filters & Create Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                    <FilterButton
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                        label="All"
                    />
                    <FilterButton
                        active={filter === 'today'}
                        onClick={() => setFilter('today')}
                        label="Today"
                    />
                    <FilterButton
                        active={filter === 'upcoming'}
                        onClick={() => setFilter('upcoming')}
                        label="Upcoming"
                    />
                    <FilterButton
                        active={filter === 'overdue'}
                        onClick={() => setFilter('overdue')}
                        label="Overdue"
                    />
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            {/* Tasks List */}
            {error ? (
                <div className="text-center py-20 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl text-[var(--foreground)] mb-2">{error}</h2>
                    <button onClick={fetchTasks} className="btn bg-red-500 text-white mt-4">Retry</button>
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20">
                    <CheckSquare className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                    <h2 className="text-xl text-[var(--foreground)] mb-2">No tasks {filter !== 'all' ? `for ${filter}` : ''}</h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        Create a task to get started
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn"
                    >
                        Create Task
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <TaskItem
                            key={task._id}
                            task={task}
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                        />
                    ))}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-heading font-semibold text-[var(--foreground)] mb-4">
                            Create New Task
                        </h2>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="input-field"
                                    placeholder="What needs to be done?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="input-field resize-none"
                                    rows="3"
                                    placeholder="Additional details..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(priority => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setNewTask({ ...newTask, priority })}
                                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${newTask.priority === priority
                                                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--secondary-hover)]'
                                                }`}
                                        >
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn">
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskItem = ({ task, onToggle, onDelete }) => {
    const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate));

    return (
        <div className={`bg-[var(--card)] border ${isOverdue ? 'border-red-500/30' : 'border-[var(--card-border)]'} rounded-lg p-4 hover:border-[var(--primary)] transition-colors group`}>
            <div className="flex items-start gap-4">
                <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => onToggle(task._id, task.status)}
                    className="mt-1 w-5 h-5 rounded border-[var(--border)] bg-[var(--background)] checked:bg-[var(--primary)] cursor-pointer"
                />

                <div className="flex-1">
                    <h3 className={`text-[var(--foreground)] font-medium mb-1 ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-[var(--muted-foreground)] text-sm mb-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Priority Badge */}
                        <span className={`text-xs px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {task.priority}
                        </span>

                        {/* Due Date */}
                        {task.dueDate && (
                            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.dueDate), 'MMM d, h:mm a')}
                            </div>
                        )}

                        {/* Project */}
                        {task.projectId && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                                {task.projectId.name}
                            </span>
                        )}

                        {/* AI Generated Badge */}
                        {task.aiGenerated && (
                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                AI
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => onDelete(task._id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-all"
                    title="Delete Task"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'text-blue-400 bg-blue-500/10',
        green: 'text-green-400 bg-green-500/10',
        yellow: 'text-yellow-400 bg-yellow-500/10',
        red: 'text-red-400 bg-red-500/10',
    };

    return (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-4">
            <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
                {icon}
            </div>
            <div>
                <p className="text-[var(--muted-foreground)] text-xs mb-1">{label}</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${active
            ? 'bg-[var(--primary)] text-white'
            : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] border border-[var(--border)]'
            }`}
    >
        {label}
    </button>
);

export default Tasks;
