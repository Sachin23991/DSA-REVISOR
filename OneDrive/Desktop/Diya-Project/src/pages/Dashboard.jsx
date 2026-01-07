import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    subscribeToUserStats,
    subscribeToRecentLogs,
    subscribeToUserGoals,
    subscribeToAchievements,
    subscribeToQuizResults, // New subscription
    analyzeSubjectPerformance,
    generateInsights
} from '../lib/db';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, BarChart, Bar // Added BarChart components
} from 'recharts';
import { Clock, Flame, Target, BookOpen, TrendingUp, Calendar, ArrowRight, Info } from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Import new dashboard components
import GoalSection from '../components/dashboard/GoalSection';
import StatCard from '../components/dashboard/StatCard';
import InsightCards from '../components/dashboard/InsightCards';
import SubjectMastery from '../components/dashboard/SubjectMastery';
import StreakDisplay from '../components/dashboard/StreakDisplay';
import AchievementBadges from '../components/dashboard/AchievementBadges';
import WeeklyChallenges from '../components/dashboard/WeeklyChallenges';
import QuickActions, { QuickActionBar } from '../components/dashboard/QuickActions';

// Loading skeleton component
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-slate-200 dark:bg-dark-border rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 bg-slate-200 dark:bg-dark-border rounded-2xl" />
                ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-96 bg-slate-200 dark:bg-dark-border rounded-2xl" />
                <div className="h-96 bg-slate-200 dark:bg-dark-border rounded-2xl" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [goals, setGoals] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [quizResults, setQuizResults] = useState([]); // New state
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        if (!user) return;

        const unsubStats = subscribeToUserStats(user.uid, (data) => {
            setStats(data || {});
            setLoading(false);
        });
        const unsubLogs = subscribeToRecentLogs(user.uid, 100, (data) => setLogs(data));
        const unsubGoals = subscribeToUserGoals(user.uid, (data) => setGoals(data));
        const unsubAchievements = subscribeToAchievements(user.uid, (data) => setAchievements(data));

        return () => {
            unsubStats();
            unsubLogs();
            unsubGoals();
            unsubAchievements();
        };
    }, [user]);

    // Use real data
    const hasData = logs.length > 0;

    // Weekly data for chart
    const weeklyData = useMemo(() => {
        const daysCount = timeRange === '30d' ? 30 : 7;
        const days = [];
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = subDays(new Date(), i);
            const dayLabel = format(d, daysCount > 7 ? 'MMM d' : 'EEE');
            const dayLogs = logs.filter(l => l.date && isSameDay(parseISO(l.date), d));
            const totalHours = dayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0) / 60, 0);
            days.push({
                name: dayLabel,
                hours: parseFloat(totalHours.toFixed(1)),
                target: goals?.dailyHoursGoal || 6
            });
        }
        return days;
    }, [logs, timeRange, goals]);

    // Subject analysis
    const subjectAnalysis = useMemo(() => {
        return analyzeSubjectPerformance(logs);
    }, [logs]);

    // Generate insights
    const insights = useMemo(() => {
        return generateInsights(stats, logs, goals);
    }, [stats, logs, goals]);

    // Today's stats
    const todayHours = useMemo(() => {
        const todayLogs = logs.filter(l => l.date && isSameDay(parseISO(l.date), new Date()));
        return todayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0) / 60, 0);
    }, [logs]);

    // Weekly stats with comparison
    const weeklyStats = useMemo(() => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setMilliseconds(-1);

        const thisWeekLogs = logs.filter(l => l.date && new Date(l.date) >= thisWeekStart);
        const lastWeekLogs = logs.filter(l => {
            if (!l.date) return false;
            const date = new Date(l.date);
            return date >= lastWeekStart && date < thisWeekStart;
        });

        const thisWeekHours = thisWeekLogs.reduce((acc, l) => acc + (l.durationMinutes || 0) / 60, 0);
        const lastWeekHours = lastWeekLogs.reduce((acc, l) => acc + (l.durationMinutes || 0) / 60, 0);

        const percentChange = lastWeekHours > 0
            ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100)
            : thisWeekHours > 0 ? 100 : 0;

        return { thisWeekHours, lastWeekHours, percentChange };
    }, [logs]);

    // Sparkline data for stat cards
    const sparklineData = useMemo(() => {
        return weeklyData.slice(-7).map(d => ({ value: d.hours }));
    }, [weeklyData]);

    if (loading) {
        return (
            <div className="pb-12">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-800 dark:text-white">
                        <span className="text-gradient-royal">Dashboard</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Overview of your progress on {format(new Date(), 'MMMM d, yyyy')}
                    </p>
                </div>
                {!hasData && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 text-gold-700 dark:text-gold-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <Info className="w-4 h-4" />
                        <span>Start tracking to see real stats!</span>
                    </motion.div>
                )}
            </div>

            {/* Goal Section - Priority 1 */}
            <GoalSection
                user={user}
                goals={goals}
                onGoalsUpdate={setGoals}
            />

            {/* Smart Insights - Priority 1 */}
            <InsightCards insights={insights} />

            {/* Quick Actions Bar - Priority 4 */}
            <QuickActionBar />

            {/* Stats Cards - Priority 2 Enhanced */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${stats?.currentStreak || 0} Days`}
                    subtitle={`Best: ${stats?.bestStreak || 0} days`}
                    color="gold"
                    trend={stats?.currentStreak > 0 ? 'up' : 'neutral'}
                    trendValue={stats?.currentStreak > 0 ? '+1 today' : null}
                    sparklineData={null}
                    tooltip="Number of consecutive days you've studied"
                />
                <StatCard
                    icon={Clock}
                    label="Today's Focus"
                    value={`${todayHours.toFixed(1)}h / ${goals?.dailyHoursGoal || 6}h`}
                    subtitle={`${Math.round((todayHours / (goals?.dailyHoursGoal || 6)) * 100)}% of daily goal`}
                    color="royal"
                    trend={todayHours >= (goals?.dailyHoursGoal || 6) ? 'up' : todayHours > 0 ? 'neutral' : 'down'}
                    trendValue={todayHours >= (goals?.dailyHoursGoal || 6) ? 'Goal met!' : null}
                    sparklineData={sparklineData}
                    tooltip="Total focused study time today vs your daily goal"
                />
                <StatCard
                    icon={TrendingUp}
                    label="This Week"
                    value={`${weeklyStats.thisWeekHours.toFixed(1)}h`}
                    subtitle={`Goal: ${goals?.weeklyHoursGoal || 35}h`}
                    color="emerald"
                    trend={weeklyStats.percentChange >= 0 ? 'up' : 'down'}
                    trendValue={`${weeklyStats.percentChange >= 0 ? '+' : ''}${weeklyStats.percentChange}% vs last week`}
                    sparklineData={sparklineData}
                    tooltip="Total study hours this week with comparison to last week"
                />
                <StatCard
                    icon={BookOpen}
                    label="Total Sessions"
                    value={stats?.totalSessions || 0}
                    subtitle={`${(stats?.totalStudyHours || 0).toFixed(0)}h lifetime`}
                    color="purple"
                    trend="neutral"
                    tooltip="Total study sessions logged since you started"
                />
            </div>

            {/* Charts Row - Priority 2 Enhanced */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly Performance with Target Line */}
                <div className="card p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weekly Performance</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTimeRange('7d')}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${timeRange === '7d'
                                    ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border'
                                    }`}
                            >
                                7 Days
                            </button>
                            <button
                                onClick={() => setTimeRange('30d')}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${timeRange === '30d'
                                    ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border'
                                    }`}
                            >
                                30 Days
                            </button>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#24875c" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#24875c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="h" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value, name) => [
                                        `${value}h`,
                                        name === 'hours' ? 'Study Time' : 'Daily Target'
                                    ]}
                                />
                                {/* Target Reference Line */}
                                <ReferenceLine
                                    y={goals?.dailyHoursGoal || 6}
                                    stroke="#f59e0b"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `Target: ${goals?.dailyHoursGoal || 6}h`,
                                        position: 'right',
                                        fill: '#f59e0b',
                                        fontSize: 12
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#24875c"
                                    strokeWidth={3}
                                    fill="url(#colorHours)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-royal-500 rounded-full" />
                            <span className="text-slate-500">Study Time</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-gold-500 border-dashed" style={{ borderStyle: 'dashed' }} />
                            <span className="text-slate-500">Daily Target</span>
                        </div>
                    </div>
                </div>

                {/* Subject Mastery - Priority 2 */}
                {/* Subject Mastery - Priority 2 */}
                <SubjectMastery subjects={subjectAnalysis} />

                {/* Quiz Performance - New Section */}
                <div className="card p-6 col-span-1 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Quiz Performance</h3>
                        </div>
                        <span className="text-sm text-slate-500">Last 10 Quizzes</span>
                    </div>
                    <div className="h-64">
                        {quizResults.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizResults.slice(0, 10).reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="topic"
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                                    />
                                    <YAxis hide domain={[0, 'dataMax']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none' }}
                                        formatter={(value, name, props) => [`${value}/${props.payload.totalQuestions}`, 'Score']}
                                    />
                                    <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p>No quizzes taken yet</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Gamification Row - Priority 5 */}
            <div className="grid lg:grid-cols-3 gap-6">
                <StreakDisplay
                    currentStreak={stats?.currentStreak || 0}
                    bestStreak={stats?.bestStreak || 0}
                />
                <WeeklyChallenges logs={logs} stats={stats} />
                <AchievementBadges unlockedAchievements={achievements} />
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Sessions</h3>
                    <button className="text-royal-600 hover:text-royal-700 text-sm font-medium flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {logs.length > 0 ? (
                    <div className="space-y-4">
                        {logs.slice(0, 5).map((log, i) => (
                            <motion.div
                                key={log.id || i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-dark-bg rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-dark-border"
                            >
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{log.subject || 'Study Session'}</p>
                                    <p className="text-sm text-slate-500 truncate">{log.topic || 'General Topic'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 dark:text-white">{log.durationMinutes || 0} min</div>
                                    <div className="text-xs text-slate-400">
                                        {log.date ? format(parseISO(log.date), 'MMM d, h:mm a') : 'Just now'}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-dark-border rounded-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Ready to ace UPSC? 🎯
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Start your first study session now!
                        </p>
                        <button
                            onClick={() => window.location.href = '/tracker'}
                            className="btn-primary px-6 py-2 rounded-xl"
                        >
                            Start Studying
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Floating Quick Actions */}
            <QuickActions />
        </div >
    );
}
