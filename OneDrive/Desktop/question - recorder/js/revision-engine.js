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
        const nextDate = new Date(fromDate);
        nextDate.setDate(nextDate.getDate() + adjustedInterval);

        return nextDate.toISOString().split('T')[0];
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
        if (!question) return null;

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

        // If quality < 3, don't advance cycle (failed recall)
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

        // Save question
        DSA.Store.updateQuestion(questionId, updates);

        // Log activity
        DSA.Store.logDailyActivity(today, 'revised');
        DSA.Store.addDailyXP(today, xp);
        DSA.Store.addActivity('revision', `Revised "${question.name}" (Cycle ${newCycle}/${totalCycles}, Quality: ${quality}/5)`);

        // Update user stats
        const userStats = DSA.Store.getUserStats();
        userStats.totalRevisions = (userStats.totalRevisions || 0) + 1;
        DSA.Store.saveUserStats(userStats);

        return {
            question: { ...question, ...updates },
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
            if (q.status === 'Mastered') return false;
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
            if (q.status === 'Mastered') return false;
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
            if (q.status === 'Mastered') return false;
            return q.nextRevisionDate === today;
        });
    }

    /**
     * Get upcoming revisions (next 7 days, excluding today).
     */
    function getUpcoming(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];

        return DSA.Store.getQuestions().filter(q => {
            if (q.status === 'Mastered') return false;
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
            return q.lastRevisionDate === today;
        });
    }

    /**
     * Get total pending revisions (all non-mastered questions).
     */
    function getTotalPending() {
        return DSA.Store.getQuestions().filter(q => {
            return q.status !== 'Mastered' && q.nextRevisionDate;
        }).length;
    }

    /**
     * Calculate priority score for a question.
     * Higher = more urgent.
     */
    function getPriorityScore(question) {
        const today = new Date();
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
        const settings = DSA.Store.getSettings();
        const question = DSA.Store.getQuestionById(questionId);
        if (!question) return;

        const updates = {
            revisionCycle: 0,
            easeFactor: 2.5,
            streak: 0,
            status: 'Needs Revision',
            nextRevisionDate: DSA.Store.todayStr()
        };

        DSA.Store.updateQuestion(questionId, updates);
        DSA.Store.addActivity('reset', `Reset revisions for "${question.name}"`);
    }

    /**
     * Detect weak subjects based on average ease factor and quality.
     */
    function getWeakSubjects() {
        const questions = DSA.Store.getQuestions();
        const subjectMap = {};

        questions.forEach(q => {
            if (!subjectMap[q.subject]) {
                subjectMap[q.subject] = { total: 0, efSum: 0, qualitySum: 0, qualityCount: 0, mastered: 0 };
            }
            const s = subjectMap[q.subject];
            s.total++;
            s.efSum += (q.easeFactor || 2.5);
            if (q.status === 'Mastered') s.mastered++;

            (q.revisionHistory || []).forEach(r => {
                s.qualitySum += r.quality;
                s.qualityCount++;
            });
        });

        return Object.entries(subjectMap)
            .map(([name, data]) => ({
                name,
                total: data.total,
                avgEF: data.total > 0 ? data.efSum / data.total : 2.5,
                avgQuality: data.qualityCount > 0 ? data.qualitySum / data.qualityCount : 3,
                masteryPercent: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
                // Lower score = weaker
                strengthScore: data.qualityCount > 0
                    ? Math.round(((data.qualitySum / data.qualityCount) / 5) * 100)
                    : 50
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

    /**
     * Calculate productivity score for today.
     * Based on: completed revisions vs due, streak, XP earned.
     */
    function getProductivityScore() {
        const due = getDueToday().length;
        const completed = getCompletedToday().length;
        const settings = DSA.Store.getSettings();
        const goal = settings.dailyGoal || 5;

        if (due === 0 && completed === 0) return 100; // Nothing to do = perfect
        if (due === 0) return 100;

        const completionRate = Math.min(1, completed / Math.max(1, due));
        const goalRate = Math.min(1, completed / goal);

        return Math.round((completionRate * 0.7 + goalRate * 0.3) * 100);
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
        getProductivityScore
    };
})();
