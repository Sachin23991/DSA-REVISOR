import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Plus,
    Clock,
    BookOpen,
    FileText,
    X,
    Timer,
    Zap
} from 'lucide-react';

export default function QuickActions() {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            icon: Play,
            label: 'Start Session',
            color: 'bg-royal-500 hover:bg-royal-600',
            action: () => navigate('/dashboard/tracker')
        },
        {
            icon: Timer,
            label: 'Quick 15 min',
            color: 'bg-emerald-500 hover:bg-emerald-600',
            action: () => navigate('/dashboard/tracker', { state: { quickSession: 15 } })
        },
        {
            icon: BookOpen,
            label: 'Take Quiz',
            color: 'bg-purple-500 hover:bg-purple-600',
            action: () => navigate('/dashboard/quiz')
        },
        {
            icon: FileText,
            label: 'View Notes',
            color: 'bg-gold-500 hover:bg-gold-600',
            action: () => navigate('/dashboard/notepad')
        }
    ];

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-16 right-0 space-y-3"
                        >
                            {actions.map((action, index) => (
                                <motion.button
                                    key={action.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        action.action();
                                        setIsExpanded(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg ${action.color} transition-all`}
                                >
                                    <action.icon className="w-5 h-5" />
                                    <span className="font-medium whitespace-nowrap">{action.label}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${isExpanded
                        ? 'bg-slate-700 dark:bg-slate-600'
                        : 'bg-gradient-to-r from-royal-600 to-gold-500'
                        }`}
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isExpanded ? (
                            <X className="w-6 h-6 text-white" />
                        ) : (
                            <Zap className="w-6 h-6 text-white" />
                        )}
                    </motion.div>
                </motion.button>
            </div>

            {/* Backdrop when expanded */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExpanded(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Alternative inline quick actions for the dashboard
export function QuickActionBar() {
    const navigate = useNavigate();

    const actions = [
        {
            icon: Play,
            label: 'Start Session',
            color: 'from-emerald-600 to-emerald-500', // Changed to Green
            action: () => navigate('/dashboard/tracker')
        },
        {
            icon: Timer,
            label: 'Quick 15 min',
            color: 'from-emerald-500 to-emerald-400', // Lighter Green
            action: () => navigate('/dashboard/tracker', { state: { quickSession: 15 } })
        },
        {
            icon: BookOpen,
            label: 'Take Quiz',
            color: 'from-purple-500 to-purple-600', // Purple
            action: () => navigate('/dashboard/quiz') // Updated path to new Quiz Page
        },
        {
            icon: FileText,
            label: 'Review Notes',
            color: 'from-amber-500 to-amber-600', // Yellow/Amber
            action: () => navigate('/dashboard/notepad')
        }
    ];

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className={`bg-gradient-to-r ${action.color} text-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-all`}
                    >
                        <action.icon className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm font-medium">{action.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
