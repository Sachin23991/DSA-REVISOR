import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addTask, toggleTask, deleteTask, subscribeToTasks } from '../lib/db';
import { Plus, CheckCircle2, Circle, Calendar as CalendarIcon, Trash2, Edit2, X, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDialog, useConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_CONFIG = {
    low: { label: 'Low', dot: 'bg-[#71717A]' },
    medium: { label: 'Medium', dot: 'bg-black dark:bg-white' },
    high: { label: 'High', dot: 'bg-black dark:bg-white' },
};

export default function Planner() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editText, setEditText] = useState('');
    const [filter, setFilter] = useState('all');
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
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-medium">Daily <span className="font-bold">Planner</span></h1>
                    <p className="text-[#71717A] font-light">Organize your study tasks</p>
                </div>
                <div className="flex items-center gap-2 text-[#71717A] font-light">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(), 'EEEE, MMM d')}
                </div>
            </div>

            {/* Progress Bar */}
            {tasks.length > 0 && (
                <motion.div 
                    className="card p-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Today's Progress</span>
                        <span className="text-sm text-[#71717A] font-light">{completedCount}/{tasks.length} completed</span>
                    </div>
                    <div className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-black dark:bg-white rounded-full"
                        />
                    </div>
                </motion.div>
            )}

            {/* Add Task */}
            <form onSubmit={handleAdd} className="card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        maxLength={200}
                        className="input-field flex-1"
                    />
                    <div className="flex gap-2">
                        {/* Priority Selector */}
                        <div className="flex bg-black/5 dark:bg-white/5 rounded p-1">
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setNewPriority(key)}
                                    className={`px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                                        newPriority === key 
                                            ? 'bg-black text-white dark:bg-white dark:text-black' 
                                            : 'text-[#71717A] hover:text-black dark:hover:text-white'
                                    }`}
                                    title={`${config.label} Priority`}
                                >
                                    <Flag className="w-3 h-3" />
                                    {config.label}
                                </button>
                            ))}
                        </div>
                        <motion.button
                            type="submit"
                            disabled={loading || !newTask.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary px-6 py-3 rounded flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-5 h-5" />
                            Add
                        </motion.button>
                    </div>
                </div>
                <p className="text-xs text-[#71717A] mt-2 font-light">{newTask.length}/200 characters</p>
            </form>

            {/* Filter Tabs */}
            <div className="flex bg-black/5 dark:bg-white/5 rounded p-1 w-fit">
                {['all', 'pending', 'completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                            filter === f
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'text-[#71717A] hover:text-black dark:hover:text-white'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className="ml-1 opacity-70">
                            {f === 'all' && `(${tasks.length})`}
                            {f === 'pending' && `(${tasks.filter(t => !t.completed).length})`}
                            {f === 'completed' && `(${completedCount})`}
                        </span>
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {sortedTasks.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card p-12 text-center"
                        >
                            <CalendarIcon className="w-12 h-12 text-[#71717A]/30 mx-auto mb-4" />
                            <p className="text-[#71717A] font-light">
                                {filter === 'all' ? 'No tasks yet. Start planning your day!' : `No ${filter} tasks.`}
                            </p>
                        </motion.div>
                    ) : (
                        sortedTasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                                className={`card p-4 flex items-center gap-4 transition-all group ${
                                    task.completed ? 'opacity-60' : ''
                                }`}
                            >
                                {/* Priority Indicator */}
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    task.priority === 'high' 
                                        ? 'bg-black dark:bg-white ring-2 ring-black/20 dark:ring-white/20' 
                                        : task.priority === 'low' 
                                            ? 'bg-[#71717A]' 
                                            : 'bg-black dark:bg-white'
                                }`} />

                                {/* Checkbox */}
                                <button
                                    onClick={() => handleToggle(task.id, task.completed)}
                                    className="focus:outline-none flex-shrink-0"
                                >
                                    {task.completed ? (
                                        <CheckCircle2 className="w-6 h-6 text-black dark:text-white" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-[#71717A] hover:text-black dark:hover:text-white transition-colors" />
                                    )}
                                </button>

                                {/* Task Text or Edit Input */}
                                {editingTask === task.id ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="input-field flex-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(task.id);
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(task.id)}
                                            className="p-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 text-[#71717A] hover:bg-black/5 dark:hover:bg-white/5 rounded"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`flex-1 ${
                                            task.completed 
                                                ? 'text-[#71717A] line-through' 
                                                : ''
                                        }`}>
                                            {task.text}
                                        </span>

                                        {/* Priority Badge */}
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                            task.priority === 'high' 
                                                ? 'border-black dark:border-white bg-black/5 dark:bg-white/5' 
                                                : task.priority === 'low'
                                                    ? 'border-black/10 dark:border-white/10 text-[#71717A]'
                                                    : 'border-black/10 dark:border-white/10'
                                        }`}>
                                            {PRIORITY_CONFIG[task.priority]?.label || 'Medium'}
                                        </span>

                                        {/* Action Buttons */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className="p-2 text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id, task.text)}
                                                className="p-2 text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
