/* ═══════════════════════════════════════════════════════
   DSA Tracker — Notifications Module
   Browser notifications, overdue alerts, reminders
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Notifications = (() => {
    let permission = 'default';

    /**
     * Request browser notification permission.
     */
    function requestPermission() {
        if (!('Notification' in window)) return Promise.resolve('denied');
        return Notification.requestPermission().then(p => {
            permission = p;
            return p;
        });
    }

    /**
     * Send a browser notification.
     */
    function send(title, body, options = {}) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const settings = DSA.Store.getSettings();
        if (!settings.notificationsEnabled) return;

        const notif = new Notification(title, {
            body,
            icon: options.icon || '⚡',
            badge: '⚡',
            tag: options.tag || 'dsa-tracker',
            silent: options.silent || false,
            ...options
        });

        notif.onclick = () => {
            window.focus();
            if (options.onClick) options.onClick();
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
                `You have ${overdue.length} overdue question${overdue.length > 1 ? 's' : ''} waiting for revision.`,
                { tag: 'overdue-alert' }
            );
        }

        if (dueToday.length > 0) {
            send(
                '📚 Revisions Due Today',
                `${dueToday.length} question${dueToday.length > 1 ? 's' : ''} scheduled for revision today.`,
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
        const dueToday = DSA.RevisionEngine.getDueToday();
        const stats = DSA.Store.getUserStats();

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
        if (stats.currentStreak > 0) {
            setTimeout(() => {
                if (DSA.App && DSA.App.showToast) {
                    DSA.App.showToast(
                        `🔥 ${stats.currentStreak}-day streak! Keep it going with ${dueToday.length} revisions today.`,
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

        dot.style.display = (overdue.length > 0 || dueToday.length > 0) ? 'block' : 'none';
    }

    /**
     * Initialize notifications system.
     */
    function init() {
        const settings = DSA.Store.getSettings();
        if (settings.notificationsEnabled && 'Notification' in window) {
            requestPermission();
        }
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
