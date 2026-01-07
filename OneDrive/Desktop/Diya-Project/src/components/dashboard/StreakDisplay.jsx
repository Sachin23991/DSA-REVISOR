import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, Star } from 'lucide-react';

export default function StreakDisplay({ currentStreak, bestStreak, lastStudyDate }) {
    const streakMilestones = [
        { days: 7, label: 'Week Warrior', icon: '⚔️' },
        { days: 14, label: 'Fortnight Fighter', icon: '🛡️' },
        { days: 30, label: 'Monthly Master', icon: '👑' },
        { days: 100, label: 'Century Champion', icon: '💎' }
    ];

    const nextMilestone = streakMilestones.find(m => m.days > currentStreak) || streakMilestones[streakMilestones.length - 1];
    const daysToNextMilestone = nextMilestone.days - currentStreak;

    const getFlameIntensity = () => {
        if (currentStreak >= 30) return 'text-orange-500 animate-pulse';
        if (currentStreak >= 14) return 'text-orange-400';
        if (currentStreak >= 7) return 'text-yellow-500';
        if (currentStreak >= 3) return 'text-yellow-400';
        return 'text-slate-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 overflow-hidden relative"
        >
            {/* Background flame effect for high streaks */}
            {currentStreak >= 7 && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={currentStreak >= 7 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Flame className={`w-6 h-6 ${getFlameIntensity()}`} />
                    </motion.div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Streak</h3>
                </div>
                <Trophy className="w-5 h-5 text-gold-500" />
            </div>

            {/* Main Streak Display */}
            <div className="text-center py-4">
                <motion.div
                    key={currentStreak}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative inline-block"
                >
                    <span className="text-6xl font-bold text-gradient-gold">{currentStreak}</span>
                    <span className="text-lg text-slate-500 dark:text-slate-400 ml-2">days</span>
                </motion.div>

                {currentStreak > 0 && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-slate-500 dark:text-slate-400 mt-2"
                    >
                        🔥 {currentStreak >= 7 ? "You're on fire!" : "Keep it going!"}
                    </motion.p>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-dark-border">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
                        <Star className="w-3 h-3" />
                        Best Streak
                    </div>
                    <p className="text-xl font-bold text-royal-600 dark:text-royal-400">{bestStreak || 0}</p>
                    <p className="text-xs text-slate-400">days</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        Next Milestone
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {nextMilestone.icon}
                    </p>
                    <p className="text-xs text-slate-400">{daysToNextMilestone} days away</p>
                </div>
            </div>

            {/* Milestone Progress */}
            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress to {nextMilestone.label}</span>
                    <span>{currentStreak}/{nextMilestone.days}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentStreak / nextMilestone.days) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-gold-400 to-orange-500 rounded-full"
                    />
                </div>
            </div>

            {/* Achieved Milestones */}
            <div className="flex justify-center gap-2 mt-4">
                {streakMilestones.map((milestone) => (
                    <motion.div
                        key={milestone.days}
                        initial={{ scale: 0 }}
                        animate={{ scale: currentStreak >= milestone.days ? 1 : 0.8 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${currentStreak >= milestone.days
                                ? 'bg-gold-100 dark:bg-gold-900/30'
                                : 'bg-slate-100 dark:bg-dark-border opacity-40'
                            }`}
                        title={`${milestone.label}: ${milestone.days} days`}
                    >
                        {milestone.icon}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
