import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SUBJECT_COLORS = {
    'History': '#f59e0b',
    'Polity': '#3b82f6',
    'Geography': '#10b981',
    'Economics': '#8b5cf6',
    'Ethics': '#ec4899',
    'Science': '#06b6d4',
    'Current Affairs': '#f97316',
    'Environment': '#22c55e',
    'Other': '#64748b'
};

export default function SubjectMastery({ subjects }) {
    if (!subjects || subjects.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-royal-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subject Mastery</h3>
                </div>
                <div className="text-center py-8 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Start studying to see your subject mastery!</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-royal-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subject Mastery</h3>
                </div>
                <span className="text-xs text-slate-400">Based on study time</span>
            </div>

            <div className="space-y-4">
                {subjects.slice(0, 6).map((subject, index) => (
                    <motion.div
                        key={subject.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: SUBJECT_COLORS[subject.name] || SUBJECT_COLORS['Other'] }}
                                />
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {subject.name}
                                </span>
                                {subject.needsRevision && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                        <AlertCircle className="w-3 h-3" />
                                        Needs revision
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-800 dark:text-white">
                                    {subject.mastery}%
                                </span>
                                <span className="text-xs text-slate-400">
                                    {subject.hours}h
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.mastery}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    backgroundColor: SUBJECT_COLORS[subject.name] || SUBJECT_COLORS['Other'],
                                    opacity: subject.mastery < 30 ? 0.6 : 1
                                }}
                            />
                        </div>

                        {/* Hover details */}
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                            <span>{subject.sessions} sessions</span>
                            {subject.lastStudied && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(subject.lastStudied, { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-border">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <div className="w-8 h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full" />
                        <span>Low → High Mastery</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
