import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SubjectMastery({ subjects }) {
    if (!subjects || subjects.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Subject <span className="font-bold">Mastery</span></h3>
                </div>
                <div className="text-center py-8 text-[#71717A]">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-light">Start studying to see your subject mastery!</p>
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
                    <BookOpen className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Subject <span className="font-bold">Mastery</span></h3>
                </div>
                <span className="text-xs text-[#71717A] font-light">Based on study time</span>
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
                                <span className="w-3 h-3 rounded-full bg-black dark:bg-white" />
                                <span className="font-medium">
                                    {subject.name}
                                </span>
                                {subject.needsRevision && (
                                    <span className="flex items-center gap-1 text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border border-black/10 dark:border-white/10">
                                        <AlertCircle className="w-3 h-3" />
                                        Needs revision
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold">
                                    {subject.mastery}%
                                </span>
                                <span className="text-xs text-[#71717A] font-light">
                                    {subject.hours}h
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar - Portfolio Style */}
                        <div className="relative h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.mastery}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 rounded-full bg-black dark:bg-white"
                            />
                        </div>

                        {/* Hover details */}
                        <div className="flex items-center justify-between mt-1 text-xs text-[#71717A] font-light">
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
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1 text-xs text-[#71717A] font-light">
                        <div className="w-8 h-2 bg-gradient-to-r from-black/20 to-black dark:from-white/20 dark:to-white rounded-full" />
                        <span>Low → High Mastery</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
