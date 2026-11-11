/* ═══════════════════════════════════════════════════════
   DSA Tracker — Gamification System
   XP, Levels, Streaks, Badges, Milestones
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Gamification = (() => {

    // ── Level Thresholds (XP needed per level) ──
    // XP = 100 * level^1.5 (cumulative)
    function xpForLevel(level) {
        return Math.round(100 * Math.pow(level, 1.5));
    }

    function getLevelFromXP(totalXP) {
        totalXP = Number.isFinite(totalXP) && totalXP > 0 ? Math.min(totalXP, Number.MAX_SAFE_INTEGER) : 0;
        let level = 1;
        let cumulative = 0;
        while (true) {
            const needed = xpForLevel(level);
            if (cumulative + needed > totalXP) break;
            cumulative += needed;
            level++;
        }
        return {
            level,
            currentLevelXP: totalXP - cumulative,
            xpForNextLevel: xpForLevel(level),
            totalXP,
            progress: (totalXP - cumulative) / xpForLevel(level)
        };
    }

    // ── XP Awards ──
    function awardXP(amount, reason) {
        const stats = DSA.Store.getUserStats();
        stats.totalXP = (stats.totalXP || 0) + amount;

        const levelInfo = getLevelFromXP(stats.totalXP);
        const previousLevel = stats.level || 1;
        stats.level = levelInfo.level;
        DSA.Store.saveUserStats(stats);

        // Check for level up
        if (levelInfo.level > previousLevel) {
            onLevelUp(levelInfo.level);
        }

        return { amount, reason, newTotal: stats.totalXP, levelInfo };
    }

    function onLevelUp(newLevel) {
        DSA.Store.addActivity('levelup', `Leveled up to Level ${newLevel}! 🎉`);
        // Trigger confetti (will be called by app.js)
        if (DSA.App && DSA.App.showConfetti) {
            DSA.App.showConfetti();
        }
        if (DSA.App && DSA.App.showToast) {
            DSA.App.showToast(`🎉 Level Up! You're now Level ${newLevel}!`, 'success');
        }
    }

    // ── Streak System ──
    function getCurrentStreak(activity = DSA.RevisionEngine.getStudyActivity(), today = DSA.Store.todayStr()) {
        let day = activity.has(today) ? today : DSA.Store.addDays(today, -1);
        let streak = 0;
        while (activity.has(day)) {
            streak++;
            day = DSA.Store.addDays(day, -1);
        }
        return streak;
    }

    function updateStreak() {
        const stats = DSA.Store.getUserStats();
        const today = DSA.Store.todayStr();
        const activity = DSA.RevisionEngine.getStudyActivity(today);
        const streak = getCurrentStreak(activity, today);
        if (!activity.has(today)) return streak;

        const firstActivityToday = stats.lastActiveDate !== today;
        if (!firstActivityToday && stats.currentStreak === streak) return streak;

        stats.currentStreak = streak;
        stats.lastActiveDate = today;
        stats.longestStreak = Math.max(stats.longestStreak || 0, streak);
        DSA.Store.saveUserStats(stats);

        if (!firstActivityToday) return streak;
        // Streak milestone XP
        if (streak === 7) awardStreakBonus(7, 50);
        else if (streak === 14) awardStreakBonus(14, 100);
        else if (streak === 30) awardStreakBonus(30, 200);
        else if (streak === 60) awardStreakBonus(60, 400);
        else if (streak === 100) awardStreakBonus(100, 800);

        return streak;
    }

    function awardStreakBonus(days, xp) {
        awardXP(xp, `${days}-day streak bonus`);
        DSA.Store.addActivity('streak', `🔥 ${days}-day streak! +${xp} XP bonus!`);
        if (DSA.App && DSA.App.showToast) {
            DSA.App.showToast(`🔥 ${days}-day streak achieved! +${xp} XP!`, 'success');
        }
    }

    // ── Badge Definitions ──
    const BADGES = [
        { id: 'first_question', name: 'First Step', icon: '🌱', description: 'Practice your first question', check: (s, q) => q.length >= 1 },
        { id: 'ten_questions', name: 'Getting Started', icon: '📝', description: 'Practice 10 questions', check: (s, q) => q.length >= 10 },
        { id: 'fifty_questions', name: 'Committed', icon: '💪', description: 'Practice 50 questions', check: (s, q) => q.length >= 50 },
        { id: 'hundred_questions', name: 'Centurion', icon: '🏛️', description: 'Practice 100 questions', check: (s, q) => q.length >= 100 },
        { id: 'five_hundred', name: 'Knowledge Warrior', icon: '⚔️', description: 'Practice 500 questions', check: (s, q) => q.length >= 500 },
        { id: 'first_revision', name: 'Revisor', icon: '🔄', description: 'Complete first revision', check: (s) => (s.totalRevisions || 0) >= 1 },
        { id: 'fifty_revisions', name: 'Diligent', icon: '📖', description: 'Complete 50 revisions', check: (s) => (s.totalRevisions || 0) >= 50 },
        { id: 'two_hundred_rev', name: 'Review Master', icon: '🎓', description: 'Complete 200 revisions', check: (s) => (s.totalRevisions || 0) >= 200 },
        { id: 'first_mastered', name: 'First Mastery', icon: '⭐', description: 'Master your first topic', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 1 },
        { id: 'ten_mastered', name: 'Scholar', icon: '🏅', description: 'Master 10 topics', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 10 },
        { id: 'fifty_mastered', name: 'Grandmaster', icon: '👑', description: 'Master 50 topics', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 50 },
        { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7-day streak', check: (s) => (s.longestStreak || 0) >= 7 },
        { id: 'streak_30', name: 'Monthly Dedication', icon: '🌟', description: '30-day streak', check: (s) => (s.longestStreak || 0) >= 30 },
        { id: 'streak_100', name: 'Unstoppable', icon: '💎', description: '100-day streak', check: (s) => (s.longestStreak || 0) >= 100 },
        { id: 'level_5', name: 'Rising Star', icon: '🌠', description: 'Reach Level 5', check: (s) => (s.level || 1) >= 5 },
        { id: 'level_10', name: 'Veteran', icon: '🏆', description: 'Reach Level 10', check: (s) => (s.level || 1) >= 10 },
        { id: 'level_25', name: 'Legend', icon: '🐉', description: 'Reach Level 25', check: (s) => (s.level || 1) >= 25 },
        { id: 'all_subjects', name: 'Well-Rounded', icon: '🌐', description: 'Study from 5+ subjects', check: (s, q) => new Set(q.map(x => x.subject)).size >= 5 },
        { id: 'hard_master', name: 'Hard Hitter', icon: '🥊', description: 'Master 5 Hard topics', check: (s, q) => q.filter(x => x.difficulty === 'Hard' && x.status === 'Mastered').length >= 5 },
        { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Study 5 topics in <15min each', check: (s, q) => q.filter(x => x.timeTaken && x.timeTaken <= 15).length >= 5 },
    ];

    /**
     * Check and award new badges.
     */
    function checkBadges() {
        const stats = DSA.Store.getUserStats();
        const questions = DSA.Store.getQuestions().filter(question => question.status !== 'Not Started');
        const currentBadges = new Set(stats.badges || []);
        const newBadges = [];

        BADGES.forEach(badge => {
            if (!currentBadges.has(badge.id) && badge.check(stats, questions)) {
                currentBadges.add(badge.id);
                newBadges.push(badge);
            }
        });

        if (newBadges.length > 0) {
            stats.badges = Array.from(currentBadges);
            DSA.Store.saveUserStats(stats);

            newBadges.forEach(badge => {
                awardXP(30, `Badge: ${badge.name}`);
                DSA.Store.addActivity('badge', `Earned ${badge.name}`);
            });
        }

        return newBadges;
    }

    /**
     * Get all badges with unlock status.
     */
    function getAllBadges() {
        const stats = DSA.Store.getUserStats();
        const unlocked = new Set(stats.badges || []);
        return BADGES.map(b => ({
            ...b,
            unlocked: unlocked.has(b.id)
        }));
    }

    /**
     * Get streak data for the last 7 days.
     */
    function getStreakWeek() {
        const activity = DSA.RevisionEngine.getStudyActivity();
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = DSA.Store.dateKey(d);
            days.push({
                date: dateStr,
                dayName: dayNames[d.getDay()],
                isToday: i === 0,
                active: activity.has(dateStr)
            });
        }
        return days;
    }

    /**
     * Confetti effect for celebrations.
     */
    function triggerConfetti() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#6c63ff', '#2dd4a8', '#f6ad55', '#f56565', '#63b3ed', '#9b94ff'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 8,
                opacity: 1
            });
        }

        let frame = 0;
        const maxFrames = 150;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.rotation += p.rotSpeed;
                p.opacity = Math.max(0, 1 - frame / maxFrames);

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        animate();
    }

    // ── Public API ──
    return {
        xpForLevel,
        getLevelFromXP,
        awardXP,
        updateStreak,
        getCurrentStreak,
        checkStreak: getCurrentStreak,
        checkBadges,
        getAllBadges,
        getStreakWeek,
        triggerConfetti,
        BADGES
    };
})();
