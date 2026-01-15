import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame, Trophy, Calendar, Star, Zap, Target, Shield, Crown,
    TrendingUp, Clock, Award
} from 'lucide-react';
import { format, differenceInDays, subDays, isSameDay } from 'date-fns';

// Streak milestones with unique badges
const MILESTONES = [
    { days: 3, label: 'Starter', icon: '🌱', message: 'Great start!' },
    { days: 7, label: 'Week Warrior', icon: '⚔️', message: 'One week strong!' },
    { days: 14, label: 'Fortnight Fighter', icon: '🛡️', message: 'Two weeks dedicated!' },
    { days: 21, label: 'Habit Maker', icon: '🎯', message: 'Habit forming!' },
    { days: 30, label: 'Monthly Master', icon: '👑', message: 'A full month!' },
    { days: 50, label: 'Dedication Pro', icon: '💪', message: 'Impressive dedication!' },
    { days: 75, label: 'Elite Student', icon: '🔥', message: 'Elite status!' },
    { days: 100, label: 'Century Champion', icon: '💎', message: 'LEGENDARY!' },
    { days: 150, label: 'Study God', icon: '🏆', message: 'Unstoppable!' },
    { days: 200, label: 'UPSC Warrior', icon: '⭐', message: 'True warrior!' },
    { days: 365, label: 'Year Master', icon: '🎖️', message: 'One whole year!' },
];

// Motivational messages based on streak
const getMotivationalMessage = (streak, studiedToday) => {
    if (!studiedToday && streak > 0) {
        return { text: "⚠️ Don't break your streak! Study today!", urgent: true };
    }
    if (streak === 0) return { text: "Start your journey today! 🚀", urgent: false };
    if (streak === 1) return { text: "Day 1 done! Keep going! 💪", urgent: false };
    if (streak < 7) return { text: `${7 - streak} days to your first badge!`, urgent: false };
    if (streak < 30) return { text: "Building a powerful habit! 🔥", urgent: false };
    if (streak < 100) return { text: "You're in the elite zone! 💎", urgent: false };
    return { text: "LEGENDARY DEDICATION! 🏆", urgent: false };
};

export default function StreakDisplay({ currentStreak = 0, bestStreak = 0, lastStudyDate, logs = [] }) {
    const [showCelebration, setShowCelebration] = useState(false);
    const [pulseStreak, setPulseStreak] = useState(false);

    // Check if studied today
    const studiedToday = useMemo(() => {
        if (!logs || logs.length === 0) return false;
        const today = new Date();
        return logs.some(log => log.date && isSameDay(new Date(log.date), today));
    }, [logs]);

    // Calculate streak heat level (0-5)
    const heatLevel = useMemo(() => {
        if (currentStreak === 0) return 0;
        if (currentStreak < 3) return 1;
        if (currentStreak < 7) return 2;
        if (currentStreak < 14) return 3;
        if (currentStreak < 30) return 4;
        return 5;
    }, [currentStreak]);

    // Current and next milestone
    const { currentMilestone, nextMilestone, progress } = useMemo(() => {
        let current = null;
        let next = MILESTONES[0];

        for (let i = MILESTONES.length - 1; i >= 0; i--) {
            if (currentStreak >= MILESTONES[i].days) {
                current = MILESTONES[i];
                next = MILESTONES[i + 1] || MILESTONES[MILESTONES.length - 1];
                break;
            }
        }

        if (!current) {
            next = MILESTONES[0];
        }

        const prog = current
            ? ((currentStreak - current.days) / (next.days - current.days)) * 100
            : (currentStreak / next.days) * 100;

        return { currentMilestone: current, nextMilestone: next, progress: Math.min(100, prog) };
    }, [currentStreak]);

    // Trigger pulse animation periodically for active streaks
    useEffect(() => {
        if (currentStreak >= 7) {
            const interval = setInterval(() => {
                setPulseStreak(true);
                setTimeout(() => setPulseStreak(false), 1000);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [currentStreak]);

    const motivationalMessage = getMotivationalMessage(currentStreak, studiedToday);

    // Fire particles for high streaks
    const FireParticles = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(heatLevel * 3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-lg"
                    initial={{
                        bottom: 0,
                        left: `${Math.random() * 100}%`,
                        opacity: 0
                    }}
                    animate={{
                        bottom: '100%',
                        opacity: [0, 1, 0],
                        x: [0, (Math.random() - 0.5) * 50]
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                >
                    {['🔥', '✨', '⚡'][Math.floor(Math.random() * 3)]}
                </motion.div>
            ))}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 overflow-hidden relative"
        >
            {/* Background glow effect for high streaks */}
            {heatLevel >= 3 && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-yellow-500/5 dark:from-orange-500/10 dark:via-red-500/10 dark:to-yellow-500/10" />
            )}

            {/* Fire particles */}
            {heatLevel >= 2 && <FireParticles />}

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={pulseStreak ? {
                            scale: [1, 1.3, 1],
                            rotate: [0, -10, 10, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <Flame className={`w-6 h-6 ${heatLevel >= 3 ? 'text-orange-500' : ''}`} />
                    </motion.div>
                    <h3 className="text-lg font-medium">
                        <span className="font-bold">Streak</span>
                    </h3>
                </div>

                {/* Status indicator */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${studiedToday
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}>
                    {studiedToday ? '✓ Studied Today' : '⚠️ Study Today!'}
                </div>
            </div>

            {/* Main Streak Display - Snapchat Style */}
            <div className="relative z-10 text-center py-6">
                <motion.div
                    key={currentStreak}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="relative inline-block"
                >
                    {/* Streak ring */}
                    <div className={`relative w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 ${heatLevel >= 4
                            ? 'border-orange-500 shadow-lg shadow-orange-500/30'
                            : heatLevel >= 2
                                ? 'border-black dark:border-white'
                                : 'border-black/20 dark:border-white/20'
                        }`}>
                        {/* Inner glow */}
                        {heatLevel >= 3 && (
                            <motion.div
                                className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-400/20 to-red-500/20"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}

                        <div className="text-center">
                            <motion.span
                                className="text-5xl font-black block"
                                animate={pulseStreak ? { scale: [1, 1.1, 1] } : {}}
                            >
                                {currentStreak}
                            </motion.span>
                            <span className="text-xs text-[#71717A] uppercase tracking-wider font-medium">
                                days
                            </span>
                        </div>

                        {/* Current milestone badge */}
                        {currentMilestone && (
                            <motion.div
                                className="absolute -top-2 -right-2 text-2xl"
                                animate={{
                                    y: [0, -3, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {currentMilestone.icon}
                            </motion.div>
                        )}
                    </div>

                    {/* Fire emoji for active streaks */}
                    {currentStreak >= 1 && studiedToday && (
                        <motion.div
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                y: [0, -3, 0]
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            🔥
                        </motion.div>
                    )}
                </motion.div>

                {/* Motivational Message */}
                <motion.p
                    key={motivationalMessage.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 text-sm font-medium ${motivationalMessage.urgent
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-[#71717A]'
                        }`}
                >
                    {motivationalMessage.text}
                </motion.p>
            </div>

            {/* Progress to Next Milestone */}
            <div className="relative z-10 mt-4">
                <div className="flex justify-between text-xs text-[#71717A] mb-2 font-light">
                    <span className="flex items-center gap-1">
                        {currentMilestone ? currentMilestone.icon : '🌱'}
                        {currentMilestone?.label || 'Start'}
                    </span>
                    <span className="flex items-center gap-1">
                        {nextMilestone.icon} {nextMilestone.label}
                    </span>
                </div>
                <div className="h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${heatLevel >= 4
                                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500'
                                : 'bg-black dark:bg-white'
                            }`}
                    />
                </div>
                <p className="text-xs text-[#71717A] text-center mt-2 font-light">
                    {nextMilestone.days - currentStreak} days to {nextMilestone.label}
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-black/5 dark:border-white/5 relative z-10">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[#71717A] mb-1">
                        <Star className="w-3 h-3" />
                        <span className="font-light">Best Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{bestStreak || 0}</p>
                    <p className="text-xs text-[#71717A] font-light">days</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[#71717A] mb-1">
                        <Trophy className="w-3 h-3" />
                        <span className="font-light">Badges Earned</span>
                    </div>
                    <p className="text-2xl font-bold">
                        {MILESTONES.filter(m => currentStreak >= m.days).length}
                    </p>
                    <p className="text-xs text-[#71717A] font-light">/ {MILESTONES.length}</p>
                </div>
            </div>

            {/* Milestone Badges */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 relative z-10">
                <p className="text-xs text-[#71717A] mb-3 font-light">Milestone Badges</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {MILESTONES.slice(0, 8).map((milestone, index) => {
                        const isUnlocked = currentStreak >= milestone.days;
                        return (
                            <motion.div
                                key={milestone.days}
                                initial={{ scale: 0 }}
                                animate={{ scale: isUnlocked ? 1 : 0.8 }}
                                whileHover={{ scale: 1.1 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 cursor-pointer transition-all ${isUnlocked
                                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                                        : 'border-black/10 dark:border-white/10 opacity-30 grayscale'
                                    }`}
                                title={`${milestone.label}: ${milestone.days} days - ${milestone.message}`}
                            >
                                {milestone.icon}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
