/* ═══════════════════════════════════════════════════════
   Study Tracker — Browser-local data store
   Persists study data in the current browser.
   Universal platform for students of any stream
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Store = (() => {
    const KEYS = {
        QUESTIONS: 'dsa_questions',
        USER_STATS: 'dsa_user_stats',
        ACTIVITY_LOG: 'dsa_activity_log',
        SETTINGS: 'dsa_settings',
        DAILY_LOG: 'dsa_daily_log',
        CALENDAR_ENTRIES: 'dsa_calendar_entries',
        SYLLABUS: 'dsa_syllabus'
    };

    const DEFAULT_BASE_INTERVALS = Object.freeze([0, 1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180, 210, 240]);
    const SETTINGS_LIMITS = Object.freeze({
        totalCycles: { min: 1, max: 30 },
        dailyGoal: { min: 1, max: 50 },
        autoDeleteAfterDays: { min: 0, max: 3650 }
    });

    // ── Default Data ──
    const defaultSettings = () => ({
        totalCycles: 15,
        dailyGoal: 5,
        baseIntervals: [...DEFAULT_BASE_INTERVALS],
        notificationsEnabled: false,
        overdueAlerts: true,
        autoDeleteAfterDays: 0
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
    function isRecord(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function load(key, fallback) {
        const defaultValue = typeof fallback === 'function' ? fallback() : fallback;
        try {
            const value = JSON.parse(localStorage.getItem(key));
            const validShape = Array.isArray(defaultValue) ? Array.isArray(value) : isRecord(value);
            return validShape ? value : defaultValue;
        } catch (e) {
            console.error(`Store: Error loading ${key}`, e);
            return defaultValue;
        }
    }

    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Store: Error saving ${key}`, e);
            throw new Error('Could not save changes in this browser. Check browser storage and try again.');
        }
    }

    function writeStorageChanges(changes) {
        const previous = changes.map(([key]) => [key, localStorage.getItem(key)]);
        let written = 0;
        const write = (key, value) => {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        };
        try {
            for (const [key, value] of changes) {
                write(key, value);
                written++;
            }
        } catch (error) {
            for (const [key, value] of previous.slice(0, written).reverse()) {
                try {
                    write(key, value);
                } catch (rollbackError) {
                    console.error(`Store: Could not restore ${key}`, rollbackError);
                }
            }
            throw error;
        }
    }

    function clampInteger(value, fallback, min, max) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
    }

    function normalizeIntervals(intervals) {
        const parsed = Array.isArray(intervals)
            ? intervals
                .map(value => Number.parseInt(value, 10))
                .filter(value => Number.isFinite(value) && value >= 0)
            : [];

        if (parsed.length === 0) return [...DEFAULT_BASE_INTERVALS];

        const seeded = parsed[0] === 0 ? parsed : [0, ...parsed];
        return seeded.reduce((acc, value, index) => {
            if (index === 0) {
                acc.push(0);
                return acc;
            }

            acc.push(Math.max(acc[index - 1], value));
            return acc;
        }, []);
    }

    function normalizeSettings(settings = {}) {
        settings = settings || {};
        const defaults = defaultSettings();

        return {
            totalCycles: clampInteger(
                settings.totalCycles,
                defaults.totalCycles,
                SETTINGS_LIMITS.totalCycles.min,
                SETTINGS_LIMITS.totalCycles.max
            ),
            dailyGoal: clampInteger(
                settings.dailyGoal,
                defaults.dailyGoal,
                SETTINGS_LIMITS.dailyGoal.min,
                SETTINGS_LIMITS.dailyGoal.max
            ),
            baseIntervals: normalizeIntervals(settings.baseIntervals),
            notificationsEnabled: Boolean(settings.notificationsEnabled),
            overdueAlerts: settings.overdueAlerts !== false,
            autoDeleteAfterDays: clampInteger(
                settings.autoDeleteAfterDays,
                defaults.autoDeleteAfterDays,
                SETTINGS_LIMITS.autoDeleteAfterDays.min,
                SETTINGS_LIMITS.autoDeleteAfterDays.max
            )
        };
    }

    // ── Question CRUD ──
    function getQuestions() {
        return load(KEYS.QUESTIONS, []);
    }

    function saveQuestions(questions) {
        save(KEYS.QUESTIONS, questions);
    }

    function initializeQuestion(question) {
        question.id = generateId();
        question.createdAt = new Date().toISOString();
        question.updatedAt = new Date().toISOString();
        question.revisionCycle = 0;
        question.revisionHistory = [];
        question.easeFactor = 2.5;
        question.streak = 0;
        question.xpEarned = 0;
        return question;
    }

    function addQuestion(question) {
        const questions = getQuestions();
        initializeQuestion(question);

        // Calculate first revision date
        const settings = getSettings();
        question.nextRevisionDate = question.status === 'Mastered' ? null : DSA.RevisionEngine
            ? DSA.RevisionEngine.calculateNextDate(question, settings)
            : todayStr();

        questions.push(question);
        saveWithActivity(KEYS.QUESTIONS, questions, 'add', `Added "${question.name}" (${question.subject})`);
        return question;
    }

    function addPracticeQuestions(groups, dailyLimit) {
        // Support both old signature (topic, entries, dailyLimit) and new (groups, dailyLimit)
        if (typeof groups === 'string') {
            groups = [{ topic: groups, entries: arguments[1] || [] }];
            dailyLimit = arguments[2] || dailyLimit;
        }
        if (!Array.isArray(groups)) groups = [groups];
        const startDate = todayStr();
        const allAdded = [];
        const planIds = [];
        let globalIndex = 0;

        for (const group of groups) {
            const topic = group.topic || 'Practice Questions';
            const entries = group.entries || [];
            if (!entries.length) continue;
            const planId = generateId();
            planIds.push(planId);
            const added = entries.map((entry, index) => initializeQuestion({
                name: entry.name,
                subject: topic,
                platform: entry.platformLink ? 'Online Course' : 'Other',
                platformLink: entry.platformLink,
                difficulty: entry.difficulty,
                status: 'Not Started',
                dateSolved: '',
                nextRevisionDate: null,
                practicePlanId: planId,
                practiceTopic: topic,
                practiceDate: addDays(startDate, Math.floor(globalIndex / dailyLimit))
            }));
            globalIndex += entries.length;
            allAdded.push(...added);
        }

        if (!allAdded.length) return planIds;
        saveWithActivity(KEYS.QUESTIONS, [...getQuestions(), ...allAdded], 'add', `Added ${allAdded.length} questions across ${planIds.length} ${planIds.length === 1 ? 'plan' : 'plans'}`);
        return planIds;
    }

    function updateQuestion(id, updates, activity) {
        const questions = getQuestions();
        const idx = questions.findIndex(q => q.id === id);
        if (idx === -1) return null;
        questions[idx] = { ...questions[idx], ...updates, updatedAt: new Date().toISOString() };
        if (activity) saveWithActivity(KEYS.QUESTIONS, questions, activity.type, activity.text);
        else saveQuestions(questions);
        return questions[idx];
    }

    function commitRevision(id, updates, xp, activityText) {
        const questions = getQuestions();
        const index = questions.findIndex(question => question.id === id);
        const current = questions[index];
        if (!current || current.status === 'Not Started' || current.status === 'Mastered') return null;
        const revised = { ...current, ...updates, updatedAt: new Date().toISOString() };
        questions[index] = revised;

        const day = revised.lastRevisionDate;
        const dailyLog = getDailyLog();
        const activity = { solved: 0, revised: 0, xpEarned: 0, ...dailyLog[day] };
        activity.revised++;
        activity.xpEarned += xp;
        dailyLog[day] = activity;

        const stats = getUserStats();
        stats.totalRevisions = (stats.totalRevisions || 0) + 1;
        saveRecords([
            [KEYS.QUESTIONS, questions],
            [KEYS.DAILY_LOG, dailyLog],
            [KEYS.USER_STATS, stats],
            [KEYS.ACTIVITY_LOG, nextActivityLog('revision', activityText)]
        ]);
        return revised;
    }

    function deleteQuestion(id) {
        const questions = getQuestions();
        const remaining = questions.filter(q => q.id !== id);
        if (remaining.length === questions.length) return false;
        saveWithActivity(KEYS.QUESTIONS, remaining, 'delete', 'Deleted a question');
        return true;
    }

    function getQuestionById(id) {
        return getQuestions().find(q => q.id === id) || null;
    }

    // ── User Stats ──
    function getUserStats() {
        return { ...defaultUserStats(), ...load(KEYS.USER_STATS, {}) };
    }

    function saveUserStats(stats) {
        save(KEYS.USER_STATS, stats);
    }

    function updateUserStats(updates) {
        const stats = getUserStats();
        Object.assign(stats, updates);
        saveUserStats(stats);
        return stats;
    }

    // ── Settings ──
    function getSettings() {
        return normalizeSettings(load(KEYS.SETTINGS, defaultSettings));
    }

    function saveSettings(settings) {
        const normalizedSettings = normalizeSettings(settings);
        save(KEYS.SETTINGS, normalizedSettings);
    }

    // ── Activity Log ──
    function getActivityLog() {
        return load(KEYS.ACTIVITY_LOG, []);
    }

    function nextActivityLog(type, text) {
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
        return log;
    }

    function addActivity(type, text) {
        save(KEYS.ACTIVITY_LOG, nextActivityLog(type, text));
    }

    function saveWithActivity(key, value, type, text) {
        saveRecords([[key, value], [KEYS.ACTIVITY_LOG, nextActivityLog(type, text)]]);
    }

    function saveRecords(records) {
        try {
            writeStorageChanges(records.map(([key, value]) => [key, JSON.stringify(value)]));
        } catch (error) {
            console.error('Store: Could not save related records', error);
            throw new Error('Could not save changes in this browser. Check browser storage and try again.');
        }
    }

    // ── Daily Log (tracks per-day completions for streaks/heatmap) ──
    function getDailyLog() {
        return load(KEYS.DAILY_LOG, {});
    }

    function logDailyActivity(dateStr, type) {
        const log = getDailyLog();
        log[dateStr] = { solved: 0, revised: 0, xpEarned: 0, ...log[dateStr] };
        if (type === 'solved') log[dateStr].solved++;
        if (type === 'revised') log[dateStr].revised++;
        save(KEYS.DAILY_LOG, log);
        return log;
    }

    function addDailyXP(dateStr, xp) {
        const log = getDailyLog();
        log[dateStr] = { solved: 0, revised: 0, xpEarned: 0, ...log[dateStr] };
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
            calendarEntries: getCalendarEntries(),
            syllabus: getSyllabi(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        }, null, 2);
    }

    function importData(json) {
        try {
            const data = JSON.parse(json);
            if (!isRecord(data)) return false;
            const validId = value => typeof value === 'string' && /^[a-z\d_-]+$/i.test(value);
            const validDate = value => {
                if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
                const date = new Date(`${value}T00:00:00Z`);
                return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
            };
            const optionalDate = value => value == null || value === '' || validDate(value);
            const optionalCount = value => value == null || (Number.isSafeInteger(value) && value >= 0);
            const stringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string');
            const identifiedRecords = (value, validate) => Array.isArray(value) &&
                value.every(item => isRecord(item) && validId(item.id) && validate(item)) &&
                new Set(value.map(item => item.id)).size === value.length;
            const validators = {
                questions: value => identifiedRecords(value, question =>
                    ['name', 'subject', 'status', 'difficulty'].every(key => typeof question[key] === 'string') &&
                    (!question.practicePlanId || (validId(question.practicePlanId) && validDate(question.practiceDate))) &&
                    ['dateSolved', 'nextRevisionDate', 'lastRevisionDate'].every(key => optionalDate(question[key])) &&
                    ['revisionCycle', 'streak', 'xpEarned', 'timeTaken'].every(key => optionalCount(question[key])) &&
                    (question.easeFactor == null || (Number.isFinite(question.easeFactor) && question.easeFactor > 0)) &&
                    (question.tags == null || stringArray(question.tags)) &&
                    (question.revisionHistory == null || (Array.isArray(question.revisionHistory) &&
                        question.revisionHistory.every(revision => isRecord(revision) && optionalDate(revision.date))))),
                userStats: value => isRecord(value) &&
                    ['totalXP', 'level', 'currentStreak', 'longestStreak', 'totalRevisions'].every(key => optionalCount(value[key])) &&
                    optionalDate(value.lastActiveDate) && (value.badges == null || stringArray(value.badges)),
                activityLog: value => Array.isArray(value) && value.every(isRecord),
                settings: isRecord,
                dailyLog: value => isRecord(value) && Object.entries(value).every(([day, activity]) =>
                    validDate(day) && isRecord(activity) && ['solved', 'revised', 'xpEarned'].every(key => optionalCount(activity[key]))),
                calendarEntries: value => isRecord(value) && Object.entries(value).every(([day, entry]) =>
                    validDate(day) && isRecord(entry)),
                syllabus: value => identifiedRecords(value, syllabus =>
                    typeof syllabus.name === 'string' && typeof syllabus.stream === 'string' && optionalDate(syllabus.examDate) &&
                    Array.isArray(syllabus.topics) && syllabus.topics.every(topic => isRecord(topic) && typeof topic.name === 'string'))
            };
            const sections = Object.keys(validators).filter(key => Object.prototype.hasOwnProperty.call(data, key));
            if (!sections.length || sections.some(key => !validators[key](data[key]))) return false;

            const storageKeys = {
                questions: KEYS.QUESTIONS,
                userStats: KEYS.USER_STATS,
                activityLog: KEYS.ACTIVITY_LOG,
                settings: KEYS.SETTINGS,
                dailyLog: KEYS.DAILY_LOG,
                calendarEntries: KEYS.CALENDAR_ENTRIES,
                syllabus: KEYS.SYLLABUS
            };
            if (data.settings) data.settings = normalizeSettings(data.settings);
            if (data.questions) {
                data.questions = data.questions.map(question => ({
                    ...question,
                    revisionCycle: question.revisionCycle ?? 0,
                    revisionHistory: question.revisionHistory ?? [],
                    easeFactor: question.easeFactor ?? 2.5,
                    streak: question.streak ?? 0,
                    xpEarned: question.xpEarned ?? 0
                }));
            }
            writeStorageChanges(sections.map(section => [storageKeys[section], JSON.stringify(data[section])]));
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    function resetAllData() {
        try {
            writeStorageChanges(Object.values(KEYS).map(key => [key, null]));
        } catch (error) {
            console.error('Store: Could not reset data', error);
            throw new Error('Could not reset this browser’s study data. Check browser storage and try again.');
        }
    }

    // ── Auto-Delete Old Topics ──
    function deleteOldTopics(days) {
        if (!days || days <= 0) return 0;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString();

        const questions = getQuestions();
        const toDelete = questions.filter(q => {
            if (q.practicePlanId) return false;
            const lastTouched = q.updatedAt || q.createdAt;
            return lastTouched && lastTouched < cutoffStr;
        });

        if (toDelete.length === 0) return 0;

        const deletedIds = new Set(toDelete.map(q => q.id));
        const remaining = questions.filter(q => !deletedIds.has(q.id));
        saveWithActivity(KEYS.QUESTIONS, remaining, 'delete', `Auto-deleted ${toDelete.length} topic(s) older than ${days} day(s)`);
        return toDelete.length;
    }

    // ── Calendar Entries CRUD ──
    function getCalendarEntries() {
        return load(KEYS.CALENDAR_ENTRIES, {});
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

    // ── Syllabus CRUD ──
    function getSyllabi() {
        return load(KEYS.SYLLABUS, []);
    }

    function saveSyllabi(syllabi) {
        save(KEYS.SYLLABUS, syllabi);
    }

    function addSyllabus(syllabus) {
        const syllabi = getSyllabi();
        syllabus.id = generateId();
        syllabus.createdAt = new Date().toISOString();
        syllabus.updatedAt = new Date().toISOString();
        syllabi.push(syllabus);
        saveWithActivity(KEYS.SYLLABUS, syllabi, 'add', `Added syllabus "${syllabus.name}" (${syllabus.stream})`);
        return syllabus;
    }

    function updateSyllabus(id, updates) {
        const syllabi = getSyllabi();
        const idx = syllabi.findIndex(s => s.id === id);
        if (idx === -1) return null;
        syllabi[idx] = { ...syllabi[idx], ...updates, updatedAt: new Date().toISOString() };
        saveSyllabi(syllabi);
        return syllabi[idx];
    }

    function deleteSyllabus(id) {
        const syllabi = getSyllabi();
        const remaining = syllabi.filter(s => s.id !== id);
        if (remaining.length === syllabi.length) return null;
        saveWithActivity(KEYS.SYLLABUS, remaining, 'delete', 'Deleted a syllabus');
    }

    function toggleSyllabusTopic(syllabusId, topicIndex) {
        const syllabi = getSyllabi();
        const syl = syllabi.find(s => s.id === syllabusId);
        if (!syl || !syl.topics[topicIndex]) return null;
        
        syl.topics[topicIndex].completed = !syl.topics[topicIndex].completed;
        syl.topics[topicIndex].completedDate = syl.topics[topicIndex].completed 
            ? todayStr()
            : null;
        syl.updatedAt = new Date().toISOString();
        saveSyllabi(syllabi);
        return syl;
    }

    function addSyllabusTopic(syllabusId, topicName) {
        const syllabi = getSyllabi();
        const syl = syllabi.find(s => s.id === syllabusId);
        if (!syl) return null;
        
        const newTopic = {
            name: topicName,
            completed: false,
            completedDate: null
        };
        
        syl.topics.push(newTopic);
        syl.updatedAt = new Date().toISOString();
        saveWithActivity(KEYS.SYLLABUS, syllabi, 'add', `Added topic "${topicName}" to ${syl.name}`);
        return syl;
    }

    function deleteSyllabusTopic(syllabusId, topicIndex) {
        const syllabi = getSyllabi();
        const syl = syllabi.find(s => s.id === syllabusId);
        if (!syl || !syl.topics[topicIndex]) return null;
        
        const topicName = syl.topics[topicIndex].name;
        syl.topics.splice(topicIndex, 1);
        syl.updatedAt = new Date().toISOString();
        saveWithActivity(KEYS.SYLLABUS, syllabi, 'delete', `Removed topic "${topicName}" from ${syl.name}`);
        return syl;
    }

    // ── Helpers ──
    function generateId() {
        return globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function dateKey(date = new Date()) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    }

    function todayStr() {
        return dateKey();
    }

    function addDays(date, days) {
        const result = new Date(`${date}T00:00:00Z`);
        result.setUTCDate(result.getUTCDate() + days);
        return result.toISOString().slice(0, 10);
    }

    // ── Public API ──
    return {
        getQuestions,
        saveQuestions,
        addQuestion,
        addPracticeQuestions,
        updateQuestion,
        commitRevision,
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
        getSyllabi,
        addSyllabus,
        updateSyllabus,
        deleteSyllabus,
        toggleSyllabusTopic,
        addSyllabusTopic,
        deleteSyllabusTopic,
        exportData,
        importData,
        resetAllData,
        deleteOldTopics,
        todayStr,
        dateKey,
        addDays,
        generateId,
        KEYS,
        // Alias used by modern-features.js
        getAllQuestions: getQuestions
    };
})();
