import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logStudySession, subscribeToRecentLogs } from '../lib/db';
import { Play, Pause, Square, RotateCcw, Target, PenLine, Clock, BookOpen, Calendar, ChevronDown, ChevronUp, PlusCircle, Save } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../components/ui/Toast';

export default function Tracker() {
    const { user } = useAuth();
    const [mode, setMode] = useState('stopwatch'); // 'stopwatch', 'pomodoro', 'manual'
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    // Manual entry state
    const [manualHours, setManualHours] = useState('');
    const [manualMinutes, setManualMinutes] = useState('');
    const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const location = useLocation();

    useEffect(() => {
        if (location.state?.quickSession) {
            setMode('pomodoro');
            setTimeLeft(location.state.quickSession * 60);
            setIsRunning(true);
            setSubject('GS1');
            setTopic('Quick Revision');
            window.history.replaceState({}, document.title);
        }
        if (location.state?.manualEntry) {
            setMode('manual');
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [subject, setSubject] = useState('GS1');
    const [topic, setTopic] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');

    const [recentSessions, setRecentSessions] = useState([]);
    const [showHistory, setShowHistory] = useState(true);

    const timerRef = useRef(null);

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
                } else if (mode === 'pomodoro') {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            setIsRunning(false);
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

        await saveSession(duration, new Date().toISOString());
        setElapsed(0);
        setTimeLeft(25 * 60);
        setTopic('');
        setSessionNotes('');
    };

    const handleManualSave = async () => {
        const hours = parseInt(manualHours) || 0;
        const minutes = parseInt(manualMinutes) || 0;
        const totalMinutes = hours * 60 + minutes;

        if (totalMinutes < 1) {
            toast.warning('Please enter at least 1 minute of study time');
            return;
        }

        if (totalMinutes > 24 * 60) {
            toast.warning('Maximum 24 hours per entry allowed');
            return;
        }

        // Create timestamp for the selected date
        const selectedDate = new Date(manualDate);
        selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        await saveSession(totalMinutes, selectedDate.toISOString());

        // Reset manual entry fields
        setManualHours('');
        setManualMinutes('');
        setManualDate(format(new Date(), 'yyyy-MM-dd'));
        setTopic('');
        setSessionNotes('');
    };

    const saveSession = async (duration, timestamp) => {
        const sessionData = {
            subject,
            topic: topic || 'General Study',
            notes: sessionNotes,
            durationMinutes: duration,
            mode: mode,
            timestamp: timestamp
        };

        try {
            const success = await logStudySession(user.uid, sessionData);
            if (success) {
                toast.success(`Session saved! ${duration} minutes logged 📚`);
            }
        } catch (error) {
            toast.error('Failed to save session');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium">Study <span className="font-bold">Tracker</span></h1>
                    <p className="text-[#71717A] font-light">Track your focus sessions or log study hours manually</p>
                </div>

                {/* Mode Toggle - Portfolio Style with proper dark mode */}
                <div className="bg-[#FAFAFA] dark:bg-dark-surface p-1 rounded border border-black/10 dark:border-white/10 flex flex-wrap gap-1">
                    <button
                        onClick={() => { setIsRunning(false); setMode('stopwatch'); }}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${mode === 'stopwatch'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        Stopwatch
                    </button>
                    <button
                        onClick={() => { setIsRunning(false); setMode('pomodoro'); }}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${mode === 'pomodoro'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        Pomodoro
                    </button>
                    <button
                        onClick={() => { setIsRunning(false); setMode('manual'); }}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-1 ${mode === 'manual'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        <PlusCircle className="w-4 h-4" />
                        Log Hours
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Timer / Manual Entry Card */}
                <motion.div
                    className="card p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {mode === 'manual' ? (
                        /* Manual Entry UI */
                        <div className="w-full max-w-sm space-y-6">
                            <div className="text-center mb-4">
                                <PlusCircle className="w-12 h-12 mx-auto mb-3 text-black dark:text-white" />
                                <h3 className="text-xl font-medium">Log Study <span className="font-bold">Hours</span></h3>
                                <p className="text-[#71717A] text-sm font-light mt-1">
                                    Add study time you completed offline
                                </p>
                            </div>

                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm text-[#71717A] mb-1 font-light">Date</label>
                                <input
                                    type="date"
                                    value={manualDate}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    className="input-field text-center"
                                />
                            </div>

                            {/* Time Input */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[#71717A] mb-1 font-light">Hours</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={manualHours}
                                        onChange={(e) => setManualHours(e.target.value)}
                                        placeholder="0"
                                        className="input-field text-center text-2xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#71717A] mb-1 font-light">Minutes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={manualMinutes}
                                        onChange={(e) => setManualMinutes(e.target.value)}
                                        placeholder="0"
                                        className="input-field text-center text-2xl font-bold"
                                    />
                                </div>
                            </div>

                            <p className="text-center text-[#71717A] text-sm font-light">
                                Total: <span className="font-bold text-black dark:text-white">
                                    {parseInt(manualHours || 0)}h {parseInt(manualMinutes || 0)}m
                                </span>
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleManualSave}
                                className="w-full btn-primary py-4 rounded font-medium text-lg flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Save Study Hours
                            </motion.button>
                        </div>
                    ) : (
                        /* Timer UI */
                        <>
                            {/* Background Ring Animation */}
                            {isRunning && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                    <div className="w-64 h-64 rounded-full border-[20px] border-black dark:border-white animate-ping" />
                                </div>
                            )}

                            <motion.div
                                className={`text-7xl font-bold mb-8 z-10 tracking-tight ${isRunning ? 'text-black dark:text-white' : 'text-[#71717A]'}`}
                                key={mode === 'stopwatch' ? elapsed : timeLeft}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                            >
                                {mode === 'stopwatch' ? formatTime(elapsed) : formatTime(timeLeft)}
                            </motion.div>

                            <div className="flex gap-4 z-10">
                                {!isRunning ? (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsRunning(true)}
                                        className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg border-2 border-black dark:border-white"
                                    >
                                        <Play className="w-8 h-8 ml-1" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsRunning(false)}
                                        className="w-16 h-16 bg-[#71717A] rounded-full flex items-center justify-center text-white shadow-lg"
                                    >
                                        <Pause className="w-8 h-8" />
                                    </motion.button>
                                )}

                                {(elapsed > 0 || (mode === 'pomodoro' && timeLeft < 25 * 60)) && !isRunning && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStop}
                                        className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg border-2 border-black dark:border-white"
                                        title="Finish & Save"
                                    >
                                        <Square className="w-6 h-6" />
                                    </motion.button>
                                )}

                                {!isRunning && (elapsed > 0 || (mode === 'pomodoro' && timeLeft < 25 * 60)) && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setElapsed(0); setTimeLeft(25 * 60); }}
                                        className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center text-black dark:text-white border-2 border-black/10 dark:border-white/10"
                                        title="Reset"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                    </motion.button>
                                )}
                            </div>

                            <p className="mt-8 text-[#71717A] text-sm font-light">
                                {isRunning ? 'Focus Mode ON 🎯' : 'Ready to start?'}
                            </p>
                        </>
                    )}
                </motion.div>

                {/* Session Details - Portfolio Style */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Session <span className="font-bold">Goal</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#71717A] mb-1 font-light">Subject</label>
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
                                    <option value="Current Affairs">Current Affairs</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-[#71717A] mb-1 font-light">Topic</label>
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

                    <div className="card p-6 flex-1">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <PenLine className="w-5 h-5" />
                            Session <span className="font-bold">Notes</span>
                        </h3>
                        <textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Jot down quick thoughts during your session..."
                            maxLength={500}
                            className="input-field h-32 resize-none"
                        />
                        <p className="text-xs text-[#71717A] mt-1 font-light">{sessionNotes.length}/500</p>
                    </div>
                </div>
            </div>

            {/* Session History - Portfolio Style */}
            <div className="card overflow-hidden">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[#FAFAFA] dark:hover:bg-dark-surface transition-colors"
                >
                    <h3 className="font-medium flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent <span className="font-bold">Sessions</span>
                        <span className="text-sm font-light text-[#71717A]">({recentSessions.length})</span>
                    </h3>
                    {showHistory ? (
                        <ChevronUp className="w-5 h-5 text-[#71717A]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[#71717A]" />
                    )}
                </button>

                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t border-black/5 dark:border-white/5 overflow-hidden"
                        >
                            {recentSessions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <BookOpen className="w-12 h-12 text-[#71717A]/30 mx-auto mb-3" />
                                    <p className="text-[#71717A] font-light">No study sessions yet. Start your first session!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {recentSessions.map((session, index) => (
                                        <motion.div
                                            key={session.id}
                                            className="p-4 hover:bg-[#FAFAFA] dark:hover:bg-dark-surface transition-colors"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium border border-black/10 dark:border-white/10 text-black dark:text-white">
                                                            {session.subject}
                                                        </span>
                                                        <span className="font-medium text-black dark:text-white truncate">
                                                            {session.topic || 'General Study'}
                                                        </span>
                                                        {session.mode === 'manual' && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/10 text-[#71717A]">
                                                                Manual
                                                            </span>
                                                        )}
                                                    </div>
                                                    {session.notes && (
                                                        <p className="text-sm text-[#71717A] line-clamp-2 mt-1 font-light">
                                                            {session.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-lg font-bold text-black dark:text-white">
                                                        {session.durationMinutes >= 60
                                                            ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m`
                                                            : `${session.durationMinutes}m`
                                                        }
                                                    </div>
                                                    <div className="text-xs text-[#71717A] flex items-center gap-1 justify-end font-light">
                                                        <Calendar className="w-3 h-3" />
                                                        {session.timestamp
                                                            ? formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })
                                                            : 'Recently'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
