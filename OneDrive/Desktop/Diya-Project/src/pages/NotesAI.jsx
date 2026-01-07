import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Copy, Check, Trash2, Send, FileText, AlignLeft, AlertCircle } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default function NotesAI() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('detailed'); // 'detailed' or 'summary'

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
            // Fallback try with gemini-1.5-flash
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
    // Removed manual fallbackToPro as it's handled in the catch block now.

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
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-royal-500 to-royal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-royal-500/30">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Tutor</h1>
                        <p className="text-slate-500">Ask questions, summaries, or explanations</p>
                    </div>
                </div>
                {(query || response) && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2 bg-white dark:bg-dark-surface p-1.5 rounded-xl border border-slate-200 dark:border-dark-border w-fit">
                <button
                    onClick={() => setMode('detailed')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'detailed'
                        ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-bg'
                        }`}
                >
                    <AlignLeft className="w-4 h-4" />
                    Detailed
                </button>
                <button
                    onClick={() => setMode('summary')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'summary'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-bg'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Summary
                </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => setQuery(prompt)}
                        className="px-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:border-royal-300 hover:text-royal-600 transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="card p-6 dark:bg-dark-surface dark:border-dark-border relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-royal-50/50 to-emerald-50/50 dark:from-royal-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask anything about UPSC topics for a ${mode} answer...`}
                    className="w-full h-32 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl p-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500 resize-none transition-shadow"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleAskAI();
                    }}
                />
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-400">Press Ctrl+Enter • {mode === 'summary' ? '~300 words' : 'In-depth'}</span>
                    <button
                        onClick={handleAskAI}
                        disabled={loading || !query.trim()}
                        className="btn-primary px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
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
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Response */}
            {response && (
                <div className="card p-8 animate-fade-in dark:bg-dark-surface dark:border-dark-border">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-dark-border pb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <Bot className="w-5 h-5 text-emerald-500" />
                            AI Answer
                        </h3>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-royal-600 hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-lg transition-colors text-sm"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-strong:text-royal-600 dark:prose-strong:text-royal-400">
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
