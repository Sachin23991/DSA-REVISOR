import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color = 'black',
    trend,
    trendValue,
    sparklineData,
    tooltip,
    onClick
}) {
    // Portfolio-style black/white color scheme
    const colors = {
        black: {
            bg: 'bg-black/5 dark:bg-white/10',
            text: 'text-black dark:text-white',
            line: '#000000'
        },
        muted: {
            bg: 'bg-[#FAFAFA] dark:bg-dark-surface',
            text: 'text-[#71717A] dark:text-dark-muted',
            line: '#71717A'
        }
    };

    const currentColor = colors[color] || colors.black;

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
        if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend === 'up') return 'bg-black/10 text-black dark:bg-white/20 dark:text-white';
        if (trend === 'down') return 'bg-black/5 text-[#71717A] dark:bg-white/10 dark:text-dark-muted';
        return 'bg-black/5 text-[#71717A] dark:bg-white/5 dark:text-dark-muted';
    };

    // Generate sparkline data if not provided
    const chartData = useMemo(() => {
        if (sparklineData) return sparklineData;
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
            className={`card p-6 transition-all duration-300 hover:border-black/20 dark:hover:border-white/20 ${onClick ? 'cursor-pointer' : ''}`}
            title={tooltip}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded border border-black/10 dark:border-white/10 ${currentColor.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${currentColor.text}`} />
                </div>

                {/* Trend Badge - Portfolio Style */}
                {trendValue && (
                    <span className={`text-xs font-light px-2 py-1 rounded flex items-center gap-1 border border-black/10 dark:border-white/10 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {trendValue}
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{value}</h3>
                    <p className="text-sm text-[#71717A] font-light">{label}</p>
                    {subtitle && (
                        <p className="text-xs text-[#71717A]/70 mt-2 pt-2 border-t border-black/5 dark:border-white/5 font-light">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Mini Sparkline - Black/White theme */}
                {chartData && chartData.length > 0 && (
                    <div className="w-20 h-12 ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={currentColor.line}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Progress indicator - Portfolio Style */}
            {typeof value === 'string' && value.includes('/') && (
                <div className="mt-3">
                    <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${parseProgress(value)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-black dark:bg-white"
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
