import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color = 'royal',
    trend,
    trendValue,
    sparklineData,
    tooltip,
    onClick
}) {
    const colors = {
        gold: {
            bg: 'bg-gold-50 dark:bg-gold-900/20',
            text: 'text-gold-600 dark:text-gold-400',
            line: '#f59e0b'
        },
        royal: {
            bg: 'bg-royal-50 dark:bg-royal-900/20',
            text: 'text-royal-600 dark:text-royal-400',
            line: '#24875c'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            line: '#10b981'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400',
            line: '#8b5cf6'
        },
        red: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-600 dark:text-red-400',
            line: '#ef4444'
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
        if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend === 'up') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (trend === 'down') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    };

    // Generate sparkline data if not provided
    const chartData = useMemo(() => {
        if (sparklineData) return sparklineData;
        // Generate placeholder data
        return Array.from({ length: 7 }, (_, i) => ({
            value: Math.random() * 10 + 5
        }));
    }, [sparklineData]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`card p-6 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
            title={tooltip}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors[color].bg} flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-6 h-6 ${colors[color].text}`} />
                </div>

                {/* Trend Badge */}
                {trendValue && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {trendValue}
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Mini Sparkline */}
                {chartData && chartData.length > 0 && (
                    <div className="w-20 h-12 ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={colors[color].line}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Progress indicator for goals */}
            {typeof value === 'string' && value.includes('/') && (
                <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${parseProgress(value)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${parseProgress(value) >= 80 ? 'bg-green-500' :
                                    parseProgress(value) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function parseProgress(value) {
    const match = value.match(/(\d+(?:\.\d+)?)\s*[\/h]\s*(\d+(?:\.\d+)?)/);
    if (match) {
        return Math.min(100, (parseFloat(match[1]) / parseFloat(match[2])) * 100);
    }
    return 0;
}
