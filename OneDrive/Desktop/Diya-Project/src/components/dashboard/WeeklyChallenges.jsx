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
                ? 'bg-[#FAFAFA] dark:bg-dark-surface'
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
                    <Swords className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Weekly <span className="font-bold">Challenge</span></h3>
                </div>
                {isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-medium bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        Completed!
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-[#71717A] font-light">
                        <Clock className="w-3 h-3" />
                        {daysLeftInWeek} days left
                    </span>
                )}
            </div>

            {/* Challenge Card - Portfolio Style */}
            <div className="rounded border border-black/5 dark:border-white/5 p-4 bg-white dark:bg-dark-bg">
                <div className="flex items-start gap-4">
                    <span className="text-4xl">{challenge.icon}</span>
                    <div className="flex-1">
                        <p className="font-bold text-lg">
                            {challenge.name}
                        </p>
                        <p className="text-sm text-[#71717A] mt-1 font-light">
                            This week's challenge
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span>
                            <span className="font-bold text-lg">
                                {typeof progress === 'number' ? progress.toFixed(1) : progress}
                            </span>
                            <span className="text-[#71717A] font-light"> / {challenge.target} {challenge.unit}</span>
                        </span>
                        <span className="font-bold">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>

                    <div className="h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-black dark:bg-white"
                        />
                    </div>
                </div>

                {/* CTA */}
                {!isCompleted && (
                    <motion.button
                        whileHover={{ x: 5 }}
                        className="mt-4 text-sm font-medium flex items-center gap-1 hover:underline"
                    >
                        Keep going! <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Reward teaser */}
            <div className="mt-4 text-center">
                <p className="text-xs text-[#71717A] font-light">
                    Complete to earn: <span className="font-bold">🏆 Challenge Master Badge</span>
                </p>
            </div>
        </motion.div>
    );
}
