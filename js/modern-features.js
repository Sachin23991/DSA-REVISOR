/* ═══════════════════════════════════════════════════════
   MODERN FEATURES - Timer, Calendar, Enhanced UI
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.ModernFeatures = (() => {
    let timerInterval = null;
    let timerSeconds = 0;
    let timerRunning = false;

    // ════════════ TIMER FUNCTIONS ════════════
    function initTimer() {
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        const resetBtn = document.getElementById('timer-reset');
        const display = document.getElementById('timer-display');

        if (!startBtn || !pauseBtn || !resetBtn || !display) return;

        startBtn.addEventListener('click', () => {
            if (!timerRunning) {
                timerRunning = true;
                startBtn.classList.add('active');
                pauseBtn.classList.remove('active');
                
                timerInterval = setInterval(() => {
                    timerSeconds++;
                    updateTimerDisplay();
                }, 1000);
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (timerRunning) {
                timerRunning = false;
                clearInterval(timerInterval);
                pauseBtn.classList.add('active');
                startBtn.classList.remove('active');
            }
        });

        resetBtn.addEventListener('click', () => {
            timerRunning = false;
            clearInterval(timerInterval);
            timerSeconds = 0;
            updateTimerDisplay();
            startBtn.classList.remove('active');
            pauseBtn.classList.remove('active');
        });
    }

    function updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (!display) return;

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
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = calendarEntries[dateKey];

            // Mark today
            if (day === today.getDate() && 
                currentMonth === today.getMonth() && 
                currentYear === today.getFullYear()) {
                dayEl.classList.add('today');
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
                    openCalendarEntryModal(dateKey, day);
                }
            });

            container.appendChild(dayEl);
        }
    }

    function openCalendarEntryModal(dateKey, day) {
        selectedDateKey = dateKey;
        const entry = DSA.Store.getCalendarEntry(dateKey);
        const date = new Date(dateKey);
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

        document.getElementById('calendar-entry-modal').classList.add('show');
    }

    function closeCalendarEntryModal() {
        document.getElementById('calendar-entry-modal').classList.remove('show');
        selectedDateKey = null;
    }

    function saveCalendarEntry() {
        if (!selectedDateKey) return;

        const important = document.getElementById('cal-entry-important').checked;
        const notes = document.getElementById('cal-entry-notes').value.trim();
        const tasks = document.getElementById('cal-entry-tasks').value.trim();

        if (!important && !notes && !tasks) {
            // If all empty, delete the entry
            DSA.Store.deleteCalendarEntry(selectedDateKey);
        } else {
            DSA.Store.saveCalendarEntry(selectedDateKey, {
                important,
                notes,
                tasks
            });
        }

        renderCalendar();
        closeCalendarEntryModal();
        
        if (typeof DSA.App !== 'undefined' && DSA.App.showToast) {
            DSA.App.showToast('Calendar entry saved!', 'success');
        }
    }

    function deleteCalendarEntry() {
        if (!selectedDateKey) return;
        if (!confirm('Delete this calendar entry?')) return;

        DSA.Store.deleteCalendarEntry(selectedDateKey);
        renderCalendar();
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
            container.innerHTML = '<p class="empty-state">Add topics to see subject progress</p>';
            return;
        }

        // Group questions by subject
        const subjectData = {};
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
                                <span>${subject}</span>
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
    function updateGoalTracker() {
        const questions = DSA.Store?.getAllQuestions?.() || [];
        const thisWeek = getThisWeekQuestions(questions);
        
        const target = 10; // Default weekly goal
        const completed = thisWeek.length;
        const percentage = Math.min(Math.round((completed / target) * 100), 100);

        const targetEl = document.getElementById('goal-target');
        const completedEl = document.getElementById('goal-completed');
        const percentageEl = document.getElementById('goal-percentage');
        const ringEl = document.getElementById('goal-ring');

        if (targetEl) targetEl.textContent = target;
        if (completedEl) completedEl.textContent = completed;
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        
        if (ringEl) {
            const circumference = 264; // 2 * π * r (r=42)
            const offset = circumference - (percentage / 100) * circumference;
            ringEl.style.strokeDashoffset = offset;
        }
    }

    function getThisWeekQuestions(questions) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        return questions.filter(q => {
            const qDate = new Date(q.dateSolved);
            return qDate >= weekStart;
        });
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
