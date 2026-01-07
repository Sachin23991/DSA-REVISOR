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

    const getUrgencyColor = (days) => {
        if (days === null) return 'text-slate-400';
        if (days <= 10) return 'text-red-500';
        if (days <= 30) return 'text-yellow-500';
        return 'text-emerald-500';
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
                className="card p-6 bg-gradient-to-r from-royal-50 to-gold-50 dark:from-royal-950/50 dark:to-gold-950/30 border-royal-200 dark:border-royal-800"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-royal-500 to-gold-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">UPSC Goal Tracker</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Stay focused on your target</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit Goals"
                    >
                        <Settings className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Exam Countdown */}
                    <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>Days Until Exam</span>
                        </div>
                        {daysUntilExam !== null ? (
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-bold ${getUrgencyColor(daysUntilExam)}`}>
                                    {daysUntilExam}
                                </span>
                                <span className="text-slate-400 text-sm">days left</span>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">Set your exam date →</p>
                        )}
                        {goals?.targetExamDate && (
                            <p className="text-xs text-slate-400 mt-1">
                                Target: {format(new Date(goals.targetExamDate), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>

                    {/* Score Progress */}
                    <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Score Progress</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-bold text-royal-600 dark:text-royal-400">
                                {goals?.currentScore || 0}
                            </span>
                            <span className="text-slate-400">/ {goals?.targetScore || 150}</span>
                        </div>
                        <div className="relative h-2 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${scoreProgress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-royal-500 to-gold-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{scoreProgress}% of target</p>
                    </div>

                    {/* Daily Goal */}
                    <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                            <Target className="w-4 h-4" />
                            <span>Study Goals</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Daily:</span>
                                <span className="font-bold text-royal-600 dark:text-royal-400">
                                    {goals?.dailyHoursGoal || 6}h
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Weekly:</span>
                                <span className="font-bold text-royal-600 dark:text-royal-400">
                                    {goals?.weeklyHoursGoal || 35}h
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Goals</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-dark-border rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveGoals}
                                className="flex-1 btn-primary px-4 py-2 rounded-xl flex items-center justify-center gap-2"
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
