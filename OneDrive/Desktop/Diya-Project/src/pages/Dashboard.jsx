import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    subscribeToUserStats,
    subscribeToRecentLogs,
    subscribeToUserGoals,
    subscribeToAchievements,
    subscribeToQuizResults,
    analyzeSubjectPerformance,
    generateInsights
} from '../lib/db';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, BarChart, Bar
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
import StudyCalendar from '../components/dashboard/StudyCalendar';

// Loading skeleton component - Portfolio Style
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-40 skeleton rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 skeleton rounded-2xl" />
                ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-96 skeleton rounded-2xl" />
                <div className="h-96 skeleton rounded-2xl" />
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
    const [quizResults, setQuizResults] = useState([]);
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
            {/* Header - Portfolio Style */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-medium">
                        <span className="font-bold">Dashboard</span>
                    </h1>
                    <p className="text-[#71717A] mt-1 text-sm font-light">
                        Overview of your progress on {format(new Date(), 'MMMM d, yyyy')}
                    </p>
                </div>
                {!hasData && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-2 rounded text-sm flex items-center gap-2"
                    >
                        <Info className="w-4 h-4" />
                        <span>Start tracking to see real stats!</span>
                    </motion.div>
                )}
            </div>

            {/* Goal Section */}
            <GoalSection
                user={user}
                goals={goals}
                onGoalsUpdate={setGoals}
            />

            {/* Smart Insights */}
            <InsightCards insights={insights} />

            {/* Quick Actions Bar */}
            <QuickActionBar />

            {/* Stats Cards - Portfolio Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${stats?.currentStreak || 0} Days`}
                    subtitle={`Best: ${stats?.bestStreak || 0} days`}
                    color="black"
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
                    color="black"
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
                    color="black"
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
                    color="black"
                    trend="neutral"
                    tooltip="Total study sessions logged since you started"
                />
            </div>

            {/* Charts Row - Portfolio Style */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly Performance */}
                <div className="card p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-medium">Weekly <span className="font-bold">Performance</span></h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTimeRange('7d')}
                                className={`px-3 py-1 text-sm rounded transition-colors border ${timeRange === '7d'
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                    : 'text-[#71717A] border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                7 Days
                            </button>
                            <button
                                onClick={() => setTimeRange('30d')}
                                className={`px-3 py-1 text-sm rounded transition-colors border ${timeRange === '30d'
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                    : 'text-[#71717A] border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
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
                                        <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                                <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} unit="h" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e5e5',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value, name) => [
                                        `${value}h`,
                                        name === 'hours' ? 'Study Time' : 'Daily Target'
                                    ]}
                                />
                                <ReferenceLine
                                    y={goals?.dailyHoursGoal || 6}
                                    stroke="#71717A"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `Target: ${goals?.dailyHoursGoal || 6}h`,
                                        position: 'right',
                                        fill: '#71717A',
                                        fontSize: 12
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#000000"
                                    strokeWidth={2}
                                    fill="url(#colorHours)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-black rounded-full" />
                            <span className="text-[#71717A]">Study Time</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-[#71717A]" style={{ borderStyle: 'dashed' }} />
                            <span className="text-[#71717A]">Daily Target</span>
                        </div>
                    </div>
                </div>

                {/* Subject Mastery */}
                <SubjectMastery subjects={subjectAnalysis} />

                {/* Quiz Performance */}
                <div className="card p-6 col-span-1 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            <h3 className="text-lg font-medium">Recent Quiz <span className="font-bold">Performance</span></h3>
                        </div>
                        <span className="text-sm text-[#71717A]">Last 10 Quizzes</span>
                    </div>
                    <div className="h-64">
                        {quizResults.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizResults.slice(0, 10).reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                                    <XAxis
                                        dataKey="topic"
                                        stroke="#71717A"
                                        fontSize={10}
                                        tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                                    />
                                    <YAxis hide domain={[0, 'dataMax']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                                        formatter={(value, name, props) => [`${value}/${props.payload.totalQuestions}`, 'Score']}
                                    />
                                    <Bar dataKey="score" fill="#000000" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#71717A]">
                                <p>No quizzes taken yet</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Gamification Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                <StreakDisplay
                    currentStreak={stats?.currentStreak || 0}
                    bestStreak={stats?.bestStreak || 0}
                    lastStudyDate={stats?.lastStudyDate}
                    logs={logs}
                />
                <WeeklyChallenges logs={logs} stats={stats} />
                <AchievementBadges unlockedAchievements={achievements} />
            </div>

            {/* Recent Activity - Portfolio Style */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">Recent <span className="font-bold">Sessions</span></h3>
                    <button className="text-black dark:text-white hover:underline text-sm font-medium flex items-center gap-1">
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
                                className="flex items-center gap-4 p-4 hover:bg-[#FAFAFA] dark:hover:bg-dark-surface rounded transition-colors border border-transparent hover:border-black/10"
                            >
                                <div className="w-12 h-12 bg-black/5 dark:bg-white/10 rounded flex items-center justify-center shrink-0">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{log.subject || 'Study Session'}</p>
                                    <p className="text-sm text-[#71717A] truncate">{log.topic || 'General Topic'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{log.durationMinutes || 0} min</div>
                                    <div className="text-xs text-[#71717A]">
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
                        <div className="w-24 h-24 mx-auto mb-4 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-[#71717A]" />
                        </div>
                        <h4 className="text-lg font-bold mb-2">
                            Ready to ace UPSC? 🎯
                        </h4>
                        <p className="text-[#71717A] mb-4">
                            Start your first study session now!
                        </p>
                        <button
                            onClick={() => window.location.href = '/tracker'}
                            className="btn-primary px-6 py-2 rounded"
                        >
                            Start Studying
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Calendar Section */}
            <StudyCalendar logs={logs} dailyGoal={goals?.dailyHours || 6} />

            {/* Floating Quick Actions */}
            <QuickActions />
        </div >
    );
}
