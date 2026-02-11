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
    function updateStreak() {
        const stats = DSA.Store.getUserStats();
        const today = DSA.Store.todayStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (stats.lastActiveDate === today) {
            // Already active today, no change
            return stats.currentStreak;
        }

        if (stats.lastActiveDate === yesterdayStr) {
            // Consecutive day
            stats.currentStreak = (stats.currentStreak || 0) + 1;
        } else if (stats.lastActiveDate !== today) {
            // Streak broken (or first activity)
            stats.currentStreak = 1;
        }

        stats.lastActiveDate = today;
        stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);

        // Streak milestone XP
        if (stats.currentStreak === 7) awardStreakBonus(7, 50);
        else if (stats.currentStreak === 14) awardStreakBonus(14, 100);
        else if (stats.currentStreak === 30) awardStreakBonus(30, 200);
        else if (stats.currentStreak === 60) awardStreakBonus(60, 400);
        else if (stats.currentStreak === 100) awardStreakBonus(100, 800);

        DSA.Store.saveUserStats(stats);
        return stats.currentStreak;
    }

    function awardStreakBonus(days, xp) {
        awardXP(xp, `${days}-day streak bonus`);
        DSA.Store.addActivity('streak', `🔥 ${days}-day streak! +${xp} XP bonus!`);
        if (DSA.App && DSA.App.showToast) {
            DSA.App.showToast(`🔥 ${days}-day streak achieved! +${xp} XP!`, 'success');
        }
    }

    function checkStreak() {
        const stats = DSA.Store.getUserStats();
        const today = DSA.Store.todayStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if streak is still active
        if (stats.lastActiveDate && stats.lastActiveDate !== today && stats.lastActiveDate !== yesterdayStr) {
            // Streak was broken
            if (stats.currentStreak > 0) {
                DSA.Store.addActivity('streak-lost', `Streak of ${stats.currentStreak} days lost 😔`);
                stats.currentStreak = 0;
                DSA.Store.saveUserStats(stats);
            }
        }
        return stats.currentStreak || 0;
    }

    // ── Badge Definitions ──
    const BADGES = [
        { id: 'first_question', name: 'First Step', icon: '🌱', description: 'Log your first question', check: (s, q) => q.length >= 1 },
        { id: 'ten_questions', name: 'Getting Started', icon: '📝', description: 'Log 10 questions', check: (s, q) => q.length >= 10 },
        { id: 'fifty_questions', name: 'Committed', icon: '💪', description: 'Log 50 questions', check: (s, q) => q.length >= 50 },
        { id: 'hundred_questions', name: 'Centurion', icon: '🏛️', description: 'Log 100 questions', check: (s, q) => q.length >= 100 },
        { id: 'five_hundred', name: 'DSA Warrior', icon: '⚔️', description: 'Log 500 questions', check: (s, q) => q.length >= 500 },
        { id: 'first_revision', name: 'Revisor', icon: '🔄', description: 'Complete first revision', check: (s) => (s.totalRevisions || 0) >= 1 },
        { id: 'fifty_revisions', name: 'Diligent', icon: '📖', description: 'Complete 50 revisions', check: (s) => (s.totalRevisions || 0) >= 50 },
        { id: 'two_hundred_rev', name: 'Review Master', icon: '🎓', description: 'Complete 200 revisions', check: (s) => (s.totalRevisions || 0) >= 200 },
        { id: 'first_mastered', name: 'First Mastery', icon: '⭐', description: 'Master your first question', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 1 },
        { id: 'ten_mastered', name: 'Scholar', icon: '🏅', description: 'Master 10 questions', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 10 },
        { id: 'fifty_mastered', name: 'Grandmaster', icon: '👑', description: 'Master 50 questions', check: (s, q) => q.filter(x => x.status === 'Mastered').length >= 50 },
        { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7-day streak', check: (s) => (s.longestStreak || 0) >= 7 },
        { id: 'streak_30', name: 'Monthly Dedication', icon: '🌟', description: '30-day streak', check: (s) => (s.longestStreak || 0) >= 30 },
        { id: 'streak_100', name: 'Unstoppable', icon: '💎', description: '100-day streak', check: (s) => (s.longestStreak || 0) >= 100 },
        { id: 'level_5', name: 'Rising Star', icon: '🌠', description: 'Reach Level 5', check: (s) => (s.level || 1) >= 5 },
        { id: 'level_10', name: 'Veteran', icon: '🏆', description: 'Reach Level 10', check: (s) => (s.level || 1) >= 10 },
        { id: 'level_25', name: 'Legend', icon: '🐉', description: 'Reach Level 25', check: (s) => (s.level || 1) >= 25 },
        { id: 'all_subjects', name: 'Well-Rounded', icon: '🌐', description: 'Solve from 5+ subjects', check: (s, q) => new Set(q.map(x => x.subject)).size >= 5 },
        { id: 'hard_master', name: 'Hard Hitter', icon: '🥊', description: 'Master 5 Hard questions', check: (s, q) => q.filter(x => x.difficulty === 'Hard' && x.status === 'Mastered').length >= 5 },
        { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Solve 5 questions in <15min each', check: (s, q) => q.filter(x => x.timeTaken && x.timeTaken <= 15).length >= 5 },
    ];

    /**
     * Check and award new badges.
     */
    function checkBadges() {
        const stats = DSA.Store.getUserStats();
        const questions = DSA.Store.getQuestions();
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
                DSA.Store.addActivity('badge', `🏅 Earned badge: "${badge.name}"`);
                if (DSA.App && DSA.App.showToast) {
                    DSA.App.showToast(`${badge.icon} Badge Unlocked: ${badge.name}!`, 'success');
                }
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
        const dailyLog = DSA.Store.getDailyLog();
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = dailyLog[dateStr];
            days.push({
                date: dateStr,
                dayName: dayNames[d.getDay()],
                isToday: i === 0,
                active: log && (log.solved > 0 || log.revised > 0)
            });
        }
        return days;
    }

    /**
     * Confetti effect for celebrations.
     */
    function triggerConfetti() {
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
        checkStreak,
        checkBadges,
        getAllBadges,
        getStreakWeek,
        triggerConfetti,
        BADGES
    };
})();
