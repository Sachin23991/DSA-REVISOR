/* ═══════════════════════════════════════════════════════
   DSA Tracker — Data Store (localStorage + Firestore)
   Dual-persistence: localStorage for speed, Firestore for cloud sync
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Store = (() => {
    const KEYS = {
        QUESTIONS: 'dsa_questions',
        USER_STATS: 'dsa_user_stats',
        ACTIVITY_LOG: 'dsa_activity_log',
        SETTINGS: 'dsa_settings',
        DAILY_LOG: 'dsa_daily_log',
        CALENDAR_ENTRIES: 'dsa_calendar_entries'
    };

    // ── Firestore Collections ──
    const FS_COLLECTIONS = {
        QUESTIONS: 'questions',
        USER_STATS: 'userStats',
        ACTIVITY_LOG: 'activityLog',
        SETTINGS: 'settings',
        DAILY_LOG: 'dailyLog'
    };

    // ── Firestore Helpers (fire-and-forget with error logging) ──
    function getFirestore() {
        return (typeof db !== 'undefined') ? db : null;
    }

    function firestoreSet(collection, docId, data) {
        const firestore = getFirestore();
        if (!firestore) return;
        firestore.collection(collection).doc(docId).set(data, { merge: true })
            .then(() => console.log(`☁️ Synced → ${collection}/${docId}`))
            .catch(err => console.warn(`☁️ Firestore write failed (${collection}/${docId}):`, err));
    }

    function firestoreDelete(collection, docId) {
        const firestore = getFirestore();
        if (!firestore) return;
        firestore.collection(collection).doc(docId).delete()
            .then(() => console.log(`☁️ Deleted → ${collection}/${docId}`))
            .catch(err => console.warn(`☁️ Firestore delete failed (${collection}/${docId}):`, err));
    }

    /**
     * Load all questions from Firestore into localStorage (one-time cloud pull).
     * Call this on app init to hydrate local cache from cloud.
     */
    function syncFromFirestore() {
        const firestore = getFirestore();
        if (!firestore) return Promise.resolve(false);

        return firestore.collection(FS_COLLECTIONS.QUESTIONS).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('☁️ Firestore: No cloud questions found. Using local data.');
                    // Push local data to Firestore if we have any
                    const localQuestions = getQuestions();
                    if (localQuestions.length > 0) {
                        console.log(`☁️ Pushing ${localQuestions.length} local questions to Firestore...`);
                        localQuestions.forEach(q => firestoreSet(FS_COLLECTIONS.QUESTIONS, q.id, q));
                    }
                    return false;
                }

                const cloudQuestions = [];
                snapshot.forEach(doc => cloudQuestions.push(doc.data()));
                console.log(`☁️ Loaded ${cloudQuestions.length} questions from Firestore`);

                // Merge: cloud wins for conflicts (by updatedAt timestamp)
                const localQuestions = getQuestions();
                const merged = mergeQuestionSets(localQuestions, cloudQuestions);
                save(KEYS.QUESTIONS, merged);

                // Push merged set back to Firestore
                merged.forEach(q => firestoreSet(FS_COLLECTIONS.QUESTIONS, q.id, q));
                return true;
            })
            .catch(err => {
                console.warn('☁️ Firestore sync failed:', err);
                return false;
            });
    }

    /**
     * Merge two question arrays. Cloud data wins on conflicts (same ID).
     */
    function mergeQuestionSets(local, cloud) {
        const map = new Map();
        local.forEach(q => map.set(q.id, q));
        cloud.forEach(q => {
            const existing = map.get(q.id);
            if (!existing || (q.updatedAt && existing.updatedAt && q.updatedAt > existing.updatedAt)) {
                map.set(q.id, q);
            }
        });
        return Array.from(map.values());
    }

    // ── Default Data ──
    const defaultSettings = () => ({
        totalCycles: 15,
        dailyGoal: 5,
        baseIntervals: [0, 1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180, 210, 240],
        notificationsEnabled: false,
        overdueAlerts: true
    });

    const defaultUserStats = () => ({
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        badges: [],
        totalRevisions: 0,
        dailyGoal: 5
    });

    // ── Persistence Helpers ──
    function load(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : (typeof fallback === 'function' ? fallback() : fallback);
        } catch (e) {
            console.error(`Store: Error loading ${key}`, e);
            return typeof fallback === 'function' ? fallback() : fallback;
        }
    }

    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Store: Error saving ${key}`, e);
        }
    }

    // ── Question CRUD (localStorage + Firestore) ──
    function getQuestions() {
        return load(KEYS.QUESTIONS, []);
    }

    function saveQuestions(questions) {
        save(KEYS.QUESTIONS, questions);
    }

    function addQuestion(question) {
        const questions = getQuestions();
        question.id = generateId();
        question.createdAt = new Date().toISOString();
        question.updatedAt = new Date().toISOString();
        question.revisionCycle = 0;
        question.revisionHistory = [];
        question.easeFactor = 2.5;
        question.streak = 0;
        question.xpEarned = 0;

        // Calculate first revision date
        const settings = getSettings();
        question.nextRevisionDate = DSA.RevisionEngine
            ? DSA.RevisionEngine.calculateNextDate(question, settings)
            : new Date().toISOString().split('T')[0];

        questions.push(question);
        saveQuestions(questions);

        // ☁️ Sync to Firestore
        firestoreSet(FS_COLLECTIONS.QUESTIONS, question.id, question);

        addActivity('add', `Added "${question.name}" (${question.subject})`);
        return question;
    }

    function updateQuestion(id, updates) {
        const questions = getQuestions();
        const idx = questions.findIndex(q => q.id === id);
        if (idx === -1) return null;
        questions[idx] = { ...questions[idx], ...updates, updatedAt: new Date().toISOString() };
        saveQuestions(questions);

        // ☁️ Sync to Firestore
        firestoreSet(FS_COLLECTIONS.QUESTIONS, id, questions[idx]);

        return questions[idx];
    }

    function deleteQuestion(id) {
        const questions = getQuestions().filter(q => q.id !== id);
        saveQuestions(questions);

        // ☁️ Delete from Firestore
        firestoreDelete(FS_COLLECTIONS.QUESTIONS, id);

        addActivity('delete', 'Deleted a question');
    }

    function getQuestionById(id) {
        return getQuestions().find(q => q.id === id) || null;
    }

    // ── User Stats (localStorage + Firestore) ──
    function getUserStats() {
        return load(KEYS.USER_STATS, defaultUserStats);
    }

    function saveUserStats(stats) {
        save(KEYS.USER_STATS, stats);
        // ☁️ Sync to Firestore
        firestoreSet(FS_COLLECTIONS.USER_STATS, 'current', stats);
    }

    function updateUserStats(updates) {
        const stats = getUserStats();
        Object.assign(stats, updates);
        saveUserStats(stats);
        return stats;
    }

    // ── Settings (localStorage + Firestore) ──
    function getSettings() {
        return load(KEYS.SETTINGS, defaultSettings);
    }

    function saveSettings(settings) {
        save(KEYS.SETTINGS, settings);
        // ☁️ Sync to Firestore
        firestoreSet(FS_COLLECTIONS.SETTINGS, 'current', settings);
    }

    // ── Activity Log ──
    function getActivityLog() {
        return load(KEYS.ACTIVITY_LOG, []);
    }

    function addActivity(type, text) {
        const log = getActivityLog();
        const entry = {
            id: generateId(),
            type,
            text,
            timestamp: new Date().toISOString()
        };
        log.unshift(entry);
        // Keep last 200 activities
        if (log.length > 200) log.length = 200;
        save(KEYS.ACTIVITY_LOG, log);
    }

    // ── Daily Log (tracks per-day completions for streaks/heatmap) ──
    function getDailyLog() {
        return load(KEYS.DAILY_LOG, {});
    }

    function logDailyActivity(dateStr, type) {
        const log = getDailyLog();
        if (!log[dateStr]) {
            log[dateStr] = { solved: 0, revised: 0, xpEarned: 0 };
        }
        if (type === 'solved') log[dateStr].solved++;
        if (type === 'revised') log[dateStr].revised++;
        save(KEYS.DAILY_LOG, log);
        return log;
    }

    function addDailyXP(dateStr, xp) {
        const log = getDailyLog();
        if (!log[dateStr]) {
            log[dateStr] = { solved: 0, revised: 0, xpEarned: 0 };
        }
        log[dateStr].xpEarned += xp;
        save(KEYS.DAILY_LOG, log);
    }

    // ── Export / Import ──
    function exportData() {
        return JSON.stringify({
            questions: getQuestions(),
            userStats: getUserStats(),
            activityLog: getActivityLog(),
            settings: getSettings(),
            dailyLog: getDailyLog(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
    }

    function importData(json) {
        try {
            const data = JSON.parse(json);
            if (data.questions) {
                save(KEYS.QUESTIONS, data.questions);
                // ☁️ Sync imported questions to Firestore
                data.questions.forEach(q => firestoreSet(FS_COLLECTIONS.QUESTIONS, q.id, q));
            }
            if (data.userStats) save(KEYS.USER_STATS, data.userStats);
            if (data.activityLog) save(KEYS.ACTIVITY_LOG, data.activityLog);
            if (data.settings) save(KEYS.SETTINGS, data.settings);
            if (data.dailyLog) save(KEYS.DAILY_LOG, data.dailyLog);
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    function resetAllData() {
        // Clear Firestore questions collection
        const firestore = getFirestore();
        if (firestore) {
            firestore.collection(FS_COLLECTIONS.QUESTIONS).get()
                .then(snapshot => snapshot.forEach(doc => doc.ref.delete()))
                .catch(err => console.warn('☁️ Firestore reset failed:', err));
        }
        Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    }

    // ── Calendar Entries CRUD ──
    function getCalendarEntries() {
        return load(KEYS.CALENDAR_ENTRIES) || {};
    }

    function saveCalendarEntries(entries) {
        save(KEYS.CALENDAR_ENTRIES, entries);
    }

    function getCalendarEntry(dateKey) {
        const entries = getCalendarEntries();
        return entries[dateKey] || null;
    }

    function saveCalendarEntry(dateKey, data) {
        const entries = getCalendarEntries();
        entries[dateKey] = {
            ...data,
            dateKey,
            lastModified: new Date().toISOString()
        };
        saveCalendarEntries(entries);
        return entries[dateKey];
    }

    function deleteCalendarEntry(dateKey) {
        const entries = getCalendarEntries();
        delete entries[dateKey];
        saveCalendarEntries(entries);
    }

    // ── Helpers ──
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    function todayStr() {
        return new Date().toISOString().split('T')[0];
    }

    // ── Public API ──
    return {
        getQuestions,
        saveQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        getQuestionById,
        getUserStats,
        saveUserStats,
        updateUserStats,
        getSettings,
        saveSettings,
        getActivityLog,
        addActivity,
        getDailyLog,
        logDailyActivity,
        addDailyXP,
        getCalendarEntries,
        getCalendarEntry,
        saveCalendarEntry,
        deleteCalendarEntry,
        exportData,
        importData,
        resetAllData,
        syncFromFirestore,
        todayStr,
        generateId,
        KEYS
    };
})();
