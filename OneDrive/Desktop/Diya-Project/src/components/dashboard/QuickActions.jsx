import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    X,
    Timer,
    Zap,
    BookOpen,
    FileText,
    PlusCircle
} from 'lucide-react';

export default function QuickActions() {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            icon: Play,
            label: 'Start Session',
            action: () => navigate('/dashboard/tracker')
        },
        {
            icon: Timer,
            label: 'Quick 15 min',
            action: () => navigate('/dashboard/tracker', { state: { quickSession: 15 } })
        },
        {
            icon: PlusCircle,
            label: 'Log Hours',
            action: () => navigate('/dashboard/tracker', { state: { manualEntry: true } })
        },
        {
            icon: BookOpen,
            label: 'Take Quiz',
            action: () => navigate('/dashboard/quiz')
        },
        {
            icon: FileText,
            label: 'View Notes',
            action: () => navigate('/dashboard/notepad')
        }
    ];

    return (
        <>
            {/* Floating Action Button - Portfolio Style with proper dark mode */}
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
                                    className="flex items-center gap-3 px-4 py-3 rounded bg-white dark:bg-dark-surface text-black dark:text-white border-2 border-black dark:border-white shadow-lg hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
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
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-2 ${isExpanded
                        ? 'bg-white dark:bg-dark-surface border-black dark:border-white text-black dark:text-white'
                        : 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                        }`}
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isExpanded ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Zap className="w-6 h-6" />
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
                        className="fixed inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Alternative inline quick actions - Portfolio Style with dark mode fix
export function QuickActionBar() {
    const navigate = useNavigate();

    const actions = [
        {
            icon: Play,
            label: 'Start Session',
            action: () => navigate('/dashboard/tracker')
        },
        {
            icon: Timer,
            label: 'Quick 15 min',
            action: () => navigate('/dashboard/tracker', { state: { quickSession: 15 } })
        },
        {
            icon: PlusCircle,
            label: 'Log Hours',
            action: () => navigate('/dashboard/tracker', { state: { manualEntry: true } })
        },
        {
            icon: BookOpen,
            label: 'Take Quiz',
            action: () => navigate('/dashboard/quiz')
        },
        {
            icon: FileText,
            label: 'Review Notes',
            action: () => navigate('/dashboard/notepad')
        }
    ];

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-medium">Quick <span className="font-bold">Actions</span></h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="bg-white dark:bg-dark-surface border-2 border-black/10 dark:border-white/20 rounded p-4 text-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all"
                    >
                        <action.icon className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm font-medium">{action.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
