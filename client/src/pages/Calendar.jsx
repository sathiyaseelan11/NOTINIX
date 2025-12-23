import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { tasksAPI, notesAPI } from '../services/api';
import LoadingScreen from '../components/LoadingScreen';

const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
    });

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, notesRes] = await Promise.allSettled([
                tasksAPI.getTasks({}),
                notesAPI.getNotes()
            ]);

            if (tasksRes.status === 'fulfilled') {
                setTasks(tasksRes.value.data || []);
            } else {
                console.error('Failed to fetch calendar tasks:', tasksRes.reason);
            }

            if (notesRes.status === 'fulfilled') {
                setNotes(notesRes.value.data || []);
            } else {
                console.error('Failed to fetch calendar notes:', notesRes.reason);
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
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
            fetchData();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const openCreateModal = (day) => {
        setNewTask({
            ...newTask,
            dueDate: format(day, "yyyy-MM-dd'T'HH:mm")
        });
        setShowCreateModal(true);
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return (
            <div className="grid grid-cols-7 border-t border-l border-[var(--border)] rounded-xl overflow-hidden shadow-2xl bg-[var(--card)]">
                {calendarDays.map((day, i) => {
                    const dayTasks = tasks.filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day));
                    const dayNotes = notes.filter(note => isSameDay(new Date(note.createdAt), day));
                    const isSelectedMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={i}
                            onClick={() => openCreateModal(day)}
                            className={`min-h-[100px] md:min-h-[120px] p-1 md:p-2 border-r border-b border-[var(--border)] transition-all duration-200 cursor-pointer ${isSelectedMonth ? 'bg-[var(--card)]' : 'bg-[var(--background)] opacity-30'
                                } ${isToday(day) ? 'ring-1 ring-inset ring-[var(--primary)]/50' : ''} hover:bg-[var(--accent)] group`}
                        >
                            <div className="flex justify-between items-start mb-1 md:mb-2">
                                <span className={`text-xs md:text-sm font-medium ${isToday(day)
                                    ? 'bg-[var(--primary)] text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center'
                                    : isSelectedMonth ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                                    }`}>
                                    {format(day, 'd')}
                                </span>
                                <Plus size={12} className="text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] scrollbar-hide">
                                {dayTasks.map(task => (
                                    <div key={task._id} className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 truncate" title={task.title}>
                                        {task.title}
                                    </div>
                                ))}
                                {dayNotes.map(note => (
                                    <div key={note._id} className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate" title={note.title}>
                                        {note.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                        <CalendarIcon size={24} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-heading font-bold text-[var(--foreground)] truncate">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h1>
                        <p className="text-[var(--muted-foreground)] text-[10px] md:text-sm truncate">Organize your time and thoughts</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <div className="flex items-center bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-1 shrink-0">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-[var(--accent)] rounded-md text-[var(--muted-foreground)] transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setCurrentMonth(new Date())} className="px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-[var(--accent)] rounded-md text-[var(--muted-foreground)] transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setNewTask({ ...newTask, dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
                            setShowCreateModal(true);
                        }}
                        className="btn flex items-center gap-2 whitespace-nowrap text-xs md:text-sm px-3 md:px-4 py-2 flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={16} /> <span className="sm:inline">New Event</span>
                    </button>
                </div>
            </div>
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl p-2 md:p-6 border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide">
                    <div className="min-w-[700px] lg:min-w-0">
                        {renderDays()}
                        {renderCells()}
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                        <h2 className="text-lg md:text-xl font-heading font-semibold text-[var(--foreground)] mb-4">
                            Add Task for {format(new Date(newTask.dueDate), 'MMM d, yyyy')}
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
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                    placeholder="What needs to be done?"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] resize-none text-sm"
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
                                            className={`flex-1 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${newTask.priority === priority
                                                ? 'bg-[var(--primary)] text-white'
                                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                                                }`}
                                        >
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)] transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium text-sm">
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

export default Calendar;
