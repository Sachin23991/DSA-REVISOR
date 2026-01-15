import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Flame, Clock, Target, BookOpen, TrendingUp
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
    isSameMonth, addMonths, subMonths, isToday, parseISO, startOfWeek,
    endOfWeek, getDay
} from 'date-fns';

// Productivity levels and colors
const PRODUCTIVITY_LEVELS = {
    0: { label: 'No Activity', color: 'bg-black/5 dark:bg-white/5', textColor: 'text-[#71717A]', emoji: '' },
    1: { label: 'Light', color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400', emoji: '💧' },
    2: { label: 'Moderate', color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400', emoji: '🌱' },
    3: { label: 'Good', color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-400', emoji: '⚡' },
    4: { label: 'Excellent', color: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400', emoji: '🔥' },
    5: { label: 'Outstanding', color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400', emoji: '💎' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudyCalendar({ logs = [], dailyGoal = 6 }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Calculate productivity for each day
    const dayProductivity = useMemo(() => {
        const productivity = {};

        logs.forEach(log => {
            if (!log.date) return;
            const dateKey = format(parseISO(log.date), 'yyyy-MM-dd');
            if (!productivity[dateKey]) {
                productivity[dateKey] = { hours: 0, sessions: 0, subjects: new Set() };
            }
            productivity[dateKey].hours += (log.durationMinutes || 0) / 60;
            productivity[dateKey].sessions += 1;
            if (log.subject) {
                productivity[dateKey].subjects.add(log.subject);
            }
        });

        // Convert to productivity level
        Object.keys(productivity).forEach(key => {
            const hours = productivity[key].hours;
            let level = 0;
            if (hours >= dailyGoal * 1.5) level = 5;
            else if (hours >= dailyGoal) level = 4;
            else if (hours >= dailyGoal * 0.75) level = 3;
            else if (hours >= dailyGoal * 0.5) level = 2;
            else if (hours > 0) level = 1;
            productivity[key].level = level;
        });

        return productivity;
    }, [logs, dailyGoal]);

    // Get days to display
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    // Month stats
    const monthStats = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        let totalHours = 0;
        let totalSessions = 0;
        let activeDays = 0;

        Object.entries(dayProductivity).forEach(([dateKey, data]) => {
            const date = parseISO(dateKey);
            if (date >= monthStart && date <= monthEnd) {
                totalHours += data.hours;
                totalSessions += data.sessions;
                if (data.hours > 0) activeDays++;
            }
        });

        return { totalHours, totalSessions, activeDays };
    }, [currentMonth, dayProductivity]);

    const getDayData = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return dayProductivity[dateKey] || { hours: 0, sessions: 0, subjects: new Set(), level: 0 };
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        setSelectedDate(null);
    };

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Study <span className="font-bold">Calendar</span></h3>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigateMonth('prev')}
                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded border border-black/10 dark:border-white/10"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                    <span className="font-bold min-w-[140px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigateMonth('next')}
                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded border border-black/10 dark:border-white/10"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Month Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-[#FAFAFA] dark:bg-dark-surface rounded border border-black/5 dark:border-white/5">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[#71717A] mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-light">Hours</span>
                    </div>
                    <p className="text-xl font-bold">{monthStats.totalHours.toFixed(1)}</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[#71717A] mb-1">
                        <Target className="w-3 h-3" />
                        <span className="font-light">Sessions</span>
                    </div>
                    <p className="text-xl font-bold">{monthStats.totalSessions}</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[#71717A] mb-1">
                        <Flame className="w-3 h-3" />
                        <span className="font-light">Active Days</span>
                    </div>
                    <p className="text-xl font-bold">{monthStats.activeDays}</p>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-[#71717A] py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const dayData = getDayData(day);
                    const productivity = PRODUCTIVITY_LEVELS[dayData.level];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedDate(isSelected ? null : day)}
                            className={`aspect-square rounded p-1 flex flex-col items-center justify-center relative transition-all ${!isCurrentMonth ? 'opacity-30' : ''
                                } ${productivity.color} ${isSelected ? 'ring-2 ring-black dark:ring-white' : ''
                                } ${isTodayDate ? 'ring-2 ring-offset-1 ring-black dark:ring-white' : ''
                                }`}
                        >
                            <span className={`text-sm font-medium ${productivity.textColor}`}>
                                {format(day, 'd')}
                            </span>
                            {dayData.level > 0 && (
                                <span className="text-xs">{productivity.emoji}</span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-[#FAFAFA] dark:bg-dark-surface rounded border border-black/5 dark:border-white/5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold">{format(selectedDate, 'EEEE, MMMM d')}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${PRODUCTIVITY_LEVELS[getDayData(selectedDate).level].color
                                } ${PRODUCTIVITY_LEVELS[getDayData(selectedDate).level].textColor}`}>
                                {PRODUCTIVITY_LEVELS[getDayData(selectedDate).level].label}
                            </span>
                        </div>

                        {getDayData(selectedDate).hours > 0 ? (
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{getDayData(selectedDate).hours.toFixed(1)}</p>
                                    <p className="text-xs text-[#71717A]">Hours</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{getDayData(selectedDate).sessions}</p>
                                    <p className="text-xs text-[#71717A]">Sessions</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{getDayData(selectedDate).subjects.size}</p>
                                    <p className="text-xs text-[#71717A]">Subjects</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#71717A] text-sm text-center font-light">No study activity on this day</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <p className="text-xs text-[#71717A] mb-2 font-light">Productivity Levels</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(PRODUCTIVITY_LEVELS).map(([level, data]) => (
                        <div key={level} className="flex items-center gap-1">
                            <div className={`w-4 h-4 rounded ${data.color}`} />
                            <span className="text-xs text-[#71717A]">{data.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
