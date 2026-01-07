import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logStudySession, subscribeToRecentLogs } from '../lib/db';
import { Play, Pause, Square, RotateCcw, Target, PenLine, Clock, BookOpen, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from '../components/ui/Toast';

export default function Tracker() {
    const { user } = useAuth();
    const [mode, setMode] = useState('stopwatch'); // 'stopwatch' or 'pomodoro'
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0); // in seconds
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins for Pomodoro

    const location = useLocation();

    // Auto-start if quick session
    useEffect(() => {
        if (location.state?.quickSession) {
            setMode('pomodoro');
            setTimeLeft(location.state.quickSession * 60);
            setIsRunning(true);
            setSubject('GS1'); // Default
            setTopic('Quick Revision');
            // Clear state so it doesn't restart on refresh (optional but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [subject, setSubject] = useState('GS1');
    const [topic, setTopic] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');

    // Session history
    const [recentSessions, setRecentSessions] = useState([]);
    const [showHistory, setShowHistory] = useState(true);

    const timerRef = useRef(null);

    // Subscribe to recent logs
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToRecentLogs(user.uid, 10, (logs) => {
            setRecentSessions(logs);
        });
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (mode === 'stopwatch') {
                    setElapsed(prev => prev + 1);
                } else {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            setIsRunning(false);
                            // Notify user
                            toast.success('Pomodoro complete! Time for a break 🎉');
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, mode]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = async () => {
        setIsRunning(false);

        // Calculate total duration in minutes
        let duration = 0;
        if (mode === 'stopwatch') {
            duration = Math.floor(elapsed / 60);
        } else {
            duration = Math.floor((25 * 60 - timeLeft) / 60);
        }

        if (duration < 1) {
            toast.warning('Session too short to save (minimum 1 minute)');
            return;
        }

        const sessionData = {
            subject,
            topic: topic || 'General Study',
            notes: sessionNotes,
            durationMinutes: duration,
            mode: mode,
            timestamp: new Date().toISOString()
        };

        try {
            const success = await logStudySession(user.uid, sessionData);
            if (success) {
                toast.success(`Session saved! ${duration} minutes logged 📚`);
                // Reset
                setElapsed(0);
                setTimeLeft(25 * 60);
                setTopic('');
                setSessionNotes('');
            }
        } catch (error) {
            toast.error('Failed to save session');
        }
    };

    const getSubjectColor = (subj) => {
        const colors = {
            'GS1': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'GS2': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'GS3': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'GS4': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'Optional': 'bg-royal-100 text-royal-700 dark:bg-royal-900/30 dark:text-royal-400',
            'Essay': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        };
        return colors[subj] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Study Tracker</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track your focus sessions</p>
                </div>

                {/* Mode Toggle */}
                <div className="bg-white dark:bg-dark-surface p-1 rounded-xl border border-slate-200 dark:border-dark-border flex">
                    <button
                        onClick={() => { setIsRunning(false); setMode('stopwatch'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'stopwatch'
                            ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                            : 'text-slate-500 hover:text-royal-600'
                            }`}
                    >
                        Stopwatch
                    </button>
                    <button
                        onClick={() => { setIsRunning(false); setMode('pomodoro'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'pomodoro'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'text-slate-500 hover:text-emerald-600'
                            }`}
                    >
                        Pomodoro (25m)
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Timer Card */}
                <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-white dark:bg-dark-surface dark:border-dark-border">
                    {/* Background Ring Animation */}
                    {isRunning && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                            <div className="w-64 h-64 rounded-full border-[20px] border-royal-500 animate-ping" />
                        </div>
                    )}

                    <div className={`text-7xl font-mono font-bold mb-8 z-10 ${isRunning ? 'text-royal-600 dark:text-royal-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                        {mode === 'stopwatch' ? formatTime(elapsed) : formatTime(timeLeft)}
                    </div>

                    <div className="flex gap-4 z-10">
                        {!isRunning ? (
                            <button
                                onClick={() => setIsRunning(true)}
                                className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all"
                            >
                                <Play className="w-8 h-8 ml-1" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsRunning(false)}
                                className="w-16 h-16 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/30 hover:scale-110 transition-all"
                            >
                                <Pause className="w-8 h-8" />
                            </button>
                        )}

                        {(elapsed > 0 || (mode === 'pomodoro' && timeLeft < 25 * 60)) && !isRunning && (
                            <button
                                onClick={handleStop}
                                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:scale-110 transition-all"
                                title="Finish & Save"
                            >
                                <Square className="w-6 h-6" />
                            </button>
                        )}

                        {!isRunning && (elapsed > 0 || (mode === 'pomodoro' && timeLeft < 25 * 60)) && (
                            <button
                                onClick={() => { setElapsed(0); setTimeLeft(25 * 60); }}
                                className="w-16 h-16 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:scale-110 transition-all"
                                title="Reset"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    <p className="mt-8 text-slate-500 dark:text-slate-400 text-sm">
                        {isRunning ? 'Focus Mode ON 🎯' : 'Ready to start?'}
                    </p>
                </div>

                {/* Session Details */}
                <div className="space-y-6">
                    <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-gold-500" />
                            Session Goal
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="input-field"
                                    disabled={isRunning}
                                >
                                    <option value="GS1">GS1 - History & Culture</option>
                                    <option value="GS2">GS2 - Polity & IR</option>
                                    <option value="GS3">GS3 - Economy & Environment</option>
                                    <option value="GS4">GS4 - Ethics</option>
                                    <option value="Optional">Optional Subject</option>
                                    <option value="Essay">Essay Writing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Fundamental Rights"
                                    maxLength={100}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 dark:bg-dark-surface dark:border-dark-border flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <PenLine className="w-5 h-5 text-royal-500" />
                            Session Notes
                        </h3>
                        <textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Jot down quick thoughts during your session..."
                            maxLength={500}
                            className="w-full h-32 p-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-500 resize-none text-slate-700 dark:text-slate-200"
                        />
                        <p className="text-xs text-slate-400 mt-1">{sessionNotes.length}/500</p>
                    </div>
                </div>
            </div>

            {/* Session History */}
            <div className="card dark:bg-dark-surface dark:border-dark-border overflow-hidden">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
                >
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-royal-500" />
                        Recent Sessions
                        <span className="text-sm font-normal text-slate-500">({recentSessions.length})</span>
                    </h3>
                    {showHistory ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </button>

                {showHistory && (
                    <div className="border-t border-slate-100 dark:border-dark-border">
                        {recentSessions.length === 0 ? (
                            <div className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400">No study sessions yet. Start your first session!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-dark-border">
                                {recentSessions.map((session) => (
                                    <div key={session.id} className="p-4 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getSubjectColor(session.subject)}`}>
                                                        {session.subject}
                                                    </span>
                                                    <span className="text-slate-800 dark:text-white font-medium truncate">
                                                        {session.topic || 'General Study'}
                                                    </span>
                                                </div>
                                                {session.notes && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                                        {session.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-lg font-bold text-slate-800 dark:text-white">
                                                    {session.durationMinutes}m
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                                                    <Calendar className="w-3 h-3" />
                                                    {session.timestamp
                                                        ? formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })
                                                        : 'Recently'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
