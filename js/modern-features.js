/* ═══════════════════════════════════════════════════════
   MODERN FEATURES - Timer, Calendar, Enhanced UI
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.ModernFeatures = (() => {
    let timerInterval = null;
    let elapsedTime = 0;
    let timerStartedAt = null;

    // ════════════ TIMER FUNCTIONS ════════════
    function initTimer() {
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        const resetBtn = document.getElementById('timer-reset');
        const display = document.getElementById('timer-display');

        if (!startBtn || !pauseBtn || !resetBtn || !display) return;

        startBtn.addEventListener('click', () => {
            if (timerStartedAt === null) {
                timerStartedAt = performance.now();
                startBtn.classList.add('active');
                pauseBtn.classList.remove('active');
                
                timerInterval = setInterval(updateTimerDisplay, 250);
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (timerStartedAt !== null) {
                elapsedTime += performance.now() - timerStartedAt;
                timerStartedAt = null;
                clearInterval(timerInterval);
                updateTimerDisplay();
                pauseBtn.classList.add('active');
                startBtn.classList.remove('active');
            }
        });

        resetBtn.addEventListener('click', () => {
            timerStartedAt = null;
            clearInterval(timerInterval);
            elapsedTime = 0;
            updateTimerDisplay();
            startBtn.classList.remove('active');
            pauseBtn.classList.remove('active');
        });
    }

    function updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (!display) return;

        const runningTime = timerStartedAt === null ? 0 : performance.now() - timerStartedAt;
        const timerSeconds = Math.floor((elapsedTime + runningTime) / 1000);
        const hours = Math.floor(timerSeconds / 3600);
        const minutes = Math.floor((timerSeconds % 3600) / 60);
        const seconds = timerSeconds % 60;

        display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    // ════════════ CALENDAR FUNCTIONS ════════════
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDateKey = null;

    function initCalendar() {
        const prevBtn = document.getElementById('cal-prev-month');
        const nextBtn = document.getElementById('cal-next-month');

        if (!prevBtn || !nextBtn) return;

        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });

        // Calendar entry modal handlers
        document.getElementById('calendar-entry-close').addEventListener('click', closeCalendarEntryModal);
        document.getElementById('calendar-entry-cancel').addEventListener('click', closeCalendarEntryModal);
        document.getElementById('calendar-entry-save').addEventListener('click', saveCalendarEntry);
        document.getElementById('calendar-entry-delete').addEventListener('click', deleteCalendarEntry);

        // Close modal on overlay click
        document.getElementById('calendar-entry-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('calendar-entry-modal')) {
                closeCalendarEntryModal();
            }
        });
        document.getElementById('calendar-entry-modal').addEventListener('cancel', event => {
            event.preventDefault();
            closeCalendarEntryModal();
        });

        renderCalendar();
    }

    function renderCalendar() {
        const monthYear = document.getElementById('cal-month-year');
        const container = document.getElementById('calendar-days-container');

        if (!monthYear || !container) return;

        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        monthYear.textContent = `${months[currentMonth]} ${currentYear}`;

        // Calculate first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();
        const calendarEntries = DSA.Store.getCalendarEntries();

        container.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            container.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('button');
            dayEl.type = 'button';
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = calendarEntries[dateKey];
            dayEl.setAttribute('aria-label', new Date(currentYear, currentMonth, day).toLocaleDateString(undefined, { dateStyle: 'long' }));

            // Mark today
            if (day === today.getDate() && 
                currentMonth === today.getMonth() && 
                currentYear === today.getFullYear()) {
                dayEl.classList.add('today');
                dayEl.setAttribute('aria-current', 'date');
            }

            // Mark if has entry
            if (entry) {
                if (entry.notes || entry.tasks) {
                    dayEl.classList.add('has-task');
                }
                if (entry.important) {
                    dayEl.classList.add('important');
                }
            }

            dayEl.addEventListener('click', () => {
                if (!dayEl.classList.contains('disabled')) {
                    openCalendarEntryModal(dateKey);
                }
            });

            container.appendChild(dayEl);
        }
    }

    function openCalendarEntryModal(dateKey) {
        selectedDateKey = dateKey;
        const entry = DSA.Store.getCalendarEntry(dateKey);
        const date = new Date(`${dateKey}T12:00:00`);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('calendar-entry-title').textContent = 
            `📅 ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

        if (entry) {
            document.getElementById('cal-entry-important').checked = entry.important || false;
            document.getElementById('cal-entry-notes').value = entry.notes || '';
            document.getElementById('cal-entry-tasks').value = entry.tasks || '';
            document.getElementById('calendar-entry-delete').style.display = '';
        } else {
            document.getElementById('cal-entry-important').checked = false;
            document.getElementById('cal-entry-notes').value = '';
            document.getElementById('cal-entry-tasks').value = '';
            document.getElementById('calendar-entry-delete').style.display = 'none';
        }

        document.getElementById('calendar-entry-modal').showModal();
    }

    function closeCalendarEntryModal() {
        document.getElementById('calendar-entry-modal').close();
        selectedDateKey = null;
    }

    function saveCalendarEntry() {
        if (!selectedDateKey) return;

        const important = document.getElementById('cal-entry-important').checked;
        const notes = document.getElementById('cal-entry-notes').value.trim();
        const tasks = document.getElementById('cal-entry-tasks').value.trim();

        try {
            if (!important && !notes && !tasks) {
                DSA.Store.deleteCalendarEntry(selectedDateKey);
            } else {
                DSA.Store.saveCalendarEntry(selectedDateKey, { important, notes, tasks });
            }
        } catch (error) {
            DSA.App?.showToast?.(error.message, 'error');
            return;
        }

        renderCalendar();
        DSA.App?.refreshPlannerSchedule?.();
        closeCalendarEntryModal();
        
        if (typeof DSA.App !== 'undefined' && DSA.App.showToast) {
            DSA.App.showToast('Calendar entry saved!', 'success');
        }
    }

    function deleteCalendarEntry() {
        if (!selectedDateKey) return;
        if (!confirm('Delete this calendar entry?')) return;

        try {
            DSA.Store.deleteCalendarEntry(selectedDateKey);
        } catch (error) {
            DSA.App?.showToast?.(error.message, 'error');
            return;
        }
        renderCalendar();
        DSA.App?.refreshPlannerSchedule?.();
        closeCalendarEntryModal();
        
        if (typeof DSA.App !== 'undefined' && DSA.App.showToast) {
            DSA.App.showToast('Calendar entry deleted.', 'info');
        }
    }

    // ════════════ PROGRESS BY TOPIC ════════════
    function updateTopicProgress() {
        const container = document.getElementById('topic-progress-section');
        if (!container) return;

        const questions = DSA.Store?.getAllQuestions?.() || [];
        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">Add questions to see subject progress</p>';
            return;
        }

        // Group questions by subject
        const subjectData = Object.create(null);
        questions.forEach(q => {
            const subject = q.subject || 'Other';
            if (!subjectData[subject]) {
                subjectData[subject] = { total: 0, mastered: 0 };
            }
            subjectData[subject].total++;
            if (q.status === 'Mastered') {
                subjectData[subject].mastered++;
            }
        });

        // Create progress bars
        let html = '';
        Object.entries(subjectData)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10) // Top 10 subjects
            .forEach(([subject, data]) => {
                const percentage = Math.round((data.mastered / data.total) * 100);
                html += `
                    <div class="progress-item">
                        <div class="progress-header">
                            <div class="progress-label">
                                <span>${escapeHtml(subject)}</span>
                            </div>
                            <div class="progress-value">${data.mastered}/${data.total} • ${percentage}%</div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = html;
    }

    // ════════════ DIFFICULTY DISTRIBUTION ════════════
    function updateDifficultyDistribution() {
        const questions = DSA.Store?.getAllQuestions?.() || [];
        
        let easy = 0, medium = 0, hard = 0;
        questions.forEach(q => {
            if (q.difficulty === 'Easy') easy++;
            else if (q.difficulty === 'Medium') medium++;
            else if (q.difficulty === 'Hard') hard++;
        });

        const easyEl = document.getElementById('diff-easy-count');
        const mediumEl = document.getElementById('diff-medium-count');
        const hardEl = document.getElementById('diff-hard-count');

        if (easyEl) easyEl.textContent = easy;
        if (mediumEl) mediumEl.textContent = medium;
        if (hardEl) hardEl.textContent = hard;
    }

    // ════════════ COMPANY TAGS DISPLAY ════════════
    function displayCompanyTags(companies) {
        if (!companies) return '';
        
        const companyList = companies.split(',').map(c => c.trim());
        const companyClasses = {
            'google': 'google',
            'meta': 'meta',
            'facebook': 'meta',
            'amazon': 'amazon',
            'microsoft': 'microsoft',
            'apple': 'apple',
            'netflix': 'netflix'
        };

        return companyList.map(company => {
            const lowerCompany = company.toLowerCase();
            const className = companyClasses[lowerCompany] || 'default';
            return `<span class="company-tag ${className}">${company}</span>`;
        }).join('');
    }

    // ════════════ CODE SNIPPET DISPLAY ════════════
    function displayCodeSnippet(code, language = 'javascript') {
        if (!code) return '';

        return `
            <div class="code-snippet">
                <div class="code-header">
                    <span class="code-language">${language}</span>
                    <button class="code-copy-btn" onclick="DSA.ModernFeatures.copyCode(this)">
                        Copy Code
                    </button>
                </div>
                <pre class="code-content">${escapeHtml(code)}</pre>
            </div>
        `;
    }

    function copyCode(button) {
        const codeContent = button.closest('.code-snippet').querySelector('.code-content');
        const text = codeContent.textContent;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.color = 'var(--success)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.color = '';
            }, 2000);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ════════════ GOAL TRACKER ════════════
    function updateGoalTracker(activity = DSA.RevisionEngine.getStudyActivity()) {
        const today = DSA.Store.todayStr();
        const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
        const weekStart = DSA.Store.addDays(today, -dayOfWeek);
        const target = 10; // Default weekly goal
        let completed = 0;
        for (const [date, day] of activity) {
            if (date >= weekStart && date <= today) completed += day.practiced;
        }
        const percentage = Math.min(Math.round((completed / target) * 100), 100);

        const targetEl = document.getElementById('goal-target');
        const completedEl = document.getElementById('goal-completed');
        const percentageEl = document.getElementById('goal-percentage');
        const progress = document.getElementById('goal-progress');

        if (targetEl) targetEl.textContent = target;
        if (completedEl) completedEl.textContent = completed;
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        
        if (progress) {
            progress.value = percentage;
            progress.setAttribute('aria-valuetext', `${completed} of ${target} questions practiced this week`);
        }
    }

    // ════════════ SKELETON LOADERS ════════════
    function showSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        `;
    }

    function hideSkeleton(containerId) {
        // Content will be replaced by actual data
    }

    // ════════════ TOOLTIPS ════════════
    function initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.classList.add('tooltip');
        });
    }

    // ════════════ INITIALIZE ALL ════════════
    function init() {
        initTimer();
        initCalendar();
        initTooltips();
        updateTopicProgress();
        updateDifficultyDistribution();
        updateGoalTracker();
    }

    // Public API
    return {
        init,
        renderCalendar,
        updateTopicProgress,
        updateDifficultyDistribution,
        updateGoalTracker,
        displayCompanyTags,
        displayCodeSnippet,
        copyCode,
        showSkeleton,
        hideSkeleton
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DSA.ModernFeatures.init();
    });
} else {
    DSA.ModernFeatures.init();
}
