import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addTask, toggleTask, deleteTask, subscribeToTasks } from '../lib/db';
import { Plus, CheckCircle2, Circle, Calendar as CalendarIcon, Trash2, Edit2, X, Flag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDialog, useConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from '../components/ui/Toast';

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-400' },
    medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
    high: { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
};

export default function Planner() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editText, setEditText] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, completed
    const { dialogProps, confirm } = useConfirmDialog();

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToTasks(user.uid, '', (data) => {
            setTasks(data);
        });
        return () => unsub();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setLoading(true);
        try {
            await addTask(user.uid, {
                text: newTask.trim(),
                completed: false,
                type: 'general',
                priority: newPriority,
                date: new Date().toISOString()
            });
            setNewTask('');
            setNewPriority('medium');
            toast.success('Task added successfully!');
        } catch (error) {
            toast.error('Failed to add task');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, status) => {
        try {
            await toggleTask(id, status);
            if (!status) {
                toast.success('Task completed! 🎉');
            }
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDelete = async (taskId, taskText) => {
        const confirmed = await confirm({
            title: 'Delete Task',
            message: `Are you sure you want to delete "${taskText}"? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true
        });

        if (confirmed) {
            try {
                await deleteTask(taskId);
                toast.success('Task deleted');
            } catch (error) {
                toast.error('Failed to delete task');
            }
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task.id);
        setEditText(task.text);
    };

    const handleSaveEdit = async (taskId) => {
        if (!editText.trim()) {
            toast.warning('Task cannot be empty');
            return;
        }
        try {
            // Use the db update function - we'll add this
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await updateDoc(doc(db, "tasks", taskId), { text: editText.trim() });
            toast.success('Task updated');
            setEditingTask(null);
            setEditText('');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleCancelEdit = () => {
        setEditingTask(null);
        setEditText('');
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    // Sort by priority then by creation date
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] ?? 1;
        const bPriority = priorityOrder[b.priority] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Daily Planner</h1>
                    <p className="text-slate-500 dark:text-slate-400">Organize your study tasks</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(), 'EEEE, MMM d')}
                </div>
            </div>

            {/* Progress Bar */}
            {tasks.length > 0 && (
                <div className="card p-4 dark:bg-dark-surface dark:border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Today's Progress</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{completedCount}/{tasks.length} completed</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-royal-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Add Task */}
            <form onSubmit={handleAdd} className="card p-4 dark:bg-dark-surface dark:border-dark-border">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        maxLength={200}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500"
                    />
                    <div className="flex gap-2">
                        {/* Priority Selector */}
                        <div className="flex bg-slate-100 dark:bg-dark-bg rounded-xl p-1">
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setNewPriority(key)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                        newPriority === key 
                                            ? config.color 
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                    title={`${config.label} Priority`}
                                >
                                    <Flag className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newTask.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-royal-500 to-royal-600 text-white rounded-xl font-medium shadow-lg shadow-royal-500/30 hover:shadow-xl hover:shadow-royal-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add
                        </button>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{newTask.length}/200 characters</p>
            </form>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'pending', 'completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filter === f
                                ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-surface'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'all' && ` (${tasks.length})`}
                        {f === 'pending' && ` (${tasks.filter(t => !t.completed).length})`}
                        {f === 'completed' && ` (${completedCount})`}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {sortedTasks.length === 0 ? (
                    <div className="card p-12 text-center dark:bg-dark-surface dark:border-dark-border">
                        <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {filter === 'all' ? 'No tasks yet. Start planning your day!' : `No ${filter} tasks.`}
                        </p>
                    </div>
                ) : (
                    sortedTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`card p-4 flex items-center gap-4 transition-all group dark:bg-dark-surface dark:border-dark-border ${
                                task.completed ? 'opacity-60' : ''
                            }`}
                        >
                            {/* Priority Indicator */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                PRIORITY_CONFIG[task.priority]?.dot || PRIORITY_CONFIG.medium.dot
                            }`} />

                            {/* Checkbox */}
                            <button
                                onClick={() => handleToggle(task.id, task.completed)}
                                className="focus:outline-none flex-shrink-0"
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <Circle className="w-6 h-6 text-slate-300 hover:text-royal-500 transition-colors" />
                                )}
                            </button>

                            {/* Task Text or Edit Input */}
                            {editingTask === task.id ? (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(task.id);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                    />
                                    <button
                                        onClick={() => handleSaveEdit(task.id)}
                                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className={`flex-1 ${
                                        task.completed 
                                            ? 'text-slate-400 line-through' 
                                            : 'text-slate-800 dark:text-white'
                                    }`}>
                                        {task.text}
                                    </span>

                                    {/* Priority Badge */}
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                        PRIORITY_CONFIG[task.priority]?.color || PRIORITY_CONFIG.medium.color
                                    }`}>
                                        {PRIORITY_CONFIG[task.priority]?.label || 'Medium'}
                                    </span>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(task)}
                                            className="p-2 text-slate-400 hover:text-royal-500 hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id, task.text)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
