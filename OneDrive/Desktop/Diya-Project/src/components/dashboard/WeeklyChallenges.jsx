import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { getWeeklyChallenge } from '../../lib/db';

export default function WeeklyChallenges({ logs, stats }) {
    const challenge = useMemo(() => getWeeklyChallenge(), []);

    // Calculate progress based on challenge type
    const progress = useMemo(() => {
        if (!logs) return 0;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weeklyLogs = logs.filter(l => l.date && new Date(l.date) >= weekStart);

        switch (challenge.unit) {
            case 'hours':
                return weeklyLogs.reduce((acc, l) => acc + (l.durationMinutes || 0) / 60, 0);
            case 'sessions':
                return weeklyLogs.length;
            case 'subjects':
                return new Set(weeklyLogs.map(l => l.subject)).size;
            default:
                return 0;
        }
    }, [logs, challenge]);

    const progressPercent = Math.min(100, (progress / challenge.target) * 100);
    const isCompleted = progressPercent >= 100;

    const daysLeftInWeek = 7 - new Date().getDay();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-6 overflow-hidden relative ${isCompleted
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800'
                    : ''
                }`}
        >
            {/* Completion confetti effect */}
            {isCompleted && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-2 text-2xl animate-bounce">🎉</div>
                    <div className="absolute top-4 right-4 text-xl animate-bounce delay-100">✨</div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Swords className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : 'text-royal-500'}`} />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weekly Challenge</h3>
                </div>
                {isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Completed!
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {daysLeftInWeek} days left
                    </span>
                )}
            </div>

            {/* Challenge Card */}
            <div className={`rounded-xl p-4 ${isCompleted
                    ? 'bg-white/50 dark:bg-dark-surface/50'
                    : 'bg-slate-50 dark:bg-dark-bg'
                }`}>
                <div className="flex items-start gap-4">
                    <span className="text-4xl">{challenge.icon}</span>
                    <div className="flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-lg">
                            {challenge.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            This week's challenge
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-lg">
                                {typeof progress === 'number' ? progress.toFixed(1) : progress}
                            </span>
                            <span className="text-slate-400"> / {challenge.target} {challenge.unit}</span>
                        </span>
                        <span className={`font-bold ${progressPercent >= 100 ? 'text-emerald-500' :
                                progressPercent >= 70 ? 'text-yellow-500' : 'text-slate-400'
                            }`}>
                            {Math.round(progressPercent)}%
                        </span>
                    </div>

                    <div className="h-3 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${isCompleted
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                    : 'bg-gradient-to-r from-royal-500 to-gold-500'
                                }`}
                        />
                    </div>
                </div>

                {/* CTA */}
                {!isCompleted && (
                    <motion.button
                        whileHover={{ x: 5 }}
                        className="mt-4 text-sm font-medium text-royal-600 dark:text-royal-400 flex items-center gap-1"
                    >
                        Keep going! <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Reward teaser */}
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                    Complete to earn: <span className="font-bold text-gold-500">🏆 Challenge Master Badge</span>
                </p>
            </div>
        </motion.div>
    );
}
