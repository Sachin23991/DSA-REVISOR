import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InsightCards({ insights }) {
    const navigate = useNavigate();

    const handleAction = (action) => {
        if (action === 'Start Session' || action === 'Study Now') {
            navigate('/tracker');
        } else if (action === 'Review') {
            navigate('/notepad');
        }
    };

    if (!insights || insights.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" />
                <h3 className="text-lg font-medium">Smart <span className="font-bold">Insights</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[#FAFAFA] dark:bg-dark-surface border border-black/5 dark:border-white/5 rounded p-4 flex items-start gap-3 hover:border-black/10 dark:hover:border-white/10 transition-all"
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            <span className="text-2xl">{insight.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-light leading-relaxed">
                                {insight.text}
                            </p>
                            {insight.action && (
                                <button
                                    onClick={() => handleAction(insight.action)}
                                    className="mt-2 text-xs font-medium hover:underline flex items-center gap-1 transition-colors"
                                >
                                    {insight.action}
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
