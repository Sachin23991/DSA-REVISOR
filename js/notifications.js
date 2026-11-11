/* ═══════════════════════════════════════════════════════
   DSA Tracker — Notifications Module
   Browser notifications, overdue alerts, reminders
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Notifications = (() => {
    /**
     * Request browser notification permission.
     */
    async function requestPermission() {
        if (!('Notification' in window)) return 'denied';
        try { return await Notification.requestPermission(); }
        catch { return 'denied'; }
    }

    /**
     * Send a browser notification.
     */
    function send(title, body, options = {}) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const settings = DSA.Store.getSettings();
        if (!settings.notificationsEnabled) return;

        let notif;
        const { onClick, ...notificationOptions } = options;
        try {
            notif = new Notification(title, { body, tag: 'dsa-tracker', ...notificationOptions });
        } catch (error) {
            console.warn('Browser notifications are unavailable:', error);
            return;
        }

        notif.onclick = () => {
            window.focus();
            if (onClick) onClick();
            notif.close();
        };

        // Auto close after 8 seconds
        setTimeout(() => notif.close(), 8000);
        return notif;
    }

    /**
     * Check for overdue revisions and notify.
     */
    function checkOverdueAlerts() {
        const settings = DSA.Store.getSettings();
        if (!settings.overdueAlerts) return;

        const overdue = DSA.RevisionEngine.getOverdue();
        const dueToday = DSA.RevisionEngine.getDueExactlyToday();

        if (overdue.length > 0) {
            send(
                '⚠️ Overdue Revisions!',
                `You have ${overdue.length} overdue topic${overdue.length > 1 ? 's' : ''} waiting for revision.`,
                { tag: 'overdue-alert' }
            );
        }

        if (dueToday.length > 0) {
            send(
                '📚 Revisions Due Today',
                `${dueToday.length} topic${dueToday.length > 1 ? 's' : ''} scheduled for revision today.`,
                { tag: 'due-today' }
            );
        }

        return { overdue: overdue.length, dueToday: dueToday.length };
    }

    /**
     * Show login reminder (overdue + motivational).
     */
    function showLoginReminder() {
        const settings = DSA.Store.getSettings();
        const overdue = DSA.RevisionEngine.getOverdue();
        const dueToday = DSA.RevisionEngine.getDueExactlyToday();
        const streak = DSA.Gamification.getCurrentStreak();

        // Show in-app notification for overdue
        if (settings.overdueAlerts && overdue.length > 0) {
            setTimeout(() => {
                if (DSA.App && DSA.App.showToast) {
                    DSA.App.showToast(
                        `⚠️ You have ${overdue.length} overdue revision${overdue.length > 1 ? 's' : ''}! Time to catch up.`,
                        'warning'
                    );
                }
            }, 1500);
        }

        // Motivational message
        if (streak > 0 && dueToday.length > 0) {
            setTimeout(() => {
                if (DSA.App && DSA.App.showToast) {
                    DSA.App.showToast(
                        `🔥 ${streak}-day streak! ${dueToday.length} ${dueToday.length === 1 ? 'review is' : 'reviews are'} due today.`,
                        'info'
                    );
                }
            }, 3000);
        }

        // Browser notifications
        if (settings.notificationsEnabled) {
            checkOverdueAlerts();
        }
    }

    /**
     * Update notification dot visibility.
     */
    function updateNotificationDot() {
        const dot = document.getElementById('notif-dot');
        if (!dot) return;

        const overdue = DSA.RevisionEngine.getOverdue();
        const dueToday = DSA.RevisionEngine.getDueExactlyToday();

        const hasPractice = Boolean(DSA.PracticePlan?.getQueue().length);
        dot.style.display = (overdue.length > 0 || dueToday.length > 0 || hasPractice) ? 'block' : 'none';
    }

    /**
     * Initialize notifications system.
     */
    function init() {
        updateNotificationDot();
    }

    return {
        requestPermission,
        send,
        checkOverdueAlerts,
        showLoginReminder,
        updateNotificationDot,
        init
    };
})();
