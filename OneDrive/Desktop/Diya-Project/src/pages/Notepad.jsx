import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Plus, Download, Trash2, FileText, X, Check, Cloud, Search, Tag } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ConfirmDialog, useConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from '../components/ui/Toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';

// Local debounce function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Available tags - simplified for black/white theme
const AVAILABLE_TAGS = [
    { id: 'gs1', label: 'GS1' },
    { id: 'gs2', label: 'GS2' },
    { id: 'gs3', label: 'GS3' },
    { id: 'gs4', label: 'GS4' },
    { id: 'essay', label: 'Essay' },
    { id: 'optional', label: 'Optional' },
    { id: 'current', label: 'Current Affairs' },
];

// Quill editor modules/formats
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        [{ 'color': [] }, { 'background': [] }],
        ['link'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'color', 'background',
    'link'
];

export default function Notepad() {
    const { user } = useAuth();
    const { dialogProps, confirm } = useConfirmDialog();
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [saveStatus, setSaveStatus] = useState('saved');

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState(null);

    const quillRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'notes'),
            where('uid', '==', user.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const dateA = a.updatedAt?.seconds || 0;
                const dateB = b.updatedAt?.seconds || 0;
                return dateB - dateA;
            });
            setNotes(data);
        }, (error) => {
            console.error("Error fetching notes:", error);
            toast.error('Failed to load notes');
        });
        return () => unsub();
    }, [user]);

    // Filter and search notes
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const plainContent = note.content?.replace(/<[^>]*>/g, '') || '';
            const matchesSearch = !searchQuery ||
                note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plainContent.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !filterTag || (note.tags && note.tags.includes(filterTag));
            return matchesSearch && matchesTag;
        });
    }, [notes, searchQuery, filterTag]);

    // Auto-save logic
    const saveNote = async (noteId, newTitle, newContent, newTags) => {
        if (!noteId || !newTitle.trim()) return;

        setSaveStatus('saving');
        try {
            const noteRef = doc(db, 'notes', noteId);
            await updateDoc(noteRef, {
                title: newTitle,
                content: newContent,
                tags: newTags || [],
                updatedAt: serverTimestamp()
            });
            setSaveStatus('saved');
        } catch (error) {
            console.error("Error auto-saving:", error);
            setSaveStatus('unsaved');
            toast.error('Failed to save note');
        }
    };

    const debouncedSave = useCallback(debounce((id, t, c, tgs) => saveNote(id, t, c, tgs), 1500), []);

    useEffect(() => {
        if (activeNote && (title !== activeNote.title || content !== activeNote.content || JSON.stringify(tags) !== JSON.stringify(activeNote.tags || []))) {
            setSaveStatus('unsaved');
            debouncedSave(activeNote.id, title, content, tags);
        }
    }, [title, content, tags, activeNote, debouncedSave]);

    const handleCreateNew = async () => {
        if (!user) {
            toast.warning("You must be logged in to create notes.");
            return;
        }
        const newNote = {
            uid: user.uid,
            title: 'Untitled Note',
            content: '',
            tags: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            const docRef = await addDoc(collection(db, 'notes'), newNote);
            setActiveNote({ id: docRef.id, ...newNote });
            setTitle('Untitled Note');
            setContent('');
            setTags([]);
            setIsCreating(true);
            toast.success('Note created!');
        } catch (e) {
            console.error("Error creating note:", e);
            toast.error("Failed to create note");
        }
    };

    const handleDelete = async (id, noteTitle) => {
        const confirmed = await confirm({
            title: 'Delete Note',
            message: `Delete "${noteTitle}"? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true
        });

        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'notes', id));
                if (activeNote?.id === id) {
                    setActiveNote(null);
                    setTitle('');
                    setContent('');
                    setTags([]);
                }
                toast.success('Note deleted');
            } catch (error) {
                toast.error('Failed to delete note');
            }
        }
    };

    const handleSelectNote = (note) => {
        setActiveNote(note);
        setTitle(note.title);
        setContent(note.content || '');
        setTags(note.tags || []);
        setIsCreating(true);
        setSaveStatus('saved');
    };

    const toggleTag = (tagId) => {
        setTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleDownloadPDF = () => {
        if (!title || !content) {
            toast.warning('Nothing to download');
            return;
        }
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text(title, 20, 20);
        pdfDoc.setFontSize(12);

        const plainText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
        const splitText = pdfDoc.splitTextToSize(plainText, 170);
        pdfDoc.text(splitText, 20, 40);
        pdfDoc.save(`${title.replace(/\s+/g, '_')}_UPSC.pdf`);
        toast.success('PDF downloaded!');
    };

    const getPreviewText = (htmlContent) => {
        if (!htmlContent) return 'No content';
        return htmlContent.replace(/<[^>]*>/g, '').substring(0, 100) || 'No content';
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in">
            {/* Sidebar List */}
            <div className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium">My <span className="font-bold">Notes</span></h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateNew}
                        className="p-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="input-field pl-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-black dark:hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Tag Filter */}
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setFilterTag(null)}
                        className={`px-2 py-1 text-xs rounded transition-colors border ${!filterTag
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                            : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                            }`}
                    >
                        All
                    </button>
                    {AVAILABLE_TAGS.slice(0, 5).map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors border ${filterTag === tag.id
                                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                }`}
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    <AnimatePresence>
                        {filteredNotes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectNote(note)}
                                className={`card p-4 cursor-pointer transition-all group ${activeNote?.id === note.id
                                    ? 'border-black dark:border-white'
                                    : 'hover:border-black/30 dark:hover:border-white/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold truncate">
                                        {note.title}
                                    </h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id, note.title); }}
                                        className="p-1 text-[#71717A] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Tags */}
                                {note.tags && note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {note.tags.map(tagId => {
                                            const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                                            return tag ? (
                                                <span key={tagId} className="px-1.5 py-0.5 text-xs rounded border border-black/10 dark:border-white/10 text-[#71717A]">
                                                    {tag.label}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}

                                <p className="text-xs text-[#71717A] line-clamp-2 font-light">
                                    {getPreviewText(note.content)}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredNotes.length === 0 && (
                        <div className="text-center py-10 text-[#71717A]">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="font-light">{searchQuery || filterTag ? 'No matching notes' : 'No notes found'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            {activeNote ? (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 card flex flex-col overflow-hidden relative"
                >
                    {/* Toolbar */}
                    <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-[#FAFAFA] dark:bg-dark-surface sticky top-0 z-10">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title..."
                            maxLength={100}
                            className="bg-transparent text-xl font-bold placeholder-[#71717A] border-none focus:ring-0 w-full focus:outline-none"
                        />
                        <div className="flex items-center gap-3">
                            {/* Auto-save Indicator */}
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10">
                                {saveStatus === 'saving' && <Cloud className="w-3 h-3 animate-pulse" />}
                                {saveStatus === 'saved' && <Check className="w-3 h-3" />}
                                <span className="text-xs font-medium text-[#71717A]">
                                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
                                </span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownloadPDF}
                                className="p-2 text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors border border-black/10 dark:border-white/10"
                                title="Download PDF"
                            >
                                <Download className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Tag Selector */}
                    <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#71717A]" />
                        <div className="flex flex-wrap gap-1">
                            {AVAILABLE_TAGS.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-2 py-1 text-xs rounded transition-all border ${tags.includes(tag.id)
                                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                        : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                        }`}
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="flex-1 overflow-hidden notepad-editor">
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Start writing your UPSC notes here..."
                            className="h-full"
                        />
                    </div>
                </motion.div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#71717A] bg-[#FAFAFA] dark:bg-dark-surface rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a note to view</p>
                    <p className="text-sm font-light">or create a new one to start writing</p>
                </div>
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
