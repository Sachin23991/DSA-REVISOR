import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../../lib/db';

export default function AchievementBadges({ unlockedAchievements }) {
    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievementId) || []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <h3 className="text-lg font-medium"><span className="font-bold">Achievements</span></h3>
                </div>
                <span className="text-xs text-[#71717A] font-light">
                    {unlockedIds.size}/{ACHIEVEMENTS.length} unlocked
                </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((achievement, index) => {
                    const isUnlocked = unlockedIds.has(achievement.id);

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.1 }}
                            className={`relative aspect-square rounded flex flex-col items-center justify-center p-2 transition-all cursor-pointer group border ${isUnlocked
                                ? 'bg-[#FAFAFA] dark:bg-dark-surface border-black dark:border-white'
                                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-50'
                                }`}
                            title={`${achievement.name}: ${achievement.description}`}
                        >
                            <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                                {achievement.icon}
                            </span>

                            {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-[#71717A]" />
                                </div>
                            )}

                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black dark:bg-white text-white dark:text-black text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                                    <p className="font-bold">{achievement.name}</p>
                                    <p className="text-white/70 dark:text-black/70 text-[10px]">{achievement.description}</p>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-white" />
                            </div>

                            {/* Unlock indicator */}
                            {isUnlocked && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center"
                                >
                                    <span className="text-white dark:text-black text-[8px]">✓</span>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Recent Unlock */}
            {unlockedAchievements && unlockedAchievements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-black/5 dark:border-white/5"
                >
                    <p className="text-xs text-[#71717A] mb-2 font-light">Latest Unlock</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">
                            {ACHIEVEMENTS.find(a => a.id === unlockedAchievements[0]?.achievementId)?.icon || '🏆'}
                        </span>
                        <div>
                            <p className="text-sm font-bold">
                                {ACHIEVEMENTS.find(a => a.id === unlockedAchievements[0]?.achievementId)?.name || 'Achievement'}
                            </p>
                            <p className="text-xs text-[#71717A] font-light">
                                {ACHIEVEMENTS.find(a => a.id === unlockedAchievements[0]?.achievementId)?.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
