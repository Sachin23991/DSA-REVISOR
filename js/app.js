/* ═══════════════════════════════════════════════════════
   DSA Tracker — Main Application Controller
   Wires together all modules, handles UI interactions
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.App = (() => {
    let currentView = 'dashboard';
    let currentRevisionTab = 'due';
    let currentRevisionQuestionId = null;
    let displayedDate;

    // ════════════ INITIALIZATION ════════════
    function init() {
        loadTheme();
        setupThemeToggle();
        setupNavigation();
        setupQuestionForm();
        setupFilters();
        setupRevisionTabs();
        setupModals();
        setupSettings();
        setupExportImport();
        setupMiscUI();
        setupSyllabus();
        DSA.PracticePlan.init();
        setupStorageRefresh();

        // Set default date for form
        displayedDate = DSA.Store.todayStr();
        const studiedDate = document.getElementById('q-date');
        studiedDate.value = displayedDate;
        studiedDate.max = displayedDate;
        setInterval(refreshStudyDate, 60000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) refreshStudyDate();
        });

        updateDateDisplay();

        // Load initial view
        refreshDashboard();
        updateSidebarXP();

        // Notifications init
        DSA.Notifications.init();
        setTimeout(() => DSA.Notifications.showLoginReminder(), 2000);

        // Populate filter dropdowns
        populateFilterOptions();

        // Auto-delete old topics if configured
        const autoDeleteDays = DSA.Store.getSettings().autoDeleteAfterDays || 0;
        if (autoDeleteDays > 0) {
            try {
                const deleted = DSA.Store.deleteOldTopics(autoDeleteDays);
                if (deleted > 0) {
                    showToast(`Removed ${deleted} ${deleted === 1 ? 'topic' : 'topics'} older than ${autoDeleteDays} days.`, 'info');
                    populateFilterOptions();
                    refreshDashboard();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    }

    function setupStorageRefresh() {
        const studyKeys = new Set(Object.values(DSA.Store.KEYS));
        const changedKeys = new Set();
        let pendingRefresh;
        window.addEventListener('storage', event => {
            if (event.storageArea !== localStorage || (event.key !== null && !studyKeys.has(event.key))) return;
            changedKeys.add(event.key);
            clearTimeout(pendingRefresh);
            pendingRefresh = setTimeout(() => {
                const settingsChanged = changedKeys.has(null) || changedKeys.has(DSA.Store.KEYS.SETTINGS);
                changedKeys.clear();
                populateFilterOptions();
                updateSidebarXP();
                renderCurrentStreak(DSA.Gamification.getCurrentStreak());
                DSA.Notifications.updateNotificationDot();

                switch (currentView) {
                    case 'dashboard': refreshDashboard(); break;
                    case 'questions': refreshQuestionsList(); break;
                    case 'practice': DSA.PracticePlan.render(); break;
                    case 'revisions': refreshRevisions(); break;
                    case 'analytics': refreshAnalytics(); break;
                    case 'growth': refreshGrowth(); break;
                    case 'syllabus': refreshSyllabus(); break;
                    case 'planner': refreshPlanner(); break;
                    case 'profile': refreshProfile(); break;
                    case 'settings': if (settingsChanged) loadSettings(true); break;
                }
            }, 60);
        });
    }

    function refreshStudyDate() {
        const today = DSA.Store.todayStr();
        if (displayedDate === today) return;
        const date = document.getElementById('q-date');
        date.max = today;
        if (!document.getElementById('edit-question-id').value && date.value === displayedDate) date.value = today;
        displayedDate = today;
        updateDateDisplay();
        renderCurrentStreak(DSA.Gamification.getCurrentStreak());
        DSA.Notifications.updateNotificationDot();
        if (currentView === 'dashboard') refreshDashboard();
        if (currentView === 'revisions') refreshRevisions();
        if (currentView === 'practice') DSA.PracticePlan.render();
        if (currentView === 'planner') refreshPlanner();
        if (currentView === 'profile') refreshProfile();
        if (currentView === 'analytics') refreshAnalytics();
        if (currentView === 'growth') refreshGrowth();
    }

    // ════════════ NAVIGATION ════════════
    function setupNavigation() {
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                switchView(view);
            });
        });

        // Menu toggle (mobile)
        document.getElementById('menu-toggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const open = sidebar.classList.toggle('open');
            overlay.classList.toggle('active', open);
            document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
            document.getElementById('main-content').inert = open;
            if (open) sidebar.querySelector('[aria-current="page"]').focus({ preventScroll: true });
        });

        const dismissSidebar = () => {
            closeSidebar();
            document.getElementById('menu-toggle').focus();
        };
        document.getElementById('sidebar-overlay').addEventListener('click', dismissSidebar);
        document.getElementById('sidebar-close').addEventListener('click', dismissSidebar);
        window.matchMedia('(max-width: 900px)').addEventListener('change', event => {
            if (!event.matches) closeSidebar();
        });

        // Close sidebar on view click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('menu-toggle');
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle && e.target.id !== 'sidebar-overlay') {
                closeSidebar();
            }
        });

        // Quick add button
        document.getElementById('quick-add-btn').addEventListener('click', () => {
            resetQuestionForm();
            switchView('add-question');
        });
        document.getElementById('dashboard-practice-btn').addEventListener('click', () => switchView('practice'));

        // Notification bell
        document.getElementById('notification-btn').addEventListener('click', openRevisionQueue);
    }

    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
        document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
        document.getElementById('main-content').inert = false;
    }

    function switchView(view) {
        const activeView = document.getElementById(`view-${view}`);
        if (!activeView) return;
        currentView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        activeView.classList.add('active');

        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.dataset.view === view);
            const button = li.querySelector('button');
            if (li.dataset.view === view) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });

        // Close mobile sidebar
        closeSidebar();

        // Refresh view content
        switch (view) {
            case 'dashboard': refreshDashboard(); break;
            case 'questions': refreshQuestionsList(); break;
            case 'practice': DSA.PracticePlan.render(); break;
            case 'revisions': refreshRevisions(); break;
            case 'analytics': refreshAnalytics(); break;
            case 'growth': refreshGrowth(); break;
            case 'syllabus': refreshSyllabus(); break;
            case 'planner': refreshPlanner(); break;
            case 'profile': refreshProfile(); break;
            case 'settings': loadSettings(); break;
        }
        const heading = activeView.querySelector('h1');
        if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // ════════════ DASHBOARD ════════════
    function refreshDashboard() {
        const today = DSA.Store.todayStr();
        const activity = DSA.RevisionEngine.getStudyActivity(today);
        const dueToday = DSA.RevisionEngine.getDueExactlyToday();
        const overdue = DSA.RevisionEngine.getOverdue();
        const totalPending = DSA.RevisionEngine.getTotalPending();
        const { completed, goal, percentage } = DSA.RevisionEngine.getDailyReviewProgress(today, activity);

        // Update stat cards
        document.getElementById('stat-due-today').textContent = dueToday.length;
        document.getElementById('stat-overdue').textContent = overdue.length;
        document.getElementById('stat-completed-today').textContent = completed;
        document.getElementById('stat-total-pending').textContent = totalPending;
        document.getElementById('stat-productivity').textContent = `${percentage}%`;
        renderCurrentStreak(DSA.Gamification.getCurrentStreak(activity, today));

        const practiced = document.getElementById('stat-practiced-today');
        if (practiced) practiced.textContent = activity.get(today)?.practiced || 0;
        const reviewSummary = `${completed} of ${goal} reviews today`;
        const goalDetail = document.getElementById('stat-productivity-detail');
        if (goalDetail) goalDetail.textContent = reviewSummary;
        const progress = document.getElementById('daily-review-progress');
        if (progress) {
            progress.value = percentage;
            progress.setAttribute('aria-valuetext', reviewSummary);
        }
        const practiceSummary = document.getElementById('dashboard-practice-summary');
        if (practiceSummary) {
            const ready = DSA.PracticePlan.getQueue(today).length;
            practiceSummary.textContent = ready ? `${ready} plan ${ready === 1 ? 'item' : 'items'} ready` : 'No plan items ready';
        }

        // Today's revisions quick list
        renderDashboardRevisions(DSA.RevisionEngine.getPriorityRevisions(5));

        // Topic progress & difficulty distribution widgets
        DSA.ModernFeatures.updateTopicProgress();
        DSA.ModernFeatures.updateDifficultyDistribution();
        DSA.ModernFeatures.updateGoalTracker(activity);

        // Heatmap
        DSA.Charts.renderHeatmap(activity);
        const activeDates = [...activity.keys()].sort();
        const lastDate = activeDates[activeDates.length - 1];
        const recency = document.getElementById('study-activity-recency');
        recency.textContent = !lastDate ? 'No study activity yet' : lastDate === today ? 'Last studied today' :
            `Last studied ${new Date(lastDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

        // Recent Activity
        renderRecentActivity();

        // Notification dot
        DSA.Notifications.updateNotificationDot();
    }

    function renderCurrentStreak(streak) {
        document.getElementById('stat-streak').textContent = streak;
        const topBarStreak = document.getElementById('streak-count');
        if (topBarStreak) topBarStreak.textContent = streak;
    }

    function renderDashboardRevisions(questions) {
        const container = document.getElementById('dashboard-revisions-list');
        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">No reviews are due.</p>';
            return;
        }

        const settings = DSA.Store.getSettings();
        container.innerHTML = questions.map(q => `
            <div class="rev-quick-item" data-id="${escapeHtml(q.id)}">
                <div class="q-difficulty-dot ${escapeHtml(q.difficulty.toLowerCase())}"></div>
                <span class="q-name">${escapeHtml(q.name)}</span>
                <span class="rev-cycle">${escapeHtml(q.revisionCycle)}/${settings.totalCycles || 15}</span>
                <button class="btn btn-sm btn-accent" onclick="DSA.App.openRevisionModal(${inlineId(q.id)})">Revise</button>
            </div>
        `).join('');
    }

    function renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        const log = DSA.Store.getActivityLog().slice(0, 10);

        if (log.length === 0) {
            container.innerHTML = '<p class="empty-state">No study activity recorded yet.</p>';
            return;
        }

        const iconMap = {
            'add': '➕', 'revision': '🔁', 'delete': '🗑️', 'levelup': '🎉',
            'streak': '🔥', 'badge': '🏅', 'reset': '🔄', 'streak-lost': '😔'
        };

        container.innerHTML = log.map(a => {
            const timeDiff = getTimeDiff(a.timestamp);
            return `
                <div class="activity-item">
                    <span class="activity-icon">${iconMap[a.type] || '📌'}</span>
                    <span class="activity-text">${escapeHtml(a.text)}</span>
                    <span class="activity-time">${timeDiff}</span>
                </div>
            `;
        }).join('');
    }

    // ════════════ QUESTION FORM ════════════
    function setupQuestionForm() {
        const form = document.getElementById('question-form');
        form.addEventListener('submit', handleQuestionSubmit);

        // Confidence rating buttons
        document.querySelectorAll('#q-confidence-rating .conf-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#q-confidence-rating .conf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('q-confidence').value = btn.dataset.value;
            });
        });

        // Reset button
        document.getElementById('form-reset-btn').addEventListener('click', event => {
            event.preventDefault();
            resetQuestionForm();
        });
    }

    function setConfidence(value) {
        document.getElementById('q-confidence').value = value;
        document.querySelectorAll('#q-confidence-rating .conf-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.value) === value);
        });
    }

    function resetQuestionForm() {
        document.getElementById('question-form').reset();
        document.getElementById('edit-question-id').value = '';
        document.getElementById('form-submit-btn').textContent = 'Save Topic';
        document.getElementById('form-back-btn').style.display = 'none';
        document.getElementById('q-date').value = DSA.Store.todayStr();
        setConfidence(4);
    }

    function recordQuestionStudy(question) {
        const xp = { Easy: 5, Medium: 10, Hard: 15 }[question.difficulty] || 5;
        const today = DSA.Store.todayStr();
        const dateStudied = question.dateSolved || today;
        DSA.Gamification.awardXP(xp, 'Question studied');
        DSA.Store.logDailyActivity(dateStudied, 'solved');
        DSA.Store.addDailyXP(dateStudied, xp);
        const streak = dateStudied === today ? DSA.Gamification.updateStreak() : DSA.Gamification.getCurrentStreak();
        renderCurrentStreak(streak);
        DSA.Gamification.checkBadges();
        return xp;
    }

    function handleQuestionSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('form-submit-btn');
        submitBtn.disabled = true;

        try {
            const editId = document.getElementById('edit-question-id').value;
            const questionData = {
                name: document.getElementById('q-name').value.trim(),
                platform: document.getElementById('q-platform').value,
                platformLink: document.getElementById('q-link').value.trim(),
                subject: document.getElementById('q-subject').value.trim(),
                difficulty: document.getElementById('q-difficulty').value,
                dateSolved: document.getElementById('q-date').value,
                timeTaken: parseInt(document.getElementById('q-time').value) || 0,
                tags: document.getElementById('q-tags').value.split(',').map(t => t.trim()).filter(Boolean),
                notes: document.getElementById('q-notes').value.trim(),
                code: document.getElementById('q-code').value.trim(),
                importantNote: document.getElementById('q-important-note').value.trim(),
                status: document.getElementById('q-status').value,
                initialConfidence: parseInt(document.getElementById('q-confidence').value) || 4
            };
            if (!questionData.name || !questionData.subject) throw new Error('Enter a question and subject.');
            if (!questionData.dateSolved || questionData.dateSolved > DSA.Store.todayStr()) {
                throw new Error('Enter the date you studied this question, today or earlier.');
            }
            if (questionData.platformLink && !DSA.PracticePlan.safeLink(questionData.platformLink)) {
                throw new Error('Use an HTTP or HTTPS reference link.');
            }

            if (editId) {
                const previous = DSA.Store.getQuestionById(editId);
                if (!previous) throw new Error('This question is no longer available.');
                if (questionData.status === 'Mastered') questionData.nextRevisionDate = null;
                else if (previous.status === 'Mastered' || (!previous.lastRevisionDate && previous.dateSolved !== questionData.dateSolved)) {
                    questionData.nextRevisionDate = DSA.RevisionEngine.calculateNextDate({ ...previous, ...questionData }, DSA.Store.getSettings());
                }
                DSA.Store.updateQuestion(editId, questionData);
                showToast('Question updated.', 'success');
            } else {
                const question = DSA.Store.addQuestion(questionData);
                try {
                    const xp = recordQuestionStudy(question);
                    showToast(`Question saved. +${xp} XP`, 'success');
                } catch (error) {
                    console.warn('Question saved, but study statistics could not be updated:', error);
                    showToast('Question saved. Some study statistics could not be updated.', 'warning');
                }
            }
            resetQuestionForm();
            populateFilterOptions();
            updateSidebarXP();
            switchView('questions');
        } catch (error) {
            console.error('Error submitting question:', error);
            showToast(error.message || 'Failed to save question.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    // ════════════ QUESTIONS LIST ════════════
    function refreshQuestionsList() {
        const questions = getFilteredQuestions();
        const container = document.getElementById('questions-list');
        const total = DSA.Store.getQuestions().length;
        const settings = DSA.Store.getSettings();

        document.getElementById('showing-count').textContent = questions.length;
        document.getElementById('total-count').textContent = total;

        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">No questions found. Start adding questions to track your progress!</p>';
            return;
        }

        container.innerHTML = questions.map(q => {
            const totalCycles = settings.totalCycles || 15;
            const progressPct = Math.round((q.revisionCycle / totalCycles) * 100);
            const statusClass = q.status.toLowerCase().replace(/\s+/g, '-');

            return `
                <div class="question-item" role="button" tabindex="0" data-id="${escapeHtml(q.id)}" onclick="DSA.App.openDetailModal(${inlineId(q.id)})">
                    <div class="q-difficulty-dot ${escapeHtml(q.difficulty.toLowerCase())}"></div>
                    <div class="q-main">
                        <div class="q-name">${escapeHtml(q.name)}</div>
                        <div class="q-meta">
                            <span>${escapeHtml(q.subject)}</span>
                            <span>${escapeHtml(q.platform)}</span>
                            <span>${escapeHtml(q.dateSolved || q.practiceDate)}</span>
                            ${q.timeTaken ? `<span>${escapeHtml(q.timeTaken)}min</span>` : ''}
                        </div>
                    </div>
                    <div class="q-progress">
                        <div class="q-progress-bar">
                            <div class="q-progress-fill" style="width:${progressPct}%"></div>
                        </div>
                        <div class="q-progress-text">${escapeHtml(q.revisionCycle)}/${totalCycles}</div>
                    </div>
                    <span class="q-status-badge ${escapeHtml(statusClass)}">${escapeHtml(q.status)}</span>
                </div>
            `;
        }).join('');
    }

    function getFilteredQuestions() {
        let questions = DSA.Store.getQuestions();
        const search = document.getElementById('search-questions').value.toLowerCase();
        const subject = document.getElementById('filter-subject').value;
        const difficulty = document.getElementById('filter-difficulty').value;
        const status = document.getElementById('filter-status').value;
        const platform = document.getElementById('filter-platform').value;
        const sort = document.getElementById('sort-questions').value;

        if (search) {
            questions = questions.filter(q =>
                q.name.toLowerCase().includes(search) ||
                (q.tags || []).some(t => t.toLowerCase().includes(search)) ||
                q.subject.toLowerCase().includes(search)
            );
        }
        if (subject) questions = questions.filter(q => q.subject === subject);
        if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
        if (status) questions = questions.filter(q => q.status === status);
        if (platform) questions = questions.filter(q => q.platform === platform);

        // Sort
        switch (sort) {
            case 'newest': questions.sort((a, b) => (b.dateSolved || '').localeCompare(a.dateSolved || '')); break;
            case 'oldest': questions.sort((a, b) => (a.dateSolved || '').localeCompare(b.dateSolved || '')); break;
            case 'name': questions.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'difficulty': {
                const order = { 'Hard': 0, 'Medium': 1, 'Easy': 2 };
                questions.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
                break;
            }
            case 'revision': questions.sort((a, b) => (a.nextRevisionDate || '').localeCompare(b.nextRevisionDate || '')); break;
        }

        return questions;
    }

    function setupFilters() {
        document.getElementById('questions-list').addEventListener('keydown', event => {
            const question = event.target.closest('.question-item');
            if (question && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                openDetailModal(question.dataset.id);
            }
        });
        ['search-questions', 'filter-subject', 'filter-difficulty', 'filter-status', 'filter-platform', 'sort-questions'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(id === 'search-questions' ? 'input' : 'change', refreshQuestionsList);
        });
    }

    function populateFilterOptions() {
        const questions = DSA.Store.getQuestions();
        const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))].sort();
        const platforms = [...new Set(questions.map(q => q.platform).filter(Boolean))].sort();
        const subjectSelects = ['filter-subject', 'rev-filter-subject'];
        subjectSelects.forEach(id => replaceFilterOptions(id, 'All Subjects', subjects));
        replaceFilterOptions('filter-platform', 'All Sources', platforms);
        document.getElementById('subject-suggestions').replaceChildren(...subjects.map(subject => new Option(subject, subject)));
    }

    function replaceFilterOptions(id, defaultLabel, values) {
        const select = document.getElementById(id);
        const value = select.value;
        select.replaceChildren(new Option(defaultLabel, ''), ...values.map(item => new Option(item, item)));
        select.value = values.includes(value) ? value : '';
    }

    // ════════════ REVISIONS ════════════
    function setupRevisionTabs() {
        document.querySelectorAll('.rev-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                selectRevisionTab(tab.dataset.tab);
                refreshRevisions();
            });
        });

        document.getElementById('rev-filter-subject').addEventListener('change', refreshRevisions);
    }

    function selectRevisionTab(name) {
        currentRevisionTab = name;
        document.querySelectorAll('.rev-tab').forEach(tab => {
            const selected = tab.dataset.tab === name;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
    }

    function openRevisionQueue() {
        let tab = 'due';
        if (!DSA.RevisionEngine.getDueExactlyToday().length) {
            if (DSA.RevisionEngine.getOverdue().length) tab = 'overdue';
            else if (DSA.PracticePlan.getQueue().length) tab = 'practice';
        }
        document.getElementById('rev-filter-subject').value = '';
        selectRevisionTab(tab);
        switchView('revisions');
    }

    function refreshRevisions() {
        const dueToday = DSA.RevisionEngine.getDueExactlyToday();
        const overdue = DSA.RevisionEngine.getOverdue();
        const completedToday = DSA.RevisionEngine.getCompletedToday();
        const practiceQueue = DSA.PracticePlan.getQueue();

        // Update badges
        document.getElementById('badge-due').textContent = dueToday.length;
        document.getElementById('badge-overdue').textContent = overdue.length;
        document.getElementById('badge-practice').textContent = practiceQueue.length;

        let questions = [];
        switch (currentRevisionTab) {
            case 'due': questions = dueToday; break;
            case 'overdue': questions = overdue; break;
            case 'upcoming': questions = DSA.RevisionEngine.getUpcoming(14); break;
            case 'completed': questions = completedToday; break;
            case 'practice': questions = practiceQueue; break;
        }

        // Subject filter
        const subjectFilter = document.getElementById('rev-filter-subject').value;
        if (subjectFilter) {
            questions = questions.filter(q => q.subject === subjectFilter);
        }

        if (currentRevisionTab === 'practice') {
            DSA.PracticePlan.renderQueue(document.getElementById('revision-list'), questions);
        } else renderRevisionList(questions);
    }

    function refreshPracticeData() {
        populateFilterOptions();
        renderCurrentStreak(DSA.Gamification.getCurrentStreak());
        updateSidebarXP();
        DSA.Notifications.updateNotificationDot();
        if (currentView === 'revisions') refreshRevisions();
    }

    function renderRevisionList(questions) {
        const container = document.getElementById('revision-list');
        const settings = DSA.Store.getSettings();
        const today = DSA.Store.todayStr();

        if (questions.length === 0) {
            const emptyMessage = {
                due: 'No reviews are due today.',
                overdue: 'No reviews are overdue.',
                upcoming: 'No reviews are scheduled for the next 14 days.',
                completed: 'No saved questions were reviewed today.'
            };
            const msg = document.getElementById('rev-filter-subject').value
                ? 'No reviews match this subject.'
                : emptyMessage[currentRevisionTab];
            container.innerHTML = `<p class="empty-state">${msg}</p>`;
            return;
        }

        container.innerHTML = questions.map(q => {
            const isCompleted = currentRevisionTab === 'completed';
            const isOverdue = !isCompleted && q.nextRevisionDate < today;
            const totalCycles = settings.totalCycles || 15;

            return `
                <div class="revision-item ${isOverdue ? 'overdue' : ''} ${isCompleted ? 'completed-item' : ''}">
                    <button class="rev-checkbox ${isCompleted ? 'checked' : ''}"
                            onclick="DSA.App.openRevisionModal(${inlineId(q.id)})"
                            ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? '✓' : ''}
                    </button>
                    <div class="rev-main">
                        <div class="rev-name">${escapeHtml(q.name)}</div>
                        <div class="rev-meta">
                            <span>${escapeHtml(q.subject)}</span>
                            <span>${escapeHtml(q.difficulty)}</span>
                            <span>${escapeHtml(q.platform)}</span>
                            ${isOverdue ? `<span style="color:var(--danger)">Due: ${escapeHtml(q.nextRevisionDate)}</span>` : ''}
                            ${currentRevisionTab === 'upcoming' ? `<span>Due: ${escapeHtml(q.nextRevisionDate)}</span>` : ''}
                        </div>
                    </div>
                    <span class="rev-cycle">Cycle ${escapeHtml(q.revisionCycle)}/${totalCycles}</span>
                    ${!isCompleted ? `
                        <button class="rev-action-btn" onclick="DSA.App.openRevisionModal(${inlineId(q.id)})">
                            Revise
                        </button>
                    ` : `
                        <button class="rev-action-btn done-btn" disabled>Done ✓</button>
                    `}
                </div>
            `;
        }).join('');
    }

    // ════════════ REVISION MODAL ════════════
    function setupModals() {
        // Revision modal
        document.getElementById('modal-close').addEventListener('click', closeRevisionModal);
        document.getElementById('modal-complete-btn').addEventListener('click', handleRevisionComplete);
        document.getElementById('modal-skip-btn').addEventListener('click', closeRevisionModal);

        // Quality rating
        document.querySelectorAll('#modal-quality-rating .quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#modal-quality-rating .quality-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('modal-quality').value = btn.dataset.value;
            });
        });

        // Detail modal
        document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);
        document.getElementById('detail-back-btn').addEventListener('click', closeDetailModal);
        document.getElementById('detail-edit-btn').addEventListener('click', handleDetailEdit);
        document.getElementById('detail-reset-rev-btn').addEventListener('click', handleDetailReset);
        document.getElementById('detail-delete-btn').addEventListener('click', handleDetailDelete);

        // Go Back from edit mode
        document.getElementById('form-back-btn').addEventListener('click', () => {
            resetQuestionForm();
            switchView('questions');
        });

        // Close on overlay click
        for (const [id, close] of [['revision-modal', closeRevisionModal], ['detail-modal', closeDetailModal]]) {
            const dialog = document.getElementById(id);
            dialog.addEventListener('click', event => {
                if (event.target === dialog) close();
            });
            dialog.addEventListener('cancel', event => {
                event.preventDefault();
                close();
            });
        }
    }

    function openRevisionModal(questionId) {
        const q = DSA.Store.getQuestionById(questionId);
        if (!q) return;

        currentRevisionQuestionId = questionId;
        const settings = DSA.Store.getSettings();

        document.getElementById('modal-q-name').textContent = q.name;
        document.getElementById('modal-q-meta').textContent =
            `${q.subject} • ${q.difficulty} • ${q.platform} • Cycle ${q.revisionCycle}/${settings.totalCycles || 15}`;

        // Reset quality to 4
        document.querySelectorAll('#modal-quality-rating .quality-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#modal-quality-rating .quality-btn[data-value="4"]').classList.add('active');
        document.getElementById('modal-quality').value = '4';
        document.getElementById('modal-time').value = '10';
        document.getElementById('modal-notes').value = '';

        document.getElementById('revision-modal').showModal();
    }

    function closeRevisionModal() {
        document.getElementById('revision-modal').close();
        currentRevisionQuestionId = null;
    }

    function handleRevisionComplete() {
        if (!currentRevisionQuestionId) return;

        const quality = parseInt(document.getElementById('modal-quality').value);
        const timeTaken = parseInt(document.getElementById('modal-time').value) || 0;
        const notes = document.getElementById('modal-notes').value.trim();
        if (!document.getElementById('modal-time').reportValidity()) return;
        try {
            if (!completeQuestionRevision(currentRevisionQuestionId, quality, timeTaken, notes)) {
                showToast('This question is no longer available for review.', 'warning');
            }
            closeRevisionModal();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    function completeQuestionRevision(questionId, quality, timeTaken, notes) {
        const result = DSA.RevisionEngine.completeRevision(questionId, quality, timeTaken, notes);
        if (!result) return;

        try {
            DSA.Gamification.awardXP(result.xpEarned, 'Revision completed');
            renderCurrentStreak(DSA.Gamification.updateStreak());
            DSA.Gamification.checkBadges();
            if (result.mastered) {
                showToast(`Mastered "${result.question.name}". +${result.xpEarned} XP`, 'success');
                DSA.Gamification.triggerConfetti();
            } else {
                showToast(`Review complete. Cycle ${result.newCycle}/${result.totalCycles}. +${result.xpEarned} XP`, 'success');
            }
        } catch (error) {
            console.error('Could not update review rewards:', error);
            renderCurrentStreak(DSA.Gamification.getCurrentStreak());
            showToast('Review saved. Some rewards could not update.', 'warning');
        }

        updateSidebarXP();

        // Refresh current view
        if (currentView === 'dashboard') refreshDashboard();
        if (currentView === 'revisions') refreshRevisions();
        if (currentView === 'questions') refreshQuestionsList();
        DSA.Notifications.updateNotificationDot();
        return result;
    }

    // ════════════ DETAIL MODAL ════════════
    function openDetailModal(questionId) {
        const q = DSA.Store.getQuestionById(questionId);
        if (!q) return;
        document.getElementById('detail-edit-btn').hidden = q.status === 'Not Started';
        document.getElementById('detail-reset-rev-btn').hidden = q.status === 'Not Started';

        currentRevisionQuestionId = questionId;
        const settings = DSA.Store.getSettings();
        const totalCycles = settings.totalCycles || 15;
        const progressPct = Math.round((q.revisionCycle / totalCycles) * 100);

        // Difficulty badge helper
        const diffClass = q.difficulty.toLowerCase();
        const diffColors = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--danger)' };
        const diffBgs = { easy: 'var(--success-bg)', medium: 'var(--warning-bg)', hard: 'var(--danger-bg)' };
        const diffColor = diffColors[diffClass] || 'var(--text-primary)';
        const diffBg = diffBgs[diffClass] || 'transparent';

        // Status badge helper
        const statusClass = q.status.toLowerCase().replace(/\s+/g, '-');
        const statusColors = { solved: 'var(--info)', mastered: 'var(--success)', 'needs-revision': 'var(--warning)' };
        const statusBgs = { solved: 'var(--info-bg)', mastered: 'var(--success-bg)', 'needs-revision': 'var(--warning-bg)' };
        const statusColor = statusColors[statusClass] || 'var(--text-primary)';
        const statusBg = statusBgs[statusClass] || 'transparent';

        // Platform icon/emoji
        const platformIcons = {
            'LeetCode': '🟠', 'GeeksforGeeks': '🟢',
            'Textbook': '📖', 'Lecture Notes': '📝', 'Online Course': '🌐',
            'YouTube': '📺', 'Research Paper': '📜', 'Khan Academy': '🎓',
            'Coursera': '🌐', 'Udemy': '🎥', 'NPTEL': '🏤', 'Class Notes': '📝',
            'Previous Year Papers': '📄', 'Other': '📝'
        };
        const platformIcon = platformIcons[q.platform] || '📝';

        // Quality emoji for revision history
        const qualityEmojis = { 1: '😫', 2: '😓', 3: '🤔', 4: '😊', 5: '🤩' };

        // Calculate days since solved
        const sourceLink = DSA.PracticePlan.safeLink(q.platformLink);
        const confidence = Math.min(5, Math.max(0, Number(q.initialConfidence || q.confidence) || 0));
        const daysSinceSolved = (new Date(DSA.Store.todayStr()) - new Date(q.dateSolved)) / 86400000;
        const daysSinceText = daysSinceSolved === 0 ? 'Today' : daysSinceSolved === 1 ? '1 day ago' : `${daysSinceSolved} days ago`;

        document.getElementById('detail-title').textContent = q.name;

        const body = document.getElementById('detail-body');
        body.innerHTML = `
            <div class="detail-grid">
                ${q.stream ? `
                <div class="detail-field">
                    <div class="detail-label">🎓 Stream</div>
                    <div class="detail-value">${escapeHtml(q.stream)}</div>
                </div>
                ` : ''}
                <div class="detail-field">
                    <div class="detail-label">📂 Subject</div>
                    <div class="detail-value">${escapeHtml(q.subject)}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">⚡ Difficulty</div>
                    <div class="detail-value">
                        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;background:${diffBg};color:${diffColor};border:1px solid ${diffColor}22;">
                            ${escapeHtml(q.difficulty)}
                        </span>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🌐 Source</div>
                    <div class="detail-value">${platformIcon} ${escapeHtml(q.platform)}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">📅 Date Studied</div>
                    <div class="detail-value">${q.dateSolved ? `${escapeHtml(q.dateSolved)} <small>(${daysSinceText})</small>` : 'Not studied yet'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">⏱️ Time Taken</div>
                    <div class="detail-value">${q.timeTaken ? `<span style="font-variant-numeric:tabular-nums;">${escapeHtml(q.timeTaken)}</span> min` : '<span style="color:var(--text-muted);">—</span>'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">📋 Status</div>
                    <div class="detail-value">
                        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;background:${statusBg};color:${statusColor};border:1px solid ${statusColor}22;">
                            ${escapeHtml(q.status)}
                        </span>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🧮 Ease Factor</div>
                    <div class="detail-value">${(Number(q.easeFactor) || 2.5).toFixed(2)}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🔄 Next Revision</div>
                    <div class="detail-value">${escapeHtml(q.nextRevisionDate) || '<span style="color:var(--text-muted);">—</span>'}</div>
                </div>
                <div class="detail-field detail-full">
                    <div class="detail-label">📊 Revision Progress</div>
                    <div class="detail-value">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
                            <span style="font-size:1.1rem;font-weight:800;">${escapeHtml(q.revisionCycle)}<span style="color:var(--text-muted);font-weight:500;font-size:0.85rem;">/${totalCycles}</span></span>
                            <span style="font-size:0.82rem;color:var(--text-muted);">(${progressPct}% complete)</span>
                        </div>
                        <div class="q-progress-bar" style="height:8px;border-radius:6px;">
                            <div class="q-progress-fill" style="width:${progressPct}%;border-radius:6px;"></div>
                        </div>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">✨ XP Earned</div>
                    <div class="detail-value"><span style="color:var(--accent);font-weight:800;font-size:1.05rem;">${escapeHtml(q.xpEarned || 0)}</span> <span style="color:var(--text-muted);font-size:0.8rem;">XP</span></div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🔢 Confidence</div>
                    <div class="detail-value">${'⭐'.repeat(Math.floor(confidence))}${'☆'.repeat(5 - Math.floor(confidence))}</div>
                </div>
                ${sourceLink ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">🔗 Reference Link</div>
                    <div class="detail-value"><a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLink)}</a></div>
                </div>
                ` : ''}
                ${q.tags && q.tags.length ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">🏷️ Tags</div>
                    <div class="detail-tags">${q.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>
                </div>
                ` : ''}
                ${q.companies ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">� Exam / Context Tags</div>
                    <div class="detail-tags">${(typeof q.companies === 'string' ? q.companies.split(',') : q.companies).map(c => {
                        const cn = c.trim();
                        const ccls = cn.toLowerCase().replace('facebook','meta');
                        const knownCompanies = ['google','meta','amazon','microsoft','apple','netflix'];
                        const cls = knownCompanies.includes(ccls) ? ccls : '';
                        return `<span class="detail-tag company-tag-mini ${cls}">${cn}</span>`;
                    }).join('')}</div>
                </div>
                ` : ''}
                ${q.code ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">� Answer / Solution</div>
                    <div class="detail-code-container">
                        <div class="detail-code-header">
                            <span style="font-size:0.72rem;color:var(--text-accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Code</span>
                            <button class="detail-code-copy" onclick="navigator.clipboard.writeText(this.closest('.detail-code-container').querySelector('pre').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>{this.textContent='Copy'},1500)})">Copy</button>
                        </div>
                        <pre class="detail-code">${escapeHtml(q.code)}</pre>
                    </div>
                </div>
                ` : ''}
                ${q.importantNote ? `
                <div class="detail-field detail-full important-note-display">
                    <div class="detail-label">📌 Important Note</div>
                    <div class="detail-important-note">${escapeHtml(q.importantNote)}</div>
                </div>
                ` : ''}
                ${q.notes ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">📝 Notes / Key Points</div>
                    <div class="detail-notes">${escapeHtml(q.notes)}</div>
                </div>
                ` : ''}
            </div>
            ${q.revisionHistory && q.revisionHistory.length ? `
            <div class="detail-revision-history">
                <h4>Revision History (${q.revisionHistory.length} entries)</h4>
                <div class="revision-history-list">
                    ${q.revisionHistory.map((r, i) => `
                        <div class="rev-history-item">
                            <span>${qualityEmojis[r.quality] || '📝'} Cycle ${escapeHtml(r.cycle)} — ${escapeHtml(r.date)}</span>
                            <span>${'⭐'.repeat(Math.max(0, Math.min(r.quality || 0, 5)))} ${r.timeTaken ? '• ' + escapeHtml(r.timeTaken) + 'min' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : '<div class="detail-no-history"><span style="display:block;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem;">📋 No revision history yet. Complete your first revision to start tracking!</span></div>'}
        `;

        document.getElementById('detail-modal').showModal();
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').close();
        currentRevisionQuestionId = null;
    }

    function handleDetailEdit() {
        const q = DSA.Store.getQuestionById(currentRevisionQuestionId);
        if (!q) return;

        closeDetailModal();
        switchView('add-question');

        // Pre-fill form
        document.getElementById('edit-question-id').value = q.id;
        document.getElementById('q-name').value = q.name;
        document.getElementById('q-platform').value = q.platform;
        document.getElementById('q-link').value = q.platformLink || '';
        document.getElementById('q-subject').value = q.subject;
        document.getElementById('q-difficulty').value = q.difficulty;
        document.getElementById('q-date').value = q.dateSolved;
        document.getElementById('q-time').value = q.timeTaken || '';
        document.getElementById('q-tags').value = (q.tags || []).join(', ');
        document.getElementById('q-notes').value = q.notes || '';
        document.getElementById('q-code').value = q.code || '';
        document.getElementById('q-important-note').value = q.importantNote || '';
        document.getElementById('q-status').value = q.status;
        setConfidence(q.initialConfidence || 4);
        document.getElementById('form-submit-btn').textContent = 'Update Topic';
        document.getElementById('form-back-btn').style.display = '';
    }

    function handleDetailReset() {
        if (!currentRevisionQuestionId) return;
        if (!confirm('Reset this topic’s revision cycle? Your review history stays saved.')) return;

        try {
            if (DSA.RevisionEngine.resetRevisionCycle(currentRevisionQuestionId)) {
                showToast('Revision cycle reset.', 'info');
            } else {
                showToast('This topic is no longer available for reset.', 'warning');
            }
        } catch (error) {
            showToast(error.message, 'error');
            return;
        }
        closeDetailModal();
        if (currentView === 'questions') refreshQuestionsList();
        if (currentView === 'revisions') refreshRevisions();
    }

    function handleDetailDelete() {
        if (!currentRevisionQuestionId) return;
        if (!confirm('Delete this topic permanently? This cannot be undone.')) return;

        try {
            const deleted = DSA.Store.deleteQuestion(currentRevisionQuestionId);
            showToast(deleted ? 'Topic deleted.' : 'This topic has already been removed.', 'info');
        } catch (error) {
            showToast(error.message, 'error');
            return;
        }
        closeDetailModal();
        populateFilterOptions();
        if (currentView === 'questions') refreshQuestionsList();
        if (currentView === 'dashboard') refreshDashboard();
        if (currentView === 'revisions') refreshRevisions();
        if (currentView === 'analytics') refreshAnalytics();
        if (currentView === 'growth') refreshGrowth();
        if (currentView === 'profile') refreshProfile();
    }

    // ════════════ STUDY PLANNER ════════════
    function refreshPlanner() {
        DSA.ModernFeatures.updateGoalTracker();
        DSA.ModernFeatures.renderCalendar();
        refreshPlannerSchedule();
    }

    function refreshPlannerSchedule() {
        const container = document.getElementById('upcoming-schedule');
        const today = DSA.Store.todayStr();
        const end = DSA.Store.addDays(today, 13);
        const days = new Map();

        function scheduledDay(date) {
            if (!days.has(date)) days.set(date, { practice: 0, reviews: 0, entry: false });
            return days.get(date);
        }

        for (const question of DSA.Store.getQuestions()) {
            if (question.status === 'Mastered') continue;
            const pending = question.status === 'Not Started';
            const date = pending ? question.practiceDate : question.nextRevisionDate;
            if (date && date >= today && date <= end) scheduledDay(date)[pending ? 'practice' : 'reviews']++;
        }
        for (const date of Object.keys(DSA.Store.getCalendarEntries())) {
            if (date >= today && date <= end) scheduledDay(date).entry = true;
        }

        const entries = Array.from(days).sort(([a], [b]) => a.localeCompare(b));
        container.replaceChildren(...entries.map(([date, { practice, reviews, entry }]) => {
            const row = document.createElement('li');
            row.className = 'schedule-item';
            const label = document.createElement('time');
            label.dateTime = date;
            label.textContent = date === today ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const detail = document.createElement('span');
            const labels = [];
            if (practice) labels.push(practice === 1 ? '1 practice question' : practice + ' practice questions');
            if (reviews) labels.push(reviews === 1 ? '1 review' : reviews + ' reviews');
            if (entry) labels.push('Calendar entry');
            detail.textContent = labels.join(' · ');
            row.append(label, detail);
            return row;
        }));
        if (!entries.length) {
            const empty = document.createElement('li');
            empty.className = 'empty-state';
            empty.textContent = 'Nothing scheduled in the next 14 days.';
            container.append(empty);
        }
    }

    // ════════════ ANALYTICS ════════════
    function refreshAnalytics() {
        DSA.Charts.renderAll();
    }

    // ════════════ GROWTH INTELLIGENCE ════════════
    function refreshGrowth() {
        renderWeakSubjects();
        renderPriorityRevisions();
        renderImprovementTracker();
        renderRecommendations();
        DSA.Charts.renderLearningCurve();
    }

    function renderWeakSubjects() {
        const container = document.getElementById('weak-subjects');
        const subjects = DSA.RevisionEngine.getWeakSubjects();

        if (subjects.length === 0) {
            container.innerHTML = '<p class="empty-state">Review a question to see recall by subject.</p>';
            return;
        }

        container.innerHTML = subjects.slice(0, 6).map(s => {
            const scoreClass = s.strengthScore < 40 ? 'low' : s.strengthScore < 70 ? 'mid' : 'high';
            return `
                <div class="growth-item">
                    <span class="growth-item-name">${escapeHtml(s.name)} (${s.total} Qs)</span>
                    <span class="growth-item-score ${scoreClass}">${s.avgQuality.toFixed(1)}/5 recall</span>
                </div>
            `;
        }).join('');
    }

    function renderPriorityRevisions() {
        const container = document.getElementById('priority-revisions');
        const priorities = DSA.RevisionEngine.getPriorityRevisions(5);

        if (priorities.length === 0) {
            container.innerHTML = '<p class="empty-state">No priority items.</p>';
            return;
        }

        container.innerHTML = priorities.map(q => {
            const urgency = q.priorityScore > 50 ? 'low' : q.priorityScore > 20 ? 'mid' : 'high';
            return `
                <div class="growth-item">
                    <span class="growth-item-name">${escapeHtml(q.name)}</span>
                    <span class="growth-item-score ${urgency}">Priority: ${q.priorityScore}</span>
                </div>
            `;
        }).join('');
    }

    function renderImprovementTracker() {
        const container = document.getElementById('improvement-tracker');
        const questions = DSA.Store.getQuestions();
        const stats = DSA.Store.getUserStats();
        const activity = DSA.RevisionEngine.getStudyActivity();

        if (questions.length === 0 && activity.size === 0) {
            container.innerHTML = '<p class="empty-state">Start revising to see trends.</p>';
            return;
        }

        // Calculate metrics
        const loggedReviews = [...activity.values()].reduce((total, day) => total + day.reviewed, 0);
        const totalRevisions = Math.max(Number(stats.totalRevisions) || 0, loggedReviews);
        const mastered = questions.filter(q => q.status === 'Mastered').length;
        const reviewed = questions.filter(q => q.lastRevisionDate || q.revisionHistory?.length);
        const avgEF = reviewed.length
            ? (reviewed.reduce((sum, q) => sum + (Number(q.easeFactor) || 2.5), 0) / reviewed.length).toFixed(2)
            : '—';

        // Weekly average
        const last7 = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = DSA.Store.dateKey(d);
            last7.push(activity.get(ds)?.reviewed || 0);
        }
        const weeklyAvg = Math.round(last7.reduce((a, b) => a + b, 0) / 7 * 10) / 10;

        container.innerHTML = `
            <div class="growth-metric">
                <span class="growth-metric-val">${totalRevisions}</span>
                <span class="growth-metric-lbl">Total Revisions</span>
            </div>
            <div class="growth-metric">
                <span class="growth-metric-val">${mastered}</span>
                <span class="growth-metric-lbl">Questions Mastered</span>
            </div>
            <div class="growth-metric">
                <span class="growth-metric-val">${avgEF}</span>
                <span class="growth-metric-lbl">Avg Ease Factor</span>
            </div>
            <div class="growth-metric">
                <span class="growth-metric-val">${weeklyAvg}</span>
                <span class="growth-metric-lbl">Reviews per day (7d)</span>
            </div>
        `;
    }

    function renderRecommendations() {
        const container = document.getElementById('recommendations');
        const questions = DSA.Store.getQuestions();
        const recs = [];

        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">Add more questions to get personalized recommendations.</p>';
            return;
        }

        // Weak subjects
        const weakSubjects = DSA.RevisionEngine.getWeakSubjects().filter(s => s.strengthScore < 50);
        if (weakSubjects.length > 0) {
            recs.push({
                icon: '🎯',
                text: `Review <strong>${escapeHtml(weakSubjects[0].name)}</strong> again. Your average recall was ${weakSubjects[0].avgQuality.toFixed(1)}/5.`
            });
        }

        // Overdue
        const overdue = DSA.RevisionEngine.getOverdue();
        if (overdue.length > 0) {
            recs.push({
                icon: '⚠️',
                text: `You have <strong>${overdue.length} overdue revision${overdue.length > 1 ? 's' : ''}</strong>. Clearing these should be your top priority.`
            });
        }

        // Difficulty balance
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        questions.forEach(q => counts[q.difficulty]++);
        const total = questions.length;
        if (counts.Hard / total < 0.15) {
            recs.push({
                icon: '💪',
                text: `Only <strong>${Math.round(counts.Hard / total * 100)}%</strong> of your topics are Hard. Challenge yourself with more difficult material.`
            });
        }

        // Streak
        const streak = DSA.Gamification.getCurrentStreak();
        if (streak > 5) {
            recs.push({
                icon: '🔥',
                text: `You have a <strong>${streak}-day study streak</strong>.`
            });
        } else if (streak === 0) {
            recs.push({
                icon: '🚀',
                text: `Start a new streak today! Even <strong>one revision</strong> counts toward building your habit.`
            });
        }

        // Mastery goal
        const mastered = questions.filter(q => q.status === 'Mastered').length;
        const masteryPct = Math.round((mastered / total) * 100);
        if (masteryPct < 20) {
            recs.push({
                icon: '📈',
                text: `Your mastery rate is <strong>${masteryPct}%</strong>. Keep revising consistently — aim for at least 30% mastery as a near-term goal.`
            });
        }

        if (recs.length === 0) {
            recs.push({
                icon: '🌟',
                text: `You're doing great! Keep practicing and revising. Consistency is the key to mastery.`
            });
        }

        container.innerHTML = recs.map(r => `
            <div class="recommendation-item">
                <span class="rec-icon">${r.icon}</span>
                <span class="rec-text">${r.text}</span>
            </div>
        `).join('');
    }

    // ════════════ PROFILE ════════════
    function refreshProfile() {
        const stats = DSA.Store.getUserStats();
        const questions = DSA.Store.getQuestions();
        const levelInfo = DSA.Gamification.getLevelFromXP(stats.totalXP || 0);
        const mastered = questions.filter(q => q.status === 'Mastered').length;

        // Level circle
        document.getElementById('profile-level').textContent = levelInfo.level;
        const ring = document.getElementById('level-progress-ring');
        const circumference = 2 * Math.PI * 54; // r=54
        ring.style.strokeDashoffset = circumference * (1 - levelInfo.progress);

        // XP
        document.getElementById('profile-xp').textContent = `${stats.totalXP || 0} XP`;
        document.getElementById('profile-xp-fill').style.width = `${Math.round(levelInfo.progress * 100)}%`;
        document.getElementById('profile-xp-next').textContent =
            `${levelInfo.xpForNextLevel - levelInfo.currentLevelXP} XP to Level ${levelInfo.level + 1}`;

        // Stats
        document.getElementById('p-total-questions').textContent = questions.length;
        document.getElementById('p-total-revisions').textContent = stats.totalRevisions || 0;
        document.getElementById('p-mastered').textContent = mastered;
        const streak = DSA.Gamification.getCurrentStreak();
        document.getElementById('p-current-streak').textContent = streak;
        document.getElementById('p-longest-streak').textContent = Math.max(Number(stats.longestStreak) || 0, streak);
        document.getElementById('p-total-xp').textContent = stats.totalXP || 0;

        // Streak Week
        renderStreakWeek();

        // Badges
        renderBadges();
    }

    function renderStreakWeek() {
        const container = document.getElementById('streak-week');
        const days = DSA.Gamification.getStreakWeek();

        container.innerHTML = days.map(d => `
            <div class="streak-day ${d.isToday ? 'today' : ''}">
                <span class="streak-day-name">${d.dayName}</span>
                <div class="streak-day-dot ${d.active ? 'active' : ''}"></div>
            </div>
        `).join('');
    }

    function renderBadges() {
        const container = document.getElementById('badges-grid');
        const badges = DSA.Gamification.getAllBadges();

        container.innerHTML = badges.map(b => `
            <div class="badge-item ${b.unlocked ? 'earned' : 'locked'}">
                <span class="badge-icon">${b.icon}</span>
                <div class="badge-info">
                    <div class="badge-name">${b.name}</div>
                    <div class="badge-desc">${b.description}</div>
                    <div class="badge-status">${b.unlocked ? '✅ Earned' : '🔒 Locked'}</div>
                </div>
            </div>
        `).join('');
    }

    function updateSidebarXP() {
        const stats = DSA.Store.getUserStats();
        const levelInfo = DSA.Gamification.getLevelFromXP(stats.totalXP || 0);

        document.getElementById('sidebar-level').textContent = levelInfo.level;
        document.getElementById('sidebar-xp-fill').style.width = `${Math.round(levelInfo.progress * 100)}%`;
        document.getElementById('sidebar-xp-text').textContent =
            `${levelInfo.currentLevelXP} / ${levelInfo.xpForNextLevel} XP`;
    }

    // ════════════ SETTINGS ════════════
    function setupSettings() {
        // Save on change for each setting
        ['set-total-cycles', 'set-daily-goal', 'set-intervals', 'set-auto-delete'].forEach(id => {
            document.getElementById(id).addEventListener('change', saveSettingsFromUI);
        });

        document.getElementById('set-notifications').addEventListener('change', async (e) => {
            const settings = DSA.Store.getSettings();
            const toggle = e.currentTarget;
            settings.notificationsEnabled = toggle.checked;
            if (!applySettings(settings) || !toggle.checked) return;

            const permission = await DSA.Notifications.requestPermission();
            const currentSettings = DSA.Store.getSettings();
            if (permission !== 'granted' && currentSettings.notificationsEnabled) {
                currentSettings.notificationsEnabled = false;
                if (applySettings(currentSettings)) {
                    loadSettings();
                    showToast('Browser notifications are blocked. Check your browser permissions.', 'warning');
                }
            }
        });

        document.getElementById('set-overdue-alerts').addEventListener('change', (e) => {
            const settings = DSA.Store.getSettings();
            settings.overdueAlerts = e.target.checked;
            applySettings(settings);
        });

        // Reset data
        document.getElementById('settings-reset-btn').addEventListener('click', () => {
            if (!confirm('Delete all study data saved in this browser? This cannot be undone.')) return;
            try {
                DSA.Store.resetAllData();
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
            location.reload();
        });
    }

    function applySettings(settings) {
        try {
            DSA.Store.saveSettings(settings);
            return true;
        } catch (error) {
            loadSettings();
            showToast(error.message, 'error');
            return false;
        }
    }

    function loadSettings(preserveFocusedInput = false) {
        const settings = DSA.Store.getSettings();
        const fields = {
            'set-total-cycles': settings.totalCycles,
            'set-daily-goal': settings.dailyGoal,
            'set-intervals': settings.baseIntervals.join(','),
            'set-notifications': settings.notificationsEnabled,
            'set-overdue-alerts': settings.overdueAlerts,
            'set-auto-delete': settings.autoDeleteAfterDays
        };
        for (const [id, value] of Object.entries(fields)) {
            const field = document.getElementById(id);
            if (preserveFocusedInput && field === document.activeElement) continue;
            if (field.type === 'checkbox') field.checked = value;
            else field.value = value;
        }
    }

    function saveSettingsFromUI() {
        const existingSettings = DSA.Store.getSettings();
        const settings = {
            ...existingSettings,
            totalCycles: document.getElementById('set-total-cycles').value,
            dailyGoal: document.getElementById('set-daily-goal').value,
            autoDeleteAfterDays: document.getElementById('set-auto-delete').value
        };

        const intervalsStr = document.getElementById('set-intervals').value;
        const intervals = intervalsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        settings.baseIntervals = intervals.length > 0 ? intervals : existingSettings.baseIntervals;

        if (applySettings(settings)) {
            loadSettings();
            showToast('Settings saved.', 'success');
        }
    }

    // ════════════ EXPORT / IMPORT ════════════
    function setupExportImport() {
        // Main export buttons
        const exportHandler = () => {
            const data = DSA.Store.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `study-tracker-backup-${DSA.Store.todayStr()}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Data exported successfully!', 'success');
        };

        document.getElementById('export-btn').addEventListener('click', exportHandler);
        document.getElementById('settings-export-btn').addEventListener('click', exportHandler);

        const bindImport = (buttonId, inputId) => {
            const fileInput = document.getElementById(inputId);
            document.getElementById(buttonId).addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async () => {
                const file = fileInput.files[0];
                if (!file) return;
                let contents;
                try {
                    contents = await file.text();
                } catch (error) {
                    console.error('Backup import failed:', error);
                    showToast('Could not import this backup. Check that the file is readable.', 'error');
                    return;
                } finally {
                    fileInput.value = '';
                }
                if (!DSA.Store.importData(contents)) {
                    showToast('Could not restore this backup. Check the file and available browser storage.', 'error');
                    return;
                }
                populateFilterOptions();
                switchView(currentView);
                updateSidebarXP();
                DSA.ModernFeatures.renderCalendar();
                showToast('Backup restored.', 'success');
            });
        };

        bindImport('import-btn', 'import-file');
        bindImport('settings-import-btn', 'settings-import-file');
    }

    // ════════════ THEME SYSTEM ════════════
    function loadTheme() {
        let saved;
        try { saved = localStorage.getItem('dsa_theme'); } catch { /* Theme works without storage. */ }
        applyTheme(saved);
    }

    function applyTheme(theme) {
        if (theme === 'obsidian' || theme === 'purple') theme = 'green';
        if (!['dark', 'green', 'sky'].includes(theme)) theme = 'green';
        document.body.classList.add('theme-transition');
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151524' : '#f3faf6';
        try { localStorage.setItem('dsa_theme', theme); } catch { /* Theme still applies to this page. */ }

        // Update toggle button
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon && label) {
            if (theme === 'dark') {
                icon.textContent = '🌙';
                label.textContent = 'Dark';
            } else {
                icon.textContent = '☀';
                label.textContent = theme === 'green' ? 'Green' : 'Sky';
            }
        }

        // Update settings theme selector
        document.querySelectorAll('#theme-selector .theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
            opt.setAttribute('aria-pressed', String(opt.dataset.theme === theme));
        });

        setTimeout(() => document.body.classList.remove('theme-transition'), 500);
    }

    function setupThemeToggle() {
        // Top bar toggle (cycles between themes)
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            const current = document.documentElement.dataset.theme;
            const next = current === 'dark' ? 'green' : current === 'green' ? 'sky' : 'dark';
            applyTheme(next);

            // Re-render charts if on analytics
            if (currentView === 'analytics') refreshAnalytics();
            if (currentView === 'growth') {
                DSA.Charts.renderLearningCurve();
            }
            if (currentView === 'dashboard') DSA.Charts.renderHeatmap();
        });

        // Settings theme selector
        document.querySelectorAll('#theme-selector .theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                applyTheme(opt.dataset.theme);
                if (currentView === 'analytics') refreshAnalytics();
                if (currentView === 'dashboard') DSA.Charts.renderHeatmap();
            });
        });
    }

    // ════════════ MISC UI ════════════
    function setupMiscUI() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('dialog[open]')) return;
            if (e.key === 'Escape' && document.getElementById('sidebar').classList.contains('open')) {
                closeSidebar();
                document.getElementById('menu-toggle').focus();
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
            if (e.key === 'n' || e.key === 'N') switchView('add-question');
            if (e.key === 'd' || e.key === 'D') switchView('dashboard');
            if (e.key === 'r' || e.key === 'R') switchView('revisions');
        });
    }

    function updateDateDisplay() {
        const now = new Date();
        const date = document.getElementById('date-display');
        date.dateTime = DSA.Store.dateKey(now);
        date.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // ════════════ TOAST SYSTEM ════════════
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✓', error: '!', info: 'i', warning: '!' };
        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${icons[type] || 'i'}</span>
            <span class="toast-text">${escapeHtml(message)}</span>
        `;

        container.replaceChildren(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showConfetti() {
        DSA.Gamification.triggerConfetti();
    }

    // ════════════ UTILITIES ════════════
    function escapeHtml(str) {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str ?? '').replace(/[&<>"']/g, char => entities[char]);
    }

    function inlineId(value) {
        return escapeHtml(JSON.stringify(String(value)));
    }

    function getTimeDiff(timestamp) {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // ════════════ SYLLABUS MANAGEMENT ════════════
    function setupSyllabus() {
        const form = document.getElementById('syllabus-form');
        if (form) {
            form.addEventListener('submit', handleSyllabusSubmit);
        }

        // Stream filter for syllabus list
        const filterEl = document.getElementById('syl-filter-stream');
        if (filterEl) {
            filterEl.addEventListener('change', refreshSyllabus);
        }
    }

    function handleSyllabusSubmit(e) {
        e.preventDefault();

        const topicsRaw = document.getElementById('syl-topics').value.trim();
        const topics = topicsRaw.split('\n').map(t => t.trim()).filter(Boolean).map(t => ({
            name: t,
            completed: false,
            completedDate: null
        }));

        if (topics.length === 0) {
            showToast('Please add at least one topic.', 'warning');
            return;
        }

        const syllabusData = {
            stream: document.getElementById('syl-stream').value,
            name: document.getElementById('syl-name').value.trim(),
            semester: document.getElementById('syl-semester').value.trim(),
            examDate: document.getElementById('syl-exam-date').value,
            topics: topics,
            notes: document.getElementById('syl-notes').value.trim()
        };

        if (!syllabusData.name || !syllabusData.stream) {
            showToast('Enter a syllabus name and select a stream.', 'warning');
            return;
        }
        if (saveSyllabusChange(
            () => DSA.Store.addSyllabus(syllabusData),
            `Added "${syllabusData.name}" with ${topics.length} topics.`
        )) e.target.reset();
    }

    function refreshSyllabus() {
        renderSyllabusList();
        renderSyllabusProgress();
        populateSyllabusFilters();
    }

    function populateSyllabusFilters() {
        const syllabi = DSA.Store.getSyllabi();
        const streams = [...new Set(syllabi.map(s => s.stream))].sort();
        replaceFilterOptions('syl-filter-stream', 'All Streams', streams);
    }

    function renderSyllabusList() {
        const container = document.getElementById('syllabus-list');
        let syllabi = DSA.Store.getSyllabi();

        // Apply stream filter
        const streamFilter = document.getElementById('syl-filter-stream');
        if (streamFilter && streamFilter.value) {
            syllabi = syllabi.filter(s => s.stream === streamFilter.value);
        }

        if (syllabi.length === 0) {
            container.innerHTML = '<p class="empty-state">No syllabi added yet. Add your course syllabus to track your study progress!</p>';
            return;
        }

        const today = Date.parse(DSA.Store.todayStr());
        container.innerHTML = syllabi.map(syl => {
            const completed = syl.topics.filter(t => t.completed).length;
            const total = syl.topics.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const daysToExam = (Date.parse(syl.examDate) - today) / 86400000;
            const examLabel = daysToExam > 0
                ? `Exam in ${daysToExam} ${daysToExam === 1 ? 'day' : 'days'}`
                : daysToExam === 0 ? 'Exam today' : 'Exam passed';

            return `
                <div class="syllabus-card" data-id="${escapeHtml(syl.id)}">
                    <div class="syllabus-card-header">
                        <div class="syllabus-card-info">
                            <h3 class="syllabus-card-title">${escapeHtml(syl.name)}</h3>
                            <div class="syllabus-card-meta">
                                <span class="syllabus-stream-badge">${escapeHtml(syl.stream)}</span>
                                ${syl.semester ? `<span>📅 ${escapeHtml(syl.semester)}</span>` : ''}
                                ${Number.isFinite(daysToExam) ? `<span class="${daysToExam >= 0 && daysToExam <= 7 ? 'exam-urgent' : daysToExam > 7 && daysToExam <= 30 ? 'exam-soon' : ''}">${examLabel}</span>` : ''}
                            </div>
                        </div>
                        <div class="syllabus-card-actions">
                            <button class="btn btn-sm btn-danger" onclick="DSA.App.deleteSyllabus(${inlineId(syl.id)})" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <div class="syllabus-progress-bar-container">
                        <div class="syllabus-progress-bar">
                            <div class="syllabus-progress-fill" style="width:${pct}%"></div>
                        </div>
                        <span class="syllabus-progress-text">${completed}/${total} topics (${pct}%)</span>
                    </div>
                    ${syl.notes ? `<div class="syllabus-notes">📝 ${escapeHtml(syl.notes)}</div>` : ''}
                    <div class="syllabus-topics-header">
                        <span class="syllabus-topics-title">Topics & Chapters</span>
                        <button class="btn btn-sm btn-accent" onclick="DSA.App.addSyllabusTopicPrompt(${inlineId(syl.id)})" title="Add New Topic">
                            ➕ Add Topic
                        </button>
                    </div>
                    <div class="syllabus-topics-list">
                        ${syl.topics.map((topic, idx) => `
                            <div class="syllabus-topic-item ${topic.completed ? 'completed' : ''}">
                                <button class="syl-checkbox ${topic.completed ? 'checked' : ''}"
                                        onclick="DSA.App.toggleSyllabusTopic(${inlineId(syl.id)}, ${idx})">
                                    ${topic.completed ? '✓' : ''}
                                </button>
                                <span class="syl-topic-name">${escapeHtml(topic.name)}</span>
                                ${topic.completedDate ? `<span class="syl-topic-date">${escapeHtml(topic.completedDate)}</span>` : ''}
                                <button class="syl-topic-delete" onclick="DSA.App.deleteSyllabusTopicConfirm(${inlineId(syl.id)}, ${idx})" title="Delete Topic">
                                    🗑️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderSyllabusProgress() {
        const container = document.getElementById('syllabus-progress-overview');
        const syllabi = DSA.Store.getSyllabi();

        if (syllabi.length === 0) {
            container.innerHTML = '<p class="empty-state">Add syllabi and mark topics as completed to see your progress.</p>';
            return;
        }

        let totalTopics = 0, totalCompleted = 0;
        const streamProgress = Object.create(null);

        syllabi.forEach(syl => {
            totalTopics += syl.topics.length;
            const completed = syl.topics.filter(t => t.completed).length;
            totalCompleted += completed;

            if (!streamProgress[syl.stream]) {
                streamProgress[syl.stream] = { total: 0, completed: 0, subjects: 0 };
            }
            streamProgress[syl.stream].total += syl.topics.length;
            streamProgress[syl.stream].completed += completed;
            streamProgress[syl.stream].subjects++;
        });

        const overallPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

        container.innerHTML = `
            <div class="syllabus-overall-stat">
                <div class="syllabus-overall-ring">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" stroke-width="8"/>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" stroke-width="8"
                                stroke-linecap="round" stroke-dasharray="264"
                                stroke-dashoffset="${264 - (264 * overallPct / 100)}"
                                transform="rotate(-90 50 50)"/>
                    </svg>
                    <div class="syllabus-overall-pct">${overallPct}%</div>
                </div>
                <div class="syllabus-overall-info">
                    <div class="syllabus-overall-title">Overall Syllabus Completion</div>
                    <div class="syllabus-overall-detail">${totalCompleted} of ${totalTopics} topics completed across ${syllabi.length} subjects</div>
                </div>
            </div>
            <div class="syllabus-stream-grid">
                ${Object.entries(streamProgress).map(([stream, data]) => {
                    const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    return `
                        <div class="syllabus-stream-card">
                            <div class="syllabus-stream-name">${escapeHtml(stream)}</div>
                            <div class="syllabus-stream-stats">${data.subjects} subject${data.subjects>1?'s':''} · ${data.completed}/${data.total} topics</div>
                            <div class="syllabus-progress-bar">
                                <div class="syllabus-progress-fill" style="width:${pct}%"></div>
                            </div>
                            <div class="syllabus-stream-pct">${pct}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function toggleSyllabusTopic(syllabusId, topicIndex) {
        saveSyllabusChange(() => DSA.Store.toggleSyllabusTopic(syllabusId, topicIndex));
    }

    function deleteSyllabus(syllabusId) {
        if (!confirm('Delete this syllabus? This cannot be undone.')) return;
        saveSyllabusChange(() => DSA.Store.deleteSyllabus(syllabusId), 'Syllabus deleted.');
    }

    function addSyllabusTopicPrompt(syllabusId) {
        const topicName = prompt('Enter the topic/chapter name:');
        if (topicName === null) return;
        const name = topicName.trim();
        if (!name) {
            showToast('Enter a topic name.', 'warning');
            return;
        }
        saveSyllabusChange(() => DSA.Store.addSyllabusTopic(syllabusId, name), `Added "${name}".`);
    }

    function deleteSyllabusTopicConfirm(syllabusId, topicIndex) {
        if (!confirm('Delete this topic? This cannot be undone.')) return;
        saveSyllabusChange(() => DSA.Store.deleteSyllabusTopic(syllabusId, topicIndex), 'Topic deleted.');
    }

    function saveSyllabusChange(change, message) {
        try {
            if (change() === null) {
                showToast('This syllabus or topic is no longer available.', 'warning');
                return false;
            }
        } catch (error) {
            showToast(error.message, 'error');
            return false;
        }
        refreshSyllabus();
        if (message) showToast(message, 'success');
        return true;
    }

    // ════════════ PUBLIC API ════════════
    return {
        init,
        switchView,
        openRevisionModal,
        openDetailModal,
        showToast,
        showConfetti,
        refreshDashboard,
        refreshQuestionsList,
        refreshRevisions,
        openRevisionQueue,
        refreshPracticeData,
        refreshPlannerSchedule,
        completeQuestionRevision,
        recordQuestionStudy,
        refreshAnalytics,
        refreshGrowth,
        refreshProfile,
        refreshSyllabus,
        toggleSyllabusTopic,
        deleteSyllabus,
        addSyllabusTopicPrompt,
        deleteSyllabusTopicConfirm
    };
})();

// ══ Bootstrap the app ══
document.addEventListener('DOMContentLoaded', () => {
    DSA.App.init();
});
