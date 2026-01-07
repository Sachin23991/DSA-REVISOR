import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InsightCards({ insights }) {
    const navigate = useNavigate();

    const getInsightStyle = (type) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
                    border: 'border-amber-200 dark:border-amber-800',
                    icon: AlertTriangle,
                    iconColor: 'text-amber-500'
                };
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    icon: CheckCircle,
                    iconColor: 'text-emerald-500'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
                    border: 'border-blue-200 dark:border-blue-800',
                    icon: Info,
                    iconColor: 'text-blue-500'
                };
        }
    };

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
                <Lightbulb className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Smart Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, index) => {
                    const style = getInsightStyle(insight.type);
                    const IconComponent = style.icon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`${style.bg} ${style.border} border rounded-xl p-4 flex items-start gap-3`}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                <span className="text-2xl">{insight.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                                    {insight.text}
                                </p>
                                {insight.action && (
                                    <button
                                        onClick={() => handleAction(insight.action)}
                                        className="mt-2 text-xs font-semibold text-royal-600 dark:text-royal-400 hover:text-royal-700 dark:hover:text-royal-300 flex items-center gap-1 transition-colors"
                                    >
                                        {insight.action}
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
