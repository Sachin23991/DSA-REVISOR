import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Copy, Check, Trash2, Send, FileText, AlignLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default function NotesAI() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('detailed');

    const handleAskAI = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setResponse('');

        const promptPrefix = mode === 'summary'
            ? "Provide a concise, short summary (max 300 words) for: "
            : "Provide a comprehensive, detailed explanation with examples for: ";

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(`You are an expert UPSC tutor. ${promptPrefix} ${query}`);
            const text = result.response.text();

            if (text) {
                setResponse(text);
            } else {
                setError('No response generated. Please try again.');
            }
        } catch (err) {
            console.error("Gemini API Error:", err);
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(`You are an expert UPSC tutor. ${promptPrefix} ${query}`);
                const text = result.response.text();
                setResponse(text);
            } catch (fallbackErr) {
                setError('Failed to get response. Please check your API key or internet connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setQuery('');
        setResponse('');
        setError('');
    };

    const quickPrompts = [
        "Explain Article 370",
        "Key ethics case studies",
        "Indian foreign policy 2024",
        "Climate change initiatives"
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-black dark:bg-white rounded flex items-center justify-center">
                        <Bot className="w-7 h-7 text-white dark:text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-medium">AI <span className="font-bold">Tutor</span></h1>
                        <p className="text-[#71717A] font-light">Ask questions, summaries, or explanations</p>
                    </div>
                </div>
                {(query || response) && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors border border-black/10 dark:border-white/10"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </motion.button>
                )}
            </div>

            {/* Mode Selection */}
            <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded w-fit">
                <button
                    onClick={() => setMode('detailed')}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${mode === 'detailed'
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-[#71717A] hover:text-black dark:hover:text-white'
                        }`}
                >
                    <AlignLeft className="w-4 h-4" />
                    Detailed
                </button>
                <button
                    onClick={() => setMode('summary')}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${mode === 'summary'
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-[#71717A] hover:text-black dark:hover:text-white'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Summary
                </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                    <motion.button
                        key={prompt}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setQuery(prompt)}
                        className="px-4 py-2 border border-black/10 dark:border-white/10 text-[#71717A] rounded text-sm font-medium hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
                    >
                        {prompt}
                    </motion.button>
                ))}
            </div>

            {/* Input */}
            <motion.div
                className="card p-6 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask anything about UPSC topics for a ${mode} answer...`}
                    className="input-field h-32 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleAskAI();
                    }}
                />
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-[#71717A] font-light">Press Ctrl+Enter • {mode === 'summary' ? '~300 words' : 'In-depth'}</span>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAskAI}
                        disabled={loading || !query.trim()}
                        className="btn-primary px-6 py-3 rounded font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Response */}
            <AnimatePresence>
                {response && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-8"
                    >
                        <div className="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                AI Answer
                            </h3>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 text-[#71717A] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-sm border border-black/10 dark:border-white/10"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </motion.button>
                        </div>
                        <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-[#71717A] dark:prose-p:text-dark-muted prose-strong:text-black dark:prose-strong:text-white prose-a:text-black dark:prose-a:text-white prose-a:underline">
                            <ReactMarkdown>{response}</ReactMarkdown>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
