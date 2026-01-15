import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Search, Download, ChevronRight, ChevronDown, Calendar,
    BookOpen, Filter, ExternalLink, Loader2, Clock, Target, ArrowRight,
    Plus, Trash2, Star, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

// PYQ Years available
const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

// Paper categories
const PAPER_CATEGORIES = [
    { id: 'prelims-gs', name: 'Prelims GS', icon: '📝' },
    { id: 'prelims-csat', name: 'Prelims CSAT', icon: '🧮' },
    { id: 'mains-gs1', name: 'Mains GS1', icon: '📚' },
    { id: 'mains-gs2', name: 'Mains GS2', icon: '⚖️' },
    { id: 'mains-gs3', name: 'Mains GS3', icon: '💰' },
    { id: 'mains-gs4', name: 'Mains GS4', icon: '🎯' },
    { id: 'mains-essay', name: 'Essay', icon: '✍️' },
    { id: 'optional', name: 'Optional', icon: '📖' },
];

// Subject tags for filtering
const SUBJECT_TAGS = [
    'History', 'Geography', 'Polity', 'Economy', 'Environment',
    'Science & Tech', 'Current Affairs', 'Ethics', 'International Relations',
    'Society', 'Art & Culture', 'Governance', 'Security'
];

export default function PYQPage() {
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedPaper, setSelectedPaper] = useState('prelims-gs');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());
    const [savedQuestions, setSavedQuestions] = useState(() => {
        const saved = localStorage.getItem('saved_pyq');
        return saved ? JSON.parse(saved) : [];
    });
    const [showSaved, setShowSaved] = useState(false);
    const [generatingPaper, setGeneratingPaper] = useState(false);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('saved_pyq', JSON.stringify(savedQuestions));
    }, [savedQuestions]);

    // Generate PYQ using AI
    const generatePYQ = async () => {
        setLoading(true);
        setError('');
        setQuestions([]);

        const paper = PAPER_CATEGORIES.find(p => p.id === selectedPaper);

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "UPSC PYQ Generator",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        {
                            "role": "user",
                            "content": `Generate 15 authentic UPSC ${paper.name} Previous Year Questions from ${selectedYear}. 
                            
For each question, provide:
1. The actual question
2. All options (for MCQ) or the actual question prompt (for Mains)
3. The correct answer with explanation
4. Subject/Topic tag
5. Difficulty level (Easy/Medium/Hard)

Return as JSON array:
[
    {
        "id": 1,
        "question": "Question text",
        "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
        "correctAnswer": "A",
        "explanation": "Detailed explanation",
        "subject": "History",
        "topic": "Modern India",
        "difficulty": "Medium",
        "year": ${selectedYear}
    }
]

Make questions authentic and educational. Do NOT include markdown or code blocks, just raw JSON.`
                        }
                    ]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.choices[0].message.content;
            const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedQuestions = JSON.parse(cleanContent);

            setQuestions(parsedQuestions);
        } catch (err) {
            console.error(err);
            setError('Failed to generate questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Generate full paper
    const generateFullPaper = async () => {
        setGeneratingPaper(true);
        setError('');

        const paper = PAPER_CATEGORIES.find(p => p.id === selectedPaper);
        const questionCount = selectedPaper.includes('prelims') ? 100 : 20;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "UPSC Full Paper",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        {
                            "role": "user",
                            "content": `Generate a complete simulated UPSC ${paper.name} paper for ${selectedYear} with ${questionCount} questions.

Format as JSON array similar to actual UPSC pattern:
[
    {
        "id": 1,
        "question": "Question text",
        "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
        "correctAnswer": "A",
        "explanation": "Brief explanation",
        "subject": "Subject name",
        "difficulty": "Easy/Medium/Hard"
    }
]

Make it authentic, covering all syllabus topics proportionally. Return ONLY valid JSON.`
                        }
                    ]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.choices[0].message.content;
            const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedQuestions = JSON.parse(cleanContent);

            setQuestions(parsedQuestions);
        } catch (err) {
            console.error(err);
            setError('Failed to generate full paper. Please try again.');
        } finally {
            setGeneratingPaper(false);
        }
    };

    // Toggle question expansion
    const toggleExpand = (id) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    // Save/unsave question
    const toggleSaveQuestion = (question) => {
        setSavedQuestions(prev => {
            const exists = prev.find(q => q.id === question.id && q.year === question.year);
            if (exists) return prev.filter(q => !(q.id === question.id && q.year === question.year));
            return [...prev, { ...question, savedAt: new Date().toISOString() }];
        });
    };

    // Filter questions
    const filteredQuestions = useMemo(() => {
        let list = showSaved ? savedQuestions : questions;

        if (searchQuery) {
            list = list.filter(q =>
                q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.subject?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedTags.length > 0) {
            list = list.filter(q => selectedTags.includes(q.subject));
        }

        return list;
    }, [questions, savedQuestions, searchQuery, selectedTags, showSaved]);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium">Previous Year <span className="font-bold">Questions</span></h1>
                    <p className="text-[#71717A] font-light">Practice with authentic UPSC questions</p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowSaved(!showSaved)}
                        className={`px-4 py-2 rounded flex items-center gap-2 font-medium border ${showSaved
                                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                            }`}
                    >
                        <Star className="w-4 h-4" />
                        Saved ({savedQuestions.length})
                    </motion.button>
                </div>
            </div>

            {/* Controls */}
            <div className="card p-6 space-y-6">
                {/* Year and Paper Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Year Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-3 text-[#71717A]">Select Year</label>
                        <div className="flex flex-wrap gap-2">
                            {YEARS.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-all border ${selectedYear === year
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                            : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Paper Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-3 text-[#71717A]">Select Paper</label>
                        <div className="flex flex-wrap gap-2">
                            {PAPER_CATEGORIES.map(paper => (
                                <button
                                    key={paper.id}
                                    onClick={() => setSelectedPaper(paper.id)}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-all border flex items-center gap-1 ${selectedPaper === paper.id
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                            : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                        }`}
                                >
                                    <span>{paper.icon}</span>
                                    {paper.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generatePYQ}
                        disabled={loading}
                        className="btn-primary px-6 py-3 rounded flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Get Sample Questions
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generateFullPaper}
                        disabled={generatingPaper}
                        className="btn-outline px-6 py-3 rounded flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        {generatingPaper ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Full Paper...
                            </>
                        ) : (
                            <>
                                <BookOpen className="w-5 h-5" />
                                Generate Full Paper
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="input-field pl-10"
                    />
                </div>

                {/* Subject Tags Filter */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-[#71717A]">Filter by Subject</label>
                    <div className="flex flex-wrap gap-2">
                        {SUBJECT_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${selectedTags.includes(tag)
                                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                        : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="px-3 py-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm"
                >
                    {error}
                </motion.div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
                {showSaved && savedQuestions.length === 0 && (
                    <div className="card p-12 text-center">
                        <Star className="w-12 h-12 mx-auto mb-4 text-[#71717A]/30" />
                        <p className="text-lg font-medium mb-2">No Saved Questions</p>
                        <p className="text-[#71717A] font-light">Save questions to review them later</p>
                    </div>
                )}

                {!showSaved && questions.length === 0 && !loading && (
                    <div className="card p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-[#71717A]/30" />
                        <p className="text-lg font-medium mb-2">No Questions Yet</p>
                        <p className="text-[#71717A] font-light">Select year and paper, then click "Get Sample Questions"</p>
                    </div>
                )}

                <AnimatePresence>
                    {filteredQuestions.map((q, index) => {
                        const isExpanded = expandedQuestions.has(q.id);
                        const isSaved = savedQuestions.some(sq => sq.id === q.id && sq.year === q.year);

                        return (
                            <motion.div
                                key={`${q.id}-${q.year}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="card overflow-hidden"
                            >
                                {/* Question Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-[#FAFAFA] dark:hover:bg-dark-surface transition-colors"
                                    onClick={() => toggleExpand(q.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-sm font-bold text-[#71717A] w-8 shrink-0">
                                            Q{q.id}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium leading-relaxed">{q.question}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {q.subject && (
                                                    <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 text-xs rounded">
                                                        {q.subject}
                                                    </span>
                                                )}
                                                {q.difficulty && (
                                                    <span className={`px-2 py-0.5 text-xs rounded ${q.difficulty === 'Hard'
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            : q.difficulty === 'Medium'
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        }`}>
                                                        {q.difficulty}
                                                    </span>
                                                )}
                                                {q.year && (
                                                    <span className="text-xs text-[#71717A]">
                                                        <Calendar className="w-3 h-3 inline mr-1" />
                                                        {q.year}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSaveQuestion(q); }}
                                                className={`p-2 rounded transition-colors ${isSaved
                                                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                                        : 'text-[#71717A] hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>
                                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                                <ChevronRight className="w-5 h-5 text-[#71717A]" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-black/5 dark:border-white/5"
                                        >
                                            <div className="p-4 space-y-4 bg-[#FAFAFA] dark:bg-dark-surface">
                                                {/* Options */}
                                                {q.options && q.options.length > 0 && (
                                                    <div className="space-y-2">
                                                        {q.options.map((opt, idx) => {
                                                            const isCorrect = opt.startsWith(q.correctAnswer) ||
                                                                opt.includes(q.correctAnswer);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`p-3 rounded border ${isCorrect
                                                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                            : 'border-black/10 dark:border-white/10'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                                        <span className={isCorrect ? 'font-medium' : ''}>{opt}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Explanation */}
                                                {q.explanation && (
                                                    <div className="p-4 bg-white dark:bg-dark-bg rounded border border-black/5 dark:border-white/5">
                                                        <p className="text-sm font-bold mb-2">Explanation:</p>
                                                        <p className="text-sm text-[#71717A]">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Stats */}
            {questions.length > 0 && (
                <div className="card p-4">
                    <div className="flex justify-between items-center text-sm text-[#71717A]">
                        <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
                        <span>Year: {selectedYear} | Paper: {PAPER_CATEGORIES.find(p => p.id === selectedPaper)?.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
