import { useState, useRef, useEffect, useMemo } from 'react';
import { SYLLABUS_DATA } from '../lib/syllabus-data';
import { ChevronRight, ChevronDown, CheckCircle2, Circle, BookOpen, Plus, Trash2, RotateCcw, X, Search, CheckSquare, Filter, FolderPlus, Folder, ChevronLeft, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProgress } from '../lib/db';
import { ConfirmDialog, useConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

// Default syllabus templates
const DEFAULT_SYLLABI = {
    'upsc-prelims': {
        name: 'UPSC Prelims',
        data: SYLLABUS_DATA
    }
};

export default function SyllabusManager() {
    const { user } = useAuth();
    const { dialogProps, confirm } = useConfirmDialog();

    // Multiple syllabi support
    const [syllabi, setSyllabi] = useState(() => {
        const saved = localStorage.getItem('syllabi_list');
        if (saved) return JSON.parse(saved);
        return {
            'upsc-prelims': {
                id: 'upsc-prelims',
                name: 'UPSC Prelims',
                items: SYLLABUS_DATA,
                completed: []
            }
        };
    });

    const [activeSyllabusId, setActiveSyllabusId] = useState(() => {
        const saved = localStorage.getItem('active_syllabus');
        return saved || 'upsc-prelims';
    });

    const [showSyllabusList, setShowSyllabusList] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newSyllabusName, setNewSyllabusName] = useState('');
    const [editingName, setEditingName] = useState(false);

    // Current syllabus data
    const activeSyllabus = syllabi[activeSyllabusId] || Object.values(syllabi)[0];
    const items = activeSyllabus?.items || [];
    const completedItems = new Set(activeSyllabus?.completed || []);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Calculate progress
    const totalItems = countAllItems(items);
    const completedCount = completedItems.size;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('syllabi_list', JSON.stringify(syllabi));
    }, [syllabi]);

    useEffect(() => {
        localStorage.setItem('active_syllabus', activeSyllabusId);
    }, [activeSyllabusId]);

    // Sync overall progress to DB
    useEffect(() => {
        if (user) {
            // Calculate total progress across all syllabi
            let totalCompleted = 0;
            let totalTopics = 0;
            Object.values(syllabi).forEach(s => {
                totalCompleted += (s.completed || []).length;
                totalTopics += countAllItems(s.items || []);
            });
            updateUserProgress(user.uid, totalCompleted, totalTopics);
        }
    }, [syllabi, user]);

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

    // Save functions
    const updateActiveSyllabus = (updates) => {
        setSyllabi(prev => ({
            ...prev,
            [activeSyllabusId]: {
                ...prev[activeSyllabusId],
                ...updates
            }
        }));
    };

    const saveItems = (newItems) => {
        updateActiveSyllabus({ items: newItems });
    };

    const toggleItem = (id) => {
        const currentCompleted = activeSyllabus?.completed || [];
        const newCompleted = currentCompleted.includes(id)
            ? currentCompleted.filter(i => i !== id)
            : [...currentCompleted, id];
        updateActiveSyllabus({ completed: newCompleted });
    };

    const markSectionComplete = (item) => {
        const currentCompleted = new Set(activeSyllabus?.completed || []);
        const markRecursive = (node) => {
            currentCompleted.add(node.id);
            if (node.children) {
                node.children.forEach(markRecursive);
            }
        };
        markRecursive(item);
        updateActiveSyllabus({ completed: [...currentCompleted] });
        toast.success(`Marked "${item.title}" and all sub-topics as complete!`);
    };

    const handleAddChild = (parentId, childTitle) => {
        if (!childTitle.trim()) return;

        const newChild = {
            id: `custom-${Date.now()}`,
            title: childTitle,
            children: []
        };

        if (parentId === 'root') {
            saveItems([...items, newChild]);
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
            saveItems(addRecursive(items));
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
            saveItems(deleteRecursive(items));
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
            saveItems(SYLLABUS_DATA);
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
            updateActiveSyllabus({ completed: [] });
            toast.success('Progress cleared');
        }
    };

    // Syllabus management
    const createNewSyllabus = () => {
        if (!newSyllabusName.trim()) {
            toast.warning('Please enter a syllabus name');
            return;
        }
        const id = `syllabus-${Date.now()}`;
        setSyllabi(prev => ({
            ...prev,
            [id]: {
                id,
                name: newSyllabusName.trim(),
                items: [],
                completed: []
            }
        }));
        setActiveSyllabusId(id);
        setNewSyllabusName('');
        setIsCreatingNew(false);
        setShowSyllabusList(false);
        toast.success(`Created "${newSyllabusName}" syllabus`);
    };

    const deleteSyllabus = async (id) => {
        if (Object.keys(syllabi).length <= 1) {
            toast.warning('You must have at least one syllabus');
            return;
        }

        const syllabus = syllabi[id];
        const confirmed = await confirm({
            title: 'Delete Syllabus',
            message: `Delete "${syllabus.name}" and all its topics? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true
        });

        if (confirmed) {
            setSyllabi(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
            if (activeSyllabusId === id) {
                setActiveSyllabusId(Object.keys(syllabi).find(k => k !== id) || '');
            }
            toast.success('Syllabus deleted');
        }
    };

    const renameSyllabus = (id, newName) => {
        setSyllabi(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                name: newName
            }
        }));
        setEditingName(false);
        toast.success('Syllabus renamed');
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
            {/* Header with Syllabus Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Syllabus Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSyllabusList(!showSyllabusList)}
                            className="flex items-center gap-2 px-4 py-2 rounded border border-black/10 dark:border-white/10 hover:bg-[#FAFAFA] dark:hover:bg-dark-surface transition-colors"
                        >
                            <Folder className="w-5 h-5" />
                            <span className="font-medium text-black dark:text-white">{activeSyllabus?.name || 'Select Syllabus'}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showSyllabusList ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showSyllabusList && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-dark-surface border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50"
                                >
                                    <div className="p-2 border-b border-black/5 dark:border-white/5">
                                        <p className="text-xs text-[#71717A] font-light px-2 py-1">Your Syllabi</p>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {Object.values(syllabi).map(s => (
                                            <div
                                                key={s.id}
                                                className={`flex items-center justify-between px-3 py-2 hover:bg-[#FAFAFA] dark:hover:bg-dark-bg cursor-pointer ${s.id === activeSyllabusId ? 'bg-black/5 dark:bg-white/5' : ''}`}
                                            >
                                                <button
                                                    onClick={() => { setActiveSyllabusId(s.id); setShowSyllabusList(false); }}
                                                    className="flex-1 text-left font-medium text-black dark:text-white"
                                                >
                                                    {s.name}
                                                    <span className="text-xs text-[#71717A] ml-2">
                                                        {((s.completed?.length || 0) / Math.max(1, countAllItems(s.items || [])) * 100).toFixed(0)}%
                                                    </span>
                                                </button>
                                                {Object.keys(syllabi).length > 1 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSyllabus(s.id); }}
                                                        className="p-1 text-[#71717A] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-black/5 dark:border-white/5">
                                        {isCreatingNew ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newSyllabusName}
                                                    onChange={(e) => setNewSyllabusName(e.target.value)}
                                                    placeholder="Syllabus name..."
                                                    className="flex-1 px-3 py-2 text-sm border border-black/10 dark:border-white/10 rounded bg-transparent text-black dark:text-white"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && createNewSyllabus()}
                                                />
                                                <button
                                                    onClick={createNewSyllabus}
                                                    className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded text-sm font-medium"
                                                >
                                                    Create
                                                </button>
                                                <button
                                                    onClick={() => { setIsCreatingNew(false); setNewSyllabusName(''); }}
                                                    className="p-2 text-[#71717A] hover:text-black dark:hover:text-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsCreatingNew(true)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-black dark:text-white hover:bg-[#FAFAFA] dark:hover:bg-dark-bg rounded transition-colors"
                                            >
                                                <FolderPlus className="w-4 h-4" />
                                                Create New Syllabus
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    defaultValue={activeSyllabus?.name}
                                    className="text-2xl font-bold bg-transparent border-b-2 border-black dark:border-white focus:outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') renameSyllabus(activeSyllabusId, e.target.value);
                                        if (e.key === 'Escape') setEditingName(false);
                                    }}
                                    autoFocus
                                />
                                <button onClick={() => setEditingName(false)} className="p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <h1 className="text-2xl font-medium flex items-center gap-2">
                                Syllabus <span className="font-bold">Tracker</span>
                                <button onClick={() => setEditingName(true)} className="p-1 text-[#71717A] hover:text-black dark:hover:text-white">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </h1>
                        )}
                        <p className="text-[#71717A] font-light">Manage and track your curriculum</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="card px-4 py-2 flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm text-[#71717A] font-light">Progress</p>
                            <p className="text-lg font-bold">{progress.toFixed(1)}%</p>
                        </div>
                        <div className="w-32 h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-black dark:bg-white transition-all duration-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="input-field pl-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-black dark:hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-black/5 dark:bg-white/5 rounded p-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'completed', label: 'Done' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`px-4 py-2 rounded text-sm font-medium transition-all ${filterStatus === key
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                    : 'text-[#71717A] hover:text-black dark:hover:text-white'
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
                            className="px-3 py-2 text-sm text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                            title="Clear Progress"
                        >
                            Clear Progress
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-sm text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded flex items-center gap-1 transition-colors"
                            title="Reset to Default"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Main Topic */}
            <div className="card p-4">
                <AddItemForm
                    placeholder="Add new main subject..."
                    onAdd={(text) => handleAddChild('root', text)}
                    isMain={true}
                />
            </div>

            {/* Search Results Info */}
            {searchQuery && (
                <div className="text-sm text-[#71717A] font-light">
                    Found {countAllItems(filteredItems)} results for "{searchQuery}"
                </div>
            )}

            {/* Syllabus Tree */}
            <div className="card p-6 min-h-[400px]">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-[#71717A]">
                        {searchQuery ? (
                            <p className="font-light">No topics matching "{searchQuery}"</p>
                        ) : items.length === 0 ? (
                            <div>
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-light">This syllabus is empty. Add topics above to get started!</p>
                            </div>
                        ) : (
                            <p className="font-light">No topics found. Add one above or reset to default.</p>
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

            {/* Click outside to close syllabus list */}
            {showSyllabusList && (
                <div className="fixed inset-0 z-40" onClick={() => setShowSyllabusList(false)} />
            )}
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
                className={`flex-1 ${isMain ? 'input-field' : 'px-3 py-1 text-sm border border-black/10 dark:border-white/10 rounded bg-transparent text-black dark:text-white'}`}
                autoFocus={!isMain}
            />
            <button
                type="submit"
                disabled={!text.trim()}
                className={`${isMain ? 'btn-primary px-6 rounded disabled:opacity-50' : 'p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded disabled:opacity-50'} flex items-center gap-1`}
            >
                {isMain ? <><Plus className="w-5 h-5" /> Add</> : <CheckCircle2 className="w-4 h-4" />}
            </button>
        </form>
    );
}

function Node({ item, level, completedItems, toggleItem, onDelete, onAddChild, onBulkComplete, searchQuery }) {
    const [isOpen, setIsOpen] = useState(level < 1 || !!searchQuery);
    const [isAdding, setIsAdding] = useState(false);

    const hasChildren = item.children && item.children.length > 0;
    const isCompleted = completedItems.has(item.id);

    const highlightMatch = (text) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-black/10 dark:bg-white/20 px-0.5 rounded">{part}</mark>
            ) : part
        );
    };

    return (
        <div>
            <div
                className={`flex items-center py-3 px-3 rounded hover:bg-[#FAFAFA] dark:hover:bg-dark-surface transition-colors group border ${level === 0
                    ? 'bg-black/5 dark:bg-white/5 mb-2 mt-2 border-black/10 dark:border-white/10'
                    : 'border-transparent hover:border-black/5 dark:hover:border-white/5'
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
                        <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                    ) : (
                        <Circle className="w-5 h-5 text-[#71717A] group-hover:text-black dark:group-hover:text-white transition-colors" />
                    )}
                </button>

                {/* Title & Expand */}
                <div
                    className="flex-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => { if (hasChildren) setIsOpen(!isOpen); }}
                >
                    <span className={`font-medium transition-colors ${level === 0
                        ? 'text-lg text-black dark:text-white'
                        : isCompleted
                            ? 'text-[#71717A] line-through'
                            : 'text-black dark:text-white'
                        }`}>
                        {highlightMatch(item.title)}
                    </span>
                    {hasChildren && (
                        <span className="text-[#71717A] hover:text-black dark:hover:text-white">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {hasChildren && (
                        <button
                            onClick={() => onBulkComplete(item)}
                            className="p-1.5 text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                            title="Mark All Complete"
                        >
                            <CheckSquare className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1.5 text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                        title="Add Sub-topic"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id, item.title)}
                        className="p-1.5 text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                    <button onClick={() => setIsAdding(false)} className="text-[#71717A] hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Children */}
            {isOpen && hasChildren && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="origin-top"
                >
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
                </motion.div>
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
