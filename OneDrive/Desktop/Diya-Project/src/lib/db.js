import { db } from './firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    increment,
    getDocs,
    deleteDoc
} from 'firebase/firestore';

// --- Quiz Management ---
export const saveQuizResult = async (uid, result) => {
    try {
        await addDoc(collection(db, "quizResults"), {
            uid,
            ...result,
            timestamp: Timestamp.now()
        });
        return true;
    } catch (e) {
        console.error("Error saving quiz result:", e);
        return false;
    }
};

export const subscribeToQuizResults = (uid, limitCount = 20, callback) => {
    const q = query(
        collection(db, "quizResults"),
        where("uid", "==", uid)
    );

    return onSnapshot(q, (snapshot) => {
        const results = [];
        snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
        results.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        callback(results.slice(0, limitCount));
    });
};

// --- User Stats & Streak Management ---

export const initializeUserStats = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid,
            totalStudyHours: 0,
            totalSessions: 0,
            currentStreak: 1,
            bestStreak: 1,
            activeDays: 1, // Initialize activeDays
            lastLoginDate: Timestamp.now(),
            topicsCompleted: 0,
            totalTopics: 850,
            createdAt: Timestamp.now()
        });
    } else {
        const data = userSnap.data();
        const lastLogin = data.lastLoginDate?.toDate();
        const now = new Date();

        if (lastLogin) {
            const isSameDay = lastLogin.toDateString() === now.toDateString();

            if (!isSameDay) {
                // It's a new day!
                const updates = {
                    lastLoginDate: Timestamp.now(),
                    activeDays: increment(1) // Increment activeDays
                };

                // Check Streak (Yesterday?)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastLogin.toDateString() === yesterday.toDateString()) {
                    // Streak continues
                    updates.currentStreak = increment(1);
                    updates.bestStreak = Math.max(data.bestStreak || 0, (data.currentStreak || 0) + 1);
                } else {
                    // Streak broken (more than 1 day gap)
                    updates.currentStreak = 1;
                }

                await updateDoc(userRef, updates);
            }
            // If same day, do nothing
        }
    }
};

export const subscribeToUserStats = (uid, callback) => {
    return onSnapshot(doc(db, "users", uid), (doc) => {
        callback(doc.data());
    });
};

// --- Logger / Tracker ---

export const logStudySession = async (uid, data) => {
    // data: { subject, topic, durationMinutes, mode, timestamp (optional - for manual entries) }
    try {
        // Use provided timestamp for manual entries, or current time for tracked sessions
        const sessionDate = data.timestamp ? new Date(data.timestamp) : new Date();

        // 1. Add to logs collection
        await addDoc(collection(db, "logs"), {
            uid,
            subject: data.subject,
            topic: data.topic,
            notes: data.notes || '',
            durationMinutes: data.durationMinutes,
            mode: data.mode || 'stopwatch',
            timestamp: Timestamp.fromDate(sessionDate),
            date: sessionDate.toISOString()
        });

        // 2. Update User Aggregates
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        // Update total hours and sessions
        await updateDoc(userRef, {
            totalStudyHours: increment(data.durationMinutes / 60),
            totalSessions: increment(1)
        });

        // 3. Update Streak if this is a study session for today
        const today = new Date();
        const isToday = sessionDate.toDateString() === today.toDateString();

        if (isToday && userData) {
            const lastStudyDate = userData.lastStudyDate?.toDate();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            // Check if already studied today
            const alreadyStudiedToday = lastStudyDate && lastStudyDate.toDateString() === today.toDateString();

            if (!alreadyStudiedToday) {
                const updates = {
                    lastStudyDate: Timestamp.now()
                };

                // Check if studied yesterday (continue streak) or not (reset streak)
                if (lastStudyDate && lastStudyDate.toDateString() === yesterday.toDateString()) {
                    // Continue streak
                    const newStreak = (userData.currentStreak || 0) + 1;
                    updates.currentStreak = newStreak;
                    updates.bestStreak = Math.max(userData.bestStreak || 0, newStreak);
                } else if (!lastStudyDate || lastStudyDate.toDateString() !== today.toDateString()) {
                    // Start/reset streak
                    updates.currentStreak = 1;
                }

                await updateDoc(userRef, updates);
            }
        }

        return true;
    } catch (e) {
        console.error("Error logging session:", e);
        return false;
    }
};

export const subscribeToRecentLogs = (uid, limitCount = 50, callback) => {
    const q = query(
        collection(db, "logs"),
        where("uid", "==", uid)
        // orderBy("timestamp", "desc") // Removed to avoid index requirement
    );

    return onSnapshot(q, (snapshot) => {
        const logs = [];
        snapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() }));
        // Client-side sort
        logs.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
        });
        callback(logs.slice(0, limitCount));
    }, (error) => {
        console.error("Error fetching logs:", error);
    });
};

// --- Planner ---

export const addTask = async (uid, task) => {
    return await addDoc(collection(db, "tasks"), {
        uid,
        ...task, // text, completed, date, type
        createdAt: Timestamp.now()
    });
};

export const toggleTask = async (taskId, currentStatus) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
        completed: !currentStatus
    });
};

export const deleteTask = async (taskId) => {
    try {
        await deleteDoc(doc(db, "tasks", taskId));
    } catch (e) {
        console.error("Error deleting task:", e);
    }
};

export const subscribeToTasks = (uid, dateString, callback) => {
    // dateString format YYYY-MM-DD
    const q = query(
        collection(db, "tasks"),
        where("uid", "==", uid)
        // orderBy("createdAt", "desc") // Removed to avoid index requirement
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = [];
        snapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
        // Client-side sort
        tasks.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
        callback(tasks);
    });
};

// --- User Progress ---
export const updateUserProgress = async (uid, topicsCompleted, totalTopics) => {
    const userRef = doc(db, "users", uid);
    try {
        await updateDoc(userRef, {
            topicsCompleted: topicsCompleted,
            totalTopics: totalTopics
        });
    } catch (e) {
        console.error("Error updating progress:", e);
    }
};

// --- User Goals (Dashboard Enhancement) ---

export const saveUserGoals = async (uid, goals) => {
    // goals: { targetExamDate, targetScore, currentScore, dailyHoursGoal, weeklyHoursGoal }
    const goalsRef = doc(db, "userGoals", uid);
    try {
        await setDoc(goalsRef, {
            uid,
            ...goals,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error("Error saving goals:", e);
        return false;
    }
};

export const subscribeToUserGoals = (uid, callback) => {
    return onSnapshot(doc(db, "userGoals", uid), (doc) => {
        callback(doc.exists() ? doc.data() : null);
    });
};

// --- Achievements System ---

export const ACHIEVEMENTS = [
    { id: 'first_session', name: 'First Steps', description: 'Complete your first study session', icon: '🎯' },
    { id: 'week_warrior', name: 'Week Warrior', description: 'Study for 7 consecutive days', icon: '⚔️' },
    { id: 'hour_hero', name: 'Hour Hero', description: 'Study for 10+ hours in a week', icon: '🦸' },
    { id: 'consistency_king', name: 'Consistency King', description: 'Maintain a 30-day streak', icon: '👑' },
    { id: 'subject_master', name: 'Subject Master', description: 'Master any subject (80%+ time)', icon: '🎓' },
    { id: 'early_bird', name: 'Early Bird', description: 'Study before 7 AM', icon: '🌅' },
    { id: 'night_owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉' },
    { id: 'marathon_session', name: 'Marathon Session', description: 'Complete a 3+ hour session', icon: '🏃' },
];

export const unlockAchievement = async (uid, achievementId) => {
    const achievementRef = doc(db, "achievements", `${uid}_${achievementId}`);
    const existingSnap = await getDoc(achievementRef);

    if (!existingSnap.exists()) {
        await setDoc(achievementRef, {
            uid,
            achievementId,
            unlockedAt: Timestamp.now()
        });
        return true; // Newly unlocked
    }
    return false; // Already had it
};

export const subscribeToAchievements = (uid, callback) => {
    const q = query(
        collection(db, "achievements"),
        where("uid", "==", uid)
    );

    return onSnapshot(q, (snapshot) => {
        const achievements = [];
        snapshot.forEach((doc) => achievements.push(doc.data()));
        callback(achievements);
    });
};

// --- Weekly Challenges ---

export const WEEKLY_CHALLENGES = [
    { id: 'study_30h', name: 'Study 30 hours', target: 30, unit: 'hours', icon: '📚' },
    { id: 'complete_5_sessions', name: 'Complete 5 sessions', target: 5, unit: 'sessions', icon: '✅' },
    { id: 'study_all_subjects', name: 'Cover all subjects', target: 5, unit: 'subjects', icon: '📊' },
];

export const getWeeklyChallenge = () => {
    // Return a challenge based on week number for variety
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
};

// --- Subject Analysis ---

export const analyzeSubjectPerformance = (logs) => {
    const subjectData = {};

    logs.forEach(log => {
        const subject = log.subject || 'Other';
        if (!subjectData[subject]) {
            subjectData[subject] = { hours: 0, sessions: 0, lastStudied: null };
        }
        subjectData[subject].hours += (log.durationMinutes || 0) / 60;
        subjectData[subject].sessions += 1;

        const logDate = log.date ? new Date(log.date) : null;
        if (logDate && (!subjectData[subject].lastStudied || logDate > subjectData[subject].lastStudied)) {
            subjectData[subject].lastStudied = logDate;
        }
    });

    // Calculate mastery levels (based on hours studied)
    const maxHours = Math.max(...Object.values(subjectData).map(s => s.hours), 1);

    return Object.entries(subjectData).map(([name, data]) => ({
        name,
        hours: parseFloat(data.hours.toFixed(1)),
        sessions: data.sessions,
        lastStudied: data.lastStudied,
        mastery: Math.min(100, Math.round((data.hours / maxHours) * 100)),
        needsRevision: data.lastStudied && (Date.now() - data.lastStudied.getTime()) > 7 * 24 * 60 * 60 * 1000
    })).sort((a, b) => b.hours - a.hours);
};

export const getWeakestSubjects = (subjectAnalysis) => {
    return subjectAnalysis
        .filter(s => s.mastery < 50 || s.needsRevision)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 3);
};

// --- Insights Generation ---

export const generateInsights = (stats, logs, goals) => {
    const insights = [];
    const now = new Date();

    // Weekly study time insight
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyLogs = logs.filter(l => l.date && new Date(l.date) >= weekStart);
    const weeklyHours = weeklyLogs.reduce((acc, l) => acc + (l.durationMinutes || 0) / 60, 0);
    const weeklyGoal = goals?.weeklyHoursGoal || 35;
    const hoursNeeded = Math.max(0, weeklyGoal - weeklyHours);

    if (hoursNeeded > 0) {
        const daysLeft = 7 - now.getDay();
        const hoursPerDay = daysLeft > 0 ? (hoursNeeded / daysLeft).toFixed(1) : hoursNeeded.toFixed(1);
        insights.push({
            type: 'warning',
            icon: '⏰',
            text: `You need ${hoursPerDay}h more per day to meet your ${weeklyGoal}h weekly goal`,
            action: 'Start Session'
        });
    } else {
        insights.push({
            type: 'success',
            icon: '🎉',
            text: 'You\'ve met your weekly study goal! Keep it up!',
            action: null
        });
    }

    // Weakest subject insight
    const subjectAnalysis = analyzeSubjectPerformance(logs);
    const weakest = getWeakestSubjects(subjectAnalysis);

    if (weakest.length > 0) {
        insights.push({
            type: 'info',
            icon: '🎯',
            text: `Focus on ${weakest[0].name} today (your weakest subject at ${weakest[0].mastery}% mastery)`,
            action: 'Study Now'
        });
    }

    // Streak insight
    if (stats?.currentStreak >= 5) {
        insights.push({
            type: 'success',
            icon: '🔥',
            text: `Amazing! ${stats.currentStreak}-day streak! You're on fire!`,
            action: null
        });
    }

    // Revision reminder
    const needsRevision = subjectAnalysis.filter(s => s.needsRevision);
    if (needsRevision.length > 0) {
        insights.push({
            type: 'warning',
            icon: '📝',
            text: `${needsRevision.length} subject(s) need revision (not studied in 7+ days)`,
            action: 'Review'
        });
    }

    return insights.slice(0, 3);
};

// --- Syllabus Subscription for Analytics ---
export const subscribeToUserSyllabus = (uid, callback) => {
    const syllabusRef = doc(db, "syllabi", uid);

    return onSnapshot(syllabusRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to syllabus:", error);
        callback(null);
    });
};
