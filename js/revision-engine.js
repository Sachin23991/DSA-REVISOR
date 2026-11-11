/* ═══════════════════════════════════════════════════════
   DSA Tracker — Spaced Revision Engine (Modified SM-2)
   
   Based on SuperMemo SM-2 algorithm with adaptations:
   - 15 default revision cycles  
   - Configurable base intervals
   - Adaptive spacing via ease factor
   - Overdue detection & priority scoring
   - Performance-based interval adjustment
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.RevisionEngine = (() => {

    /**
     * Calculate the next revision date for a question.
     * Uses modified SM-2: interval = baseInterval[cycle] * easeFactor
     */
    function calculateNextDate(question, settings) {
        const baseIntervals = settings.baseIntervals || [0,1,3,7,14,21,30,45,60,90,120,150,180,210,240];
        const cycle = question.revisionCycle || 0;
        const ef = question.easeFactor || 2.5;
        const totalCycles = settings.totalCycles || 15;

        if (cycle >= totalCycles) {
            // All cycles done — mark as mastered, no more revisions
            return null;
        }

        // Get base interval for current cycle, extrapolate if needed
        let baseInterval;
        if (cycle < baseIntervals.length) {
            baseInterval = baseIntervals[cycle];
        } else {
            // Extrapolate: last known interval * growth factor
            const lastKnown = baseIntervals[baseIntervals.length - 1];
            const growthFactor = 1.5;
            baseInterval = Math.round(lastKnown * Math.pow(growthFactor, cycle - baseIntervals.length + 1));
        }

        // Apply ease factor scaling (normalize around 2.5)
        const adjustedInterval = Math.max(1, Math.round(baseInterval * (ef / 2.5)));

        // Calculate from the last revision date or date solved
        const fromDate = question.lastRevisionDate || question.dateSolved || DSA.Store.todayStr();
        return DSA.Store.addDays(fromDate, adjustedInterval);
    }

    /**
     * Update ease factor based on quality rating (SM-2 formula).
     * q: 1-5 quality rating
     * Returns new ease factor (minimum 1.3)
     */
    function updateEaseFactor(currentEF, quality) {
        // SM-2: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        const q = Math.max(1, Math.min(5, quality));
        let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        return Math.max(1.3, Math.round(newEF * 100) / 100);
    }

    /**
     * Process a completed revision.
     * Returns updated question object and XP earned.
     */
    function completeRevision(questionId, quality, timeTaken, notes) {
        const settings = DSA.Store.getSettings();
        const question = DSA.Store.getQuestionById(questionId);
        if (!question || question.status === 'Not Started' || question.status === 'Mastered') return null;

        const today = DSA.Store.todayStr();

        // Update ease factor
        const newEF = updateEaseFactor(question.easeFactor || 2.5, quality);

        // Add to revision history
        const revisionEntry = {
            date: today,
            quality,
            timeTaken: timeTaken || 0,
            notes: notes || '',
            cycle: question.revisionCycle + 1
        };
        const history = [...(question.revisionHistory || []), revisionEntry];

        // Update cycle count
        let newCycle = question.revisionCycle + 1;
        const totalCycles = settings.totalCycles || 15;

        // Failed recall moves the question back one cycle.
        if (quality < 3) {
            newCycle = Math.max(0, question.revisionCycle - 1);
        }

        // Update streak
        const newStreak = quality >= 3 ? (question.streak || 0) + 1 : 0;

        // Determine new status
        let newStatus = question.status;
        if (newCycle >= totalCycles) {
            newStatus = 'Mastered';
        } else if (quality < 3) {
            newStatus = 'Needs Revision';
        } else {
            newStatus = 'Solved';
        }

        // Calculate XP
        const xp = calculateRevisionXP(quality, question.difficulty, newCycle);

        // Build updated question
        const updates = {
            easeFactor: newEF,
            revisionCycle: Math.min(newCycle, totalCycles),
            revisionHistory: history,
            lastRevisionDate: today,
            streak: newStreak,
            status: newStatus,
            xpEarned: (question.xpEarned || 0) + xp
        };

        // Calculate next revision date
        const tempQuestion = { ...question, ...updates };
        updates.nextRevisionDate = calculateNextDate(tempQuestion, settings);

        const revised = DSA.Store.commitRevision(
            questionId, updates, xp,
            `Revised "${question.name}" (Cycle ${newCycle}/${totalCycles}, Quality: ${quality}/5)`
        );
        if (!revised) return null;

        return {
            question: revised,
            xpEarned: xp,
            newCycle,
            totalCycles,
            mastered: newStatus === 'Mastered'
        };
    }

    /**
     * Calculate XP earned for a revision.
     */
    function calculateRevisionXP(quality, difficulty, cycle) {
        const baseXP = { 'Easy': 10, 'Medium': 15, 'Hard': 25 };
        let xp = baseXP[difficulty] || 10;

        // Quality bonus
        xp += (quality - 3) * 3;

        // Cycle progression bonus
        xp += Math.floor(cycle / 3) * 2;

        // Minimum 5 XP
        return Math.max(5, xp);
    }

    /**
     * Get all questions due for revision today.
     */
    function getDueToday() {
        const today = DSA.Store.todayStr();
        return DSA.Store.getQuestions().filter(q => {
            if (q.status === 'Mastered' || q.status === 'Not Started') return false;
            if (!q.nextRevisionDate) return false;
            return q.nextRevisionDate <= today;
        });
    }

    /**
     * Get overdue questions (due date < today).
     */
    function getOverdue() {
        const today = DSA.Store.todayStr();
        return DSA.Store.getQuestions().filter(q => {
            if (q.status === 'Mastered' || q.status === 'Not Started') return false;
            if (!q.nextRevisionDate) return false;
            return q.nextRevisionDate < today;
        });
    }

    /**
     * Get questions strictly due today (not overdue).
     */
    function getDueExactlyToday() {
        const today = DSA.Store.todayStr();
        return DSA.Store.getQuestions().filter(q => {
            if (q.status === 'Mastered' || q.status === 'Not Started') return false;
            return q.nextRevisionDate === today;
        });
    }

    /**
     * Get upcoming revisions (next 7 days, excluding today).
     */
    function getUpcoming(days = 7) {
        const todayStr = DSA.Store.todayStr();
        const futureStr = DSA.Store.addDays(todayStr, days);

        return DSA.Store.getQuestions().filter(q => {
            if (q.status === 'Mastered' || q.status === 'Not Started') return false;
            if (!q.nextRevisionDate) return false;
            return q.nextRevisionDate > todayStr && q.nextRevisionDate <= futureStr;
        }).sort((a, b) => a.nextRevisionDate.localeCompare(b.nextRevisionDate));
    }

    /**
     * Get questions revised today.
     */
    function getCompletedToday() {
        const today = DSA.Store.todayStr();
        return DSA.Store.getQuestions().filter(q => {
            return q.lastRevisionDate === today || q.revisionHistory?.some(entry => entry.date === today);
        });
    }

    /**
     * Get total pending revisions (all non-mastered questions).
     */
    function getTotalPending() {
        return DSA.Store.getQuestions().filter(q => {
            return q.status !== 'Mastered' && q.status !== 'Not Started' && q.nextRevisionDate;
        }).length;
    }

    /**
     * Calculate priority score for a question.
     * Higher = more urgent.
     */
    function getPriorityScore(question) {
        const today = new Date(DSA.Store.todayStr());
        const dueDate = new Date(question.nextRevisionDate);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        let score = 0;

        // Overdue penalty (major factor)
        if (daysOverdue > 0) {
            score += daysOverdue * 10;
        }

        // Low ease factor = harder question = higher priority
        score += (3.0 - (question.easeFactor || 2.5)) * 20;

        // Low streak = less consistent = higher priority
        score += Math.max(0, 5 - (question.streak || 0)) * 3;

        // Difficulty weight
        const diffWeight = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        score += (diffWeight[question.difficulty] || 1) * 2;

        return Math.round(score);
    }

    /**
     * Reset revision cycle for a question.
     */
    function resetRevisionCycle(questionId) {
        const question = DSA.Store.getQuestionById(questionId);
        if (!question || question.status === 'Not Started') return null;

        const updates = {
            revisionCycle: 0,
            easeFactor: 2.5,
            streak: 0,
            status: 'Needs Revision',
            nextRevisionDate: DSA.Store.todayStr()
        };

        return DSA.Store.updateQuestion(questionId, updates, {
            type: 'reset',
            text: `Reset the revision cycle for "${question.name}"`
        });
    }

    /**
     * Detect weak subjects based on average ease factor and quality.
     */
    function getWeakSubjects() {
        const questions = DSA.Store.getQuestions();
        const subjectMap = Object.create(null);

        questions.forEach(q => {
            if (!subjectMap[q.subject]) {
                subjectMap[q.subject] = { total: 0, efSum: 0, qualitySum: 0, qualityCount: 0, mastered: 0 };
            }
            const s = subjectMap[q.subject];
            s.total++;
            s.efSum += (q.easeFactor || 2.5);
            if (q.status === 'Mastered') s.mastered++;

            (q.revisionHistory || []).forEach(r => {
                const quality = Number(r.quality);
                if (!Number.isFinite(quality) || quality < 1 || quality > 5) return;
                s.qualitySum += quality;
                s.qualityCount++;
            });
        });

        return Object.entries(subjectMap)
            .filter(([, data]) => data.qualityCount > 0)
            .map(([name, data]) => ({
                name,
                total: data.total,
                avgEF: data.total > 0 ? data.efSum / data.total : 2.5,
                avgQuality: data.qualitySum / data.qualityCount,
                masteryPercent: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
                // Lower score = weaker
                strengthScore: Math.round(data.qualitySum / data.qualityCount / 5 * 100)
            }))
            .sort((a, b) => a.strengthScore - b.strengthScore);
    }

    /**
     * Get priority revision list (sorted by urgency).
     */
    function getPriorityRevisions(limit = 10) {
        return getDueToday()
            .map(q => ({ ...q, priorityScore: getPriorityScore(q) }))
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, limit);
    }

    function getStudyActivity(today = DSA.Store.todayStr()) {
        const activity = new Map();

        function activityFor(date) {
            if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return null;
            if (!activity.has(date)) activity.set(date, { practiced: 0, reviewed: 0 });
            return activity.get(date);
        }

        for (const question of DSA.Store.getQuestions()) {
            // Older logs recorded when a question was entered. The question holds the chosen study date.
            const practice = question.status !== 'Not Started' && activityFor(question.dateSolved);
            if (practice) practice.practiced++;

            const history = question.revisionHistory || [];
            for (const entry of history) {
                const review = activityFor(entry.date);
                if (review) review.reviewed++;
            }
            if (question.lastRevisionDate && !history.some(entry => entry.date === question.lastRevisionDate)) {
                const review = activityFor(question.lastRevisionDate);
                if (review) review.reviewed++;
            }
        }

        // The review log preserves activity when questions are deleted. Histories fill gaps in older backups.
        for (const [date, log] of Object.entries(DSA.Store.getDailyLog() || {})) {
            const loggedReviews = Number(log?.revised);
            if (!Number.isSafeInteger(loggedReviews) || loggedReviews <= 0) continue;
            const review = activityFor(date);
            if (review) review.reviewed = Math.max(review.reviewed, loggedReviews);
        }
        return activity;
    }

    function getDailyReviewProgress(today = DSA.Store.todayStr(), activity = getStudyActivity(today)) {
        const { dailyGoal } = DSA.Store.getSettings();
        const completed = activity.get(today)?.reviewed || 0;
        return { completed, goal: dailyGoal, percentage: Math.min(100, Math.round(completed / dailyGoal * 100)) };
    }

    function getProductivityScore() {
        return getDailyReviewProgress().percentage;
    }

    // ── Public API ──
    return {
        calculateNextDate,
        updateEaseFactor,
        completeRevision,
        calculateRevisionXP,
        getDueToday,
        getOverdue,
        getDueExactlyToday,
        getUpcoming,
        getCompletedToday,
        getTotalPending,
        getPriorityScore,
        resetRevisionCycle,
        getWeakSubjects,
        getPriorityRevisions,
        getStudyActivity,
        getDailyReviewProgress,
        getProductivityScore
    };
})();
