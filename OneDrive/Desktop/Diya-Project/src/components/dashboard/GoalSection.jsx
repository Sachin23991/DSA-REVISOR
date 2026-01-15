import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, Settings, X, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { saveUserGoals } from '../../lib/db';

export default function GoalSection({ user, goals, onGoalsUpdate }) {
    const [showSettings, setShowSettings] = useState(false);
    const [editGoals, setEditGoals] = useState({
        targetExamDate: goals?.targetExamDate || '',
        targetScore: goals?.targetScore || 150,
        currentScore: goals?.currentScore || 0,
        dailyHoursGoal: goals?.dailyHoursGoal || 6,
        weeklyHoursGoal: goals?.weeklyHoursGoal || 35
    });

    const daysUntilExam = goals?.targetExamDate
        ? differenceInDays(new Date(goals.targetExamDate), new Date())
        : null;

    const scoreProgress = goals?.targetScore
        ? Math.min(100, Math.round((goals.currentScore / goals.targetScore) * 100))
        : 0;

    const getUrgencyText = (days) => {
        if (days === null) return 'text-[#71717A]';
        if (days <= 10) return 'font-bold';
        if (days <= 30) return 'font-bold';
        return 'font-bold';
    };

    const handleSaveGoals = async () => {
        await saveUserGoals(user.uid, editGoals);
        onGoalsUpdate?.(editGoals);
        setShowSettings(false);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 bg-[#FAFAFA] dark:bg-dark-surface border-black/10 dark:border-dark-border"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded flex items-center justify-center">
                            <Target className="w-6 h-6 text-white dark:text-black" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium">UPSC Goal <span className="font-bold">Tracker</span></h2>
                            <p className="text-sm text-[#71717A] font-light">Stay focused on your target</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors border border-black/10 dark:border-white/10"
                        title="Edit Goals"
                    >
                        <Settings className="w-5 h-5 text-[#71717A]" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Exam Countdown */}
                    <div className="bg-white dark:bg-dark-bg rounded border border-black/5 dark:border-white/5 p-4">
                        <div className="flex items-center gap-2 text-sm text-[#71717A] mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-light">Days Until Exam</span>
                        </div>
                        {daysUntilExam !== null ? (
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl ${getUrgencyText(daysUntilExam)}`}>
                                    {daysUntilExam}
                                </span>
                                <span className="text-[#71717A] text-sm font-light">days left</span>
                            </div>
                        ) : (
                            <p className="text-[#71717A] text-sm font-light">Set your exam date →</p>
                        )}
                        {goals?.targetExamDate && (
                            <p className="text-xs text-[#71717A] mt-1 font-light">
                                Target: {format(new Date(goals.targetExamDate), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>

                    {/* Score Progress */}
                    <div className="bg-white dark:bg-dark-bg rounded border border-black/5 dark:border-white/5 p-4">
                        <div className="flex items-center gap-2 text-sm text-[#71717A] mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-light">Score Progress</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-bold">
                                {goals?.currentScore || 0}
                            </span>
                            <span className="text-[#71717A] font-light">/ {goals?.targetScore || 150}</span>
                        </div>
                        <div className="relative h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${scoreProgress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-black dark:bg-white rounded-full"
                            />
                        </div>
                        <p className="text-xs text-[#71717A] mt-1 font-light">{scoreProgress}% of target</p>
                    </div>

                    {/* Daily Goal */}
                    <div className="bg-white dark:bg-dark-bg rounded border border-black/5 dark:border-white/5 p-4">
                        <div className="flex items-center gap-2 text-sm text-[#71717A] mb-2">
                            <Target className="w-4 h-4" />
                            <span className="font-light">Study Goals</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#71717A] font-light">Daily:</span>
                                <span className="font-bold">
                                    {goals?.dailyHoursGoal || 6}h
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#71717A] font-light">Weekly:</span>
                                <span className="font-bold">
                                    {goals?.weeklyHoursGoal || 35}h
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Settings Modal - Portfolio Style */}
            {showSettings && (
                <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full p-6 border border-black/10 dark:border-white/10"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-medium">Edit <span className="font-bold">Goals</span></h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded border border-black/10 dark:border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-normal mb-1">
                                    Target Exam Date
                                </label>
                                <input
                                    type="date"
                                    value={editGoals.targetExamDate}
                                    onChange={(e) => setEditGoals({ ...editGoals, targetExamDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-normal mb-1">
                                        Current Score
                                    </label>
                                    <input
                                        type="number"
                                        value={editGoals.currentScore}
                                        onChange={(e) => setEditGoals({ ...editGoals, currentScore: parseInt(e.target.value) || 0 })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-normal mb-1">
                                        Target Score
                                    </label>
                                    <input
                                        type="number"
                                        value={editGoals.targetScore}
                                        onChange={(e) => setEditGoals({ ...editGoals, targetScore: parseInt(e.target.value) || 150 })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-normal mb-1">
                                        Daily Hours Goal
                                    </label>
                                    <input
                                        type="number"
                                        value={editGoals.dailyHoursGoal}
                                        onChange={(e) => setEditGoals({ ...editGoals, dailyHoursGoal: parseInt(e.target.value) || 6 })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-normal mb-1">
                                        Weekly Hours Goal
                                    </label>
                                    <input
                                        type="number"
                                        value={editGoals.weeklyHoursGoal}
                                        onChange={(e) => setEditGoals({ ...editGoals, weeklyHoursGoal: parseInt(e.target.value) || 35 })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 btn-outline px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveGoals}
                                className="flex-1 btn-primary px-4 py-2 rounded flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Save Goals
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
