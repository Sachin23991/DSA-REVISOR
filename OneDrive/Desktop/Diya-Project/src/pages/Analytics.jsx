import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToRecentLogs, subscribeToUserStats, subscribeToQuizResults } from '../lib/db';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { format, parseISO, subDays, isSameDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Analytics() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [quizResults, setQuizResults] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, year, all

    useEffect(() => {
        if (!user) return;
        // Subscribe to enough logs to cover the max range
        const unsubLogs = subscribeToRecentLogs(user.uid, 500, (data) => setLogs(data));
        const unsubQuiz = subscribeToQuizResults(user.uid, 50, (data) => setQuizResults(data));
        const unsubStats = subscribeToUserStats(user.uid, (data) => setUserStats(data));

        return () => {
            unsubLogs();
            unsubQuiz();
            unsubStats();
        };
    }, [user]);

    // Filter Data based on Time Range
    const filteredLogs = useMemo(() => {
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case '7d': startDate = subDays(now, 7); break;
            case '30d': startDate = subDays(now, 30); break;
            case '90d': startDate = subDays(now, 90); break;
            case 'year': startDate = startOfYear(now); break;
            default: startDate = null; // All time
        }

        if (!startDate) return logs;
        return logs.filter(log => log.date && isAfter(parseISO(log.date), startDate));
    }, [logs, timeRange]);

    // Process data for charts
    const trendData = useMemo(() => {
        if (filteredLogs.length === 0) return [];

        // Create map of days
        const daysMap = new Map();
        const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 15; // Limit points for readability

        // Initialize last N days with 0
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = subDays(new Date(), i);
            daysMap.set(format(d, 'MMM d'), 0);
        }

        // Fill with actual data
        filteredLogs.forEach(log => {
            if (!log.date) return;
            const dateStr = format(parseISO(log.date), 'MMM d');
            if (daysMap.has(dateStr)) {
                daysMap.set(dateStr, daysMap.get(dateStr) + (log.durationMinutes || 0) / 60);
            }
        });

        return Array.from(daysMap).map(([date, hours]) => ({
            date,
            hours: parseFloat(hours.toFixed(1))
        }));
    }, [filteredLogs, timeRange]);

    const subjectData = useMemo(() => {
        const data = {};
        filteredLogs.forEach(log => {
            const subject = log.subject || 'Other';
            data[subject] = (data[subject] || 0) + (log.durationMinutes || 0) / 60;
        });
        return Object.entries(data)
            .map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }))
            .sort((a, b) => b.hours - a.hours);
    }, [filteredLogs]);

    const totalHours = filteredLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0) / 60, 0);

    const handleDownloadReport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Study Analytics Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 20, 30);
        doc.text(`Time Range: ${timeRange.toUpperCase()}`, 20, 36);

        // Summary
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 45, 170, 30, 'F');
        doc.setFontSize(14);
        doc.text(`Total Focus Time: ${totalHours.toFixed(1)} Hours`, 30, 60);
        doc.text(`Total Sessions: ${filteredLogs.length}`, 30, 70);

        // Subject Table
        const tableData = subjectData.map(s => [s.name, `${s.hours} hours`]);
        doc.autoTable({
            startY: 85,
            head: [['Subject', 'Duration']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`UPSC_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics & Reports</h1>
                    <p className="text-slate-500">Deep dive into your study metrics</p>
                </div>

                <button
                    onClick={handleDownloadReport}
                    className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2 font-medium"
                >
                    <Download className="w-5 h-5" />
                    Download PDF Report
                </button>
            </div>

            {/* Filters */}
            <div className="card p-2 inline-flex dark:bg-dark-surface dark:border-dark-border">
                {['7d', '30d', '90d', 'year'].map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                            ? 'bg-royal-100 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300'
                            : 'text-slate-500 hover:text-royal-600 dark:text-slate-400 dark:hover:text-white'
                            }`}
                    >
                        {range === 'year' ? 'This Year' : `Last ${range.replace('d', ' Days')}`}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-sm text-slate-500 mb-1">Total Focus Time</p>
                    <p className="text-4xl font-bold text-royal-600 dark:text-royal-400">{totalHours.toFixed(1)}<span className="text-lg text-slate-400 ml-1">hrs</span></p>
                </div>
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-sm text-slate-500 mb-1">Study Sessions (via Tracker)</p>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{filteredLogs.length}</p>
                </div>
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-sm text-slate-500 mb-1">Top Subject</p>
                    <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 truncate">
                        {subjectData[0]?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-400">{subjectData[0]?.hours || 0} hrs</p>
                </div>
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-sm text-slate-500 mb-1">Syllabus Progress</p>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-bold text-royal-600 dark:text-royal-400">
                            {userStats?.topicsCompleted && userStats?.totalTopics
                                ? ((userStats.topicsCompleted / userStats.totalTopics) * 100).toFixed(1)
                                : '0.0'}
                            <span className="text-lg text-slate-400 ml-1">%</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-royal-500" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Study Trend</h3>
                    </div>
                    <div className="h-72">
                        {trendData.some(d => d.hours > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="h" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value) => [`${value}h`, 'Focus Time']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#8b5cf6' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Calendar className="w-12 h-12 mb-2 opacity-30" />
                                <p>No data for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Subject Breakdown */}
                <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Topic Distribution</h3>
                    </div>
                    <div className="h-72">
                        {subjectData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} unit="h" />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        width={100}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value) => [`${value}h`, 'Hours']}
                                    />
                                    <Bar
                                        dataKey="hours"
                                        fill="#10b981"
                                        radius={[0, 4, 4, 0]}
                                        barSize={30}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <BarChart3 className="w-12 h-12 mb-2 opacity-30" />
                                <p>No subject data found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quiz Performance Section */}
            <div className="card p-6 dark:bg-dark-surface dark:border-dark-border">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quiz Performance</h3>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Quiz Stats */}
                    <div className="space-y-4 col-span-1">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Quizzes Taken</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">{quizResults.length}</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Avg. Score</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">
                                {quizResults.length > 0
                                    ? (quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / quizResults.length).toFixed(0)
                                    : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Quiz Chart */}
                    <div className="col-span-2 h-64">
                        {quizResults.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizResults.slice(0, 10).reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="topic"
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                                    />
                                    <YAxis hide domain={[0, 'dataMax']} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value, name, props) => [`${value}/${props.payload.totalQuestions}`, 'Score']}
                                    />
                                    <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
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
        </div>
    );
}
