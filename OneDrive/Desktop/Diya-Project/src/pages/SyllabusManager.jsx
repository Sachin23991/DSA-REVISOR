import { useState, useRef, useEffect, useMemo } from 'react';
import { SYLLABUS_DATA } from '../lib/syllabus-data';
import { ChevronRight, ChevronDown, CheckCircle2, Circle, BookOpen, Plus, Trash2, RotateCcw, X, Search, CheckSquare, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProgress } from '../lib/db';
import { ConfirmDialog, useConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from '../components/ui/Toast';

export default function SyllabusManager() {
    const { user } = useAuth();
    const { dialogProps, confirm } = useConfirmDialog();

    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('syllabus_structure');
        return saved ? JSON.parse(saved) : SYLLABUS_DATA;
    });

    const [completedItems, setCompletedItems] = useState(() => {
        const saved = localStorage.getItem('syllabus_completed');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending

    // Calculate progress
    const totalItems = countAllItems(items);
    const completedCount = completedItems.size;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // Sync progress to DB when it changes
    useEffect(() => {
        if (user) {
            updateUserProgress(user.uid, completedCount, totalItems);
        }
    }, [completedCount, totalItems, user]);

    // Filter and search logic
    const filteredItems = useMemo(() => {
        if (!searchQuery && filterStatus === 'all') return items;

        const searchLower = searchQuery.toLowerCase();

        const filterRecursive = (list) => {
            return list.map(item => {
                const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchLower);
                const isCompleted = completedItems.has(item.id);
                const matchesFilter = filterStatus === 'all' ||
                    (filterStatus === 'completed' && isCompleted) ||
                    (filterStatus === 'pending' && !isCompleted);

                const filteredChildren = item.children ? filterRecursive(item.children) : [];
                const hasMatchingChildren = filteredChildren.some(c => c._visible);

                const visible = (matchesSearch && matchesFilter) || hasMatchingChildren;

                return {
                    ...item,
                    children: filteredChildren,
                    _visible: visible,
                    _highlighted: matchesSearch && searchQuery
                };
            }).filter(item => item._visible);
        };

        return filterRecursive(items);
    }, [items, searchQuery, filterStatus, completedItems]);

    // Persist changes
    const saveStructure = (newItems) => {
        setItems(newItems);
        localStorage.setItem('syllabus_structure', JSON.stringify(newItems));
    };

    const toggleItem = (id) => {
        const newSet = new Set(completedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setCompletedItems(newSet);
        localStorage.setItem('syllabus_completed', JSON.stringify([...newSet]));
    };

    // Bulk mark complete for a section
    const markSectionComplete = (item) => {
        const newSet = new Set(completedItems);
        const markRecursive = (node) => {
            newSet.add(node.id);
            if (node.children) {
                node.children.forEach(markRecursive);
            }
        };
        markRecursive(item);
        setCompletedItems(newSet);
        localStorage.setItem('syllabus_completed', JSON.stringify([...newSet]));
        toast.success(`Marked "${item.title}" and all sub-topics as complete!`);
    };

    // Generalized function to add a child to ANY node
    const handleAddChild = (parentId, childTitle) => {
        if (!childTitle.trim()) return;

        const newChild = {
            id: `custom-${Date.now()}`,
            title: childTitle,
            children: []
        };

        if (parentId === 'root') {
            saveStructure([...items, newChild]);
        } else {
            const addRecursive = (list) => {
                return list.map(item => {
                    if (item.id === parentId) {
                        return { ...item, children: [...(item.children || []), newChild] };
                    }
                    if (item.children) {
                        return { ...item, children: addRecursive(item.children) };
                    }
                    return item;
                });
            };
            saveStructure(addRecursive(items));
        }
        toast.success('Topic added successfully!');
    };

    const handleDeleteItem = async (id, title) => {
        const confirmed = await confirm({
            title: 'Delete Topic',
            message: `Delete "${title}" and all its sub-topics? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true
        });

        if (confirmed) {
            const deleteRecursive = (list) => {
                return list.filter(item => {
                    if (item.id === id) return false;
                    if (item.children) {
                        item.children = deleteRecursive(item.children);
                    }
                    return true;
                });
            };
            saveStructure(deleteRecursive(items));
            toast.success('Topic deleted');
        }
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Reset Syllabus',
            message: 'Reset to default syllabus layout? This will remove all custom topics but keep your progress.',
            confirmText: 'Reset',
            isDangerous: true
        });

        if (confirmed) {
            saveStructure(SYLLABUS_DATA);
            toast.success('Syllabus reset to default');
        }
    };

    const handleClearProgress = async () => {
        const confirmed = await confirm({
            title: 'Clear All Progress',
            message: 'This will mark all topics as incomplete. Are you sure?',
            confirmText: 'Clear Progress',
            isDangerous: true
        });

        if (confirmed) {
            setCompletedItems(new Set());
            localStorage.setItem('syllabus_completed', JSON.stringify([]));
            toast.success('Progress cleared');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Syllabus Tracker</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage and track your entire curriculum</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="card px-4 py-2 flex items-center gap-3 bg-white dark:bg-dark-surface dark:border-dark-border">
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Progress</p>
                            <p className="text-lg font-bold text-royal-600 dark:text-royal-400">{progress.toFixed(1)}%</p>
                        </div>
                        <div className="w-32 h-3 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden border border-slate-200 dark:border-dark-border">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card p-4 dark:bg-dark-surface dark:border-dark-border">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-500 text-slate-800 dark:text-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-100 dark:bg-dark-bg rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'completed', label: 'Done' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === key
                                        ? 'bg-white dark:bg-dark-surface text-royal-600 dark:text-royal-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleClearProgress}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Clear Progress"
                        >
                            Clear Progress
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-royal-600 hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-lg flex items-center gap-1 transition-colors"
                            title="Reset to Default"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Main Topic */}
            <div className="card p-4 dark:bg-dark-surface dark:border-dark-border">
                <AddItemForm
                    placeholder="Add new main subject..."
                    onAdd={(text) => handleAddChild('root', text)}
                    isMain={true}
                />
            </div>

            {/* Search Results Info */}
            {searchQuery && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Found {countAllItems(filteredItems)} results for "{searchQuery}"
                </div>
            )}

            {/* Syllabus Tree */}
            <div className="card p-6 dark:bg-dark-surface dark:border-dark-border min-h-[400px]">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        {searchQuery ? (
                            <p>No topics matching "{searchQuery}"</p>
                        ) : (
                            <p>No topics found. Add one above or reset to default.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredItems.map((paper) => (
                            <Node
                                key={paper.id}
                                item={paper}
                                level={0}
                                completedItems={completedItems}
                                toggleItem={toggleItem}
                                onDelete={handleDeleteItem}
                                onAddChild={handleAddChild}
                                onBulkComplete={markSectionComplete}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

function AddItemForm({ onAdd, placeholder, isMain }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onAdd(text);
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                maxLength={100}
                className={`flex-1 ${isMain ? 'input-field' : 'px-3 py-1 text-sm border rounded-lg dark:bg-dark-bg dark:border-dark-border dark:text-white'}`}
                autoFocus={!isMain}
            />
            <button
                type="submit"
                disabled={!text.trim()}
                className={`${isMain ? 'btn-primary px-6 rounded-xl disabled:opacity-50' : 'p-1 hover:bg-emerald-50 text-emerald-600 rounded disabled:opacity-50'} flex items-center gap-1`}
            >
                {isMain ? <><Plus className="w-5 h-5" /> Add</> : <CheckCircle2 className="w-4 h-4" />}
            </button>
        </form>
    );
}

function Node({ item, level, completedItems, toggleItem, onDelete, onAddChild, onBulkComplete, searchQuery }) {
    const [isOpen, setIsOpen] = useState(level < 1 || !!searchQuery); // Open when searching
    const [isAdding, setIsAdding] = useState(false);

    const hasChildren = item.children && item.children.length > 0;
    const isCompleted = completedItems.has(item.id);

    // Highlight matching text
    const highlightMatch = (text) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-gold-200 dark:bg-gold-900/50 px-0.5 rounded">{part}</mark>
            ) : part
        );
    };

    return (
        <div>
            <div
                className={`flex items-center py-3 px-3 rounded-xl hover:bg-royal-50/50 dark:hover:bg-royal-900/10 transition-colors group border border-transparent ${level === 0 ? 'bg-slate-50 mb-2 mt-2 dark:bg-dark-bg hover:border-royal-200' : 'hover:border-slate-100'
                    }`}
                style={{ marginLeft: `${level * 24}px` }}
            >
                {/* Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item.id);
                    }}
                    className="mr-3 shrink-0"
                >
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-royal-400 transition-colors" />
                    )}
                </button>

                {/* Title & Expand */}
                <div
                    className="flex-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => { if (hasChildren) setIsOpen(!isOpen); }}
                >
                    <span className={`font-medium transition-colors ${level === 0
                        ? 'text-lg text-slate-800 dark:text-white'
                        : isCompleted
                            ? 'text-slate-400 line-through decoration-slate-300'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                        {highlightMatch(item.title)}
                    </span>
                    {hasChildren && (
                        <span className="text-slate-400 hover:text-royal-600">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {hasChildren && (
                        <button
                            onClick={() => onBulkComplete(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Mark All Complete"
                        >
                            <CheckSquare className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Add Sub-topic"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Topic"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Add Sub-item Form */}
            {isAdding && (
                <div className="ml-12 my-2 w-64 animate-fade-in flex items-center gap-2" style={{ marginLeft: `${level * 24 + 40}px` }}>
                    <AddItemForm
                        placeholder="Sub-topic title..."
                        onAdd={(text) => { onAddChild(item.id, text); setIsAdding(false); setIsOpen(true); }}
                    />
                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Children */}
            {isOpen && hasChildren && (
                <div className="animate-slide-up origin-top">
                    {item.children.map((child) => (
                        <Node
                            key={child.id}
                            item={child}
                            level={level + 1}
                            completedItems={completedItems}
                            toggleItem={toggleItem}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onBulkComplete={onBulkComplete}
                            searchQuery={searchQuery}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function countAllItems(items) {
    let count = 0;
    const traverse = (list) => {
        list.forEach(item => {
            count++;
            if (item.children) traverse(item.children);
        });
    };
    traverse(items);
    return count;
}
