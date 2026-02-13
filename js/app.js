/* ═══════════════════════════════════════════════════════
   DSA Tracker — Main Application Controller
   Wires together all modules, handles UI interactions
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.App = (() => {
    let currentView = 'dashboard';
    let currentRevisionTab = 'due';
    let currentRevisionQuestionId = null;

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

        // Set default date for form
        document.getElementById('q-date').value = DSA.Store.todayStr();

        // Greeting
        updateGreeting();
        updateDateDisplay();

        // Check streak on load
        DSA.Gamification.checkStreak();

        // Load initial view
        refreshDashboard();
        updateSidebarXP();

        // Notifications init
        DSA.Notifications.init();
        setTimeout(() => DSA.Notifications.showLoginReminder(), 2000);

        // Populate filter dropdowns
        populateFilterOptions();

        // ☁️ Sync from Firestore on startup (hydrate local cache)
        if (DSA.Store.syncFromFirestore) {
            DSA.Store.syncFromFirestore().then(synced => {
                if (synced) {
                    console.log('☁️ Cloud sync complete — refreshing UI');
                    refreshDashboard();
                    showToast('☁️ Synced with cloud!', 'success');
                }
            });
        }
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
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        // Close sidebar on overlay click
        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('active');
        });

        // Close sidebar on view click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const toggle = document.getElementById('menu-toggle');
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle && e.target.id !== 'sidebar-overlay') {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });

        // Quick add button
        document.getElementById('quick-add-btn').addEventListener('click', () => switchView('add-question'));

        // Notification bell
        document.getElementById('notification-btn').addEventListener('click', () => switchView('revisions'));
    }

    function switchView(view) {
        currentView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${view}`).classList.add('active');

        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.dataset.view === view);
        });

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');

        // Refresh view content
        switch (view) {
            case 'dashboard': refreshDashboard(); break;
            case 'questions': refreshQuestionsList(); break;
            case 'revisions': refreshRevisions(); break;
            case 'analytics': refreshAnalytics(); break;
            case 'growth': refreshGrowth(); break;
            case 'syllabus': refreshSyllabus(); break;
            case 'profile': refreshProfile(); break;
            case 'settings': loadSettings(); break;
        }
    }

    // ════════════ DASHBOARD ════════════
    function refreshDashboard() {
        const dueToday = DSA.RevisionEngine.getDueToday();
        const overdue = DSA.RevisionEngine.getOverdue();
        const completedToday = DSA.RevisionEngine.getCompletedToday();
        const totalPending = DSA.RevisionEngine.getTotalPending();
        const stats = DSA.Store.getUserStats();
        const productivity = DSA.RevisionEngine.getProductivityScore();

        // Update stat cards
        document.getElementById('stat-due-today').textContent = dueToday.length;
        document.getElementById('stat-overdue').textContent = overdue.length;
        document.getElementById('stat-completed-today').textContent = completedToday.length;
        document.getElementById('stat-total-pending').textContent = totalPending;
        document.getElementById('stat-streak').textContent = stats.currentStreak || 0;
        document.getElementById('stat-productivity').textContent = productivity + '%';

        // Streak count in top bar
        document.getElementById('streak-count').textContent = stats.currentStreak || 0;

        // Today's revisions quick list
        renderDashboardRevisions(dueToday.slice(0, 5));

        // Heatmap
        DSA.Charts.renderHeatmap();

        // Recent Activity
        renderRecentActivity();

        // Notification dot
        DSA.Notifications.updateNotificationDot();
    }

    function renderDashboardRevisions(questions) {
        const container = document.getElementById('dashboard-revisions-list');
        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">No revisions due today. You\'re all caught up! 🎉</p>';
            return;
        }

        const settings = DSA.Store.getSettings();
        container.innerHTML = questions.map(q => `
            <div class="rev-quick-item" data-id="${q.id}">
                <div class="q-difficulty-dot ${q.difficulty.toLowerCase()}"></div>
                <span class="q-name">${escapeHtml(q.name)}</span>
                <span class="rev-cycle">${q.revisionCycle}/${settings.totalCycles || 15}</span>
                <button class="btn btn-sm btn-accent" onclick="DSA.App.openRevisionModal('${q.id}')">Revise</button>
            </div>
        `).join('');
    }

    function renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        const log = DSA.Store.getActivityLog().slice(0, 10);

        if (log.length === 0) {
            container.innerHTML = '<p class="empty-state">No recent activity yet. Start by adding a topic!</p>';
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
        document.getElementById('form-reset-btn').addEventListener('click', () => {
            document.getElementById('edit-question-id').value = '';
            document.getElementById('form-submit-btn').textContent = 'Save Topic';
            document.getElementById('form-back-btn').style.display = 'none';
            document.getElementById('q-date').value = DSA.Store.todayStr();
        });
    }

    function handleQuestionSubmit(e) {
        e.preventDefault();
        const startTime = performance.now();
        console.log('Form submitted - attempting to save question...');

        // Add loading state
        const submitBtn = document.getElementById('form-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const dataCollectStart = performance.now();
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
            console.log(`⏱️ Data collection: ${(performance.now() - dataCollectStart).toFixed(2)}ms`);

        if (editId) {
            // Update existing
            DSA.Store.updateQuestion(editId, questionData);
            showToast('Topic updated successfully!', 'success');
            document.getElementById('edit-question-id').value = '';
            document.getElementById('form-submit-btn').textContent = 'Save Topic';
            document.getElementById('form-back-btn').style.display = 'none';
        } else {
            // Add new question
            const addStart = performance.now();
            const q = DSA.Store.addQuestion(questionData);
            console.log(`⏱️ Store.addQuestion: ${(performance.now() - addStart).toFixed(2)}ms`);

            // XP for adding question
            const xp = { 'Easy': 5, 'Medium': 10, 'Hard': 15 }[q.difficulty] || 5;
            DSA.Gamification.awardXP(xp, 'New question added');

            // Log daily activity
            DSA.Store.logDailyActivity(DSA.Store.todayStr(), 'solved');

            // Update streak
            DSA.Gamification.updateStreak();

            // Check badges
            DSA.Gamification.checkBadges();
            console.log(`⏱️ Total add operation: ${(performance.now() - addStart).toFixed(2)}ms`);

            showToast(`"${q.name}" added! +${xp} XP`, 'success');
        }

        // Reset form
        e.target.reset();
        document.getElementById('q-date').value = DSA.Store.todayStr();
        document.getElementById('q-important-note').value = '';
        document.querySelectorAll('#q-confidence-rating .conf-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#q-confidence-rating .conf-btn[data-value="4"]').classList.add('active');
        document.getElementById('q-confidence').value = '4';

        // Update sidebar XP
        updateSidebarXP();
        
        // Defer expensive UI updates to next tick (non-blocking)
        setTimeout(() => {
            populateFilterOptions();
            populateSubjectSuggestions();
            
            // Navigate to "All Questions" view to show the saved question
            if (!editId) {  // Only navigate for new questions, not edits
                setTimeout(() => {
                    switchView('questions');
                }, 300);  // Small delay to show the toast message first
            }
        }, 0);

        // Re-enable button
        submitBtn.disabled = false;
        
        const totalTime = (performance.now() - startTime).toFixed(2);
        console.log(`⏱️ TOTAL SUBMIT TIME: ${totalTime}ms`);
        submitBtn.textContent = originalText;
        } catch (error) {
            console.error('Error submitting question:', error);
            showToast('Failed to save question. Check console for details.', 'error');
            // Re-enable button on error
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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
                <div class="question-item" data-id="${q.id}" onclick="DSA.App.openDetailModal('${q.id}')">
                    <div class="q-difficulty-dot ${q.difficulty.toLowerCase()}"></div>
                    <div class="q-main">
                        <div class="q-name">${escapeHtml(q.name)}</div>
                        <div class="q-meta">
                            <span>${q.subject}</span>
                            <span>${q.platform}</span>
                            <span>${q.dateSolved}</span>
                            ${q.timeTaken ? `<span>${q.timeTaken}min</span>` : ''}
                        </div>
                    </div>
                    <div class="q-progress">
                        <div class="q-progress-bar">
                            <div class="q-progress-fill" style="width:${progressPct}%"></div>
                        </div>
                        <div class="q-progress-text">${q.revisionCycle}/${totalCycles}</div>
                    </div>
                    <span class="q-status-badge ${statusClass}">${q.status}</span>
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
            case 'newest': questions.sort((a, b) => b.dateSolved.localeCompare(a.dateSolved)); break;
            case 'oldest': questions.sort((a, b) => a.dateSolved.localeCompare(b.dateSolved)); break;
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
        ['search-questions', 'filter-subject', 'filter-difficulty', 'filter-status', 'filter-platform', 'sort-questions'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(id === 'search-questions' ? 'input' : 'change', refreshQuestionsList);
        });
    }

    function populateFilterOptions() {
        const questions = DSA.Store.getQuestions();

        // Subjects
        const subjects = [...new Set(questions.map(q => q.subject))].sort();
        const subjectSelects = ['filter-subject', 'rev-filter-subject'];
        subjectSelects.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const val = el.value;
            el.innerHTML = '<option value="">All Subjects</option>' +
                subjects.map(s => `<option value="${s}">${s}</option>`).join('');
            el.value = val;
        });

        // Platforms / Sources
        const platforms = [...new Set(questions.map(q => q.platform))].sort();
        const platformSelect = document.getElementById('filter-platform');
        if (platformSelect) {
            const val = platformSelect.value;
            platformSelect.innerHTML = '<option value="">All Sources</option>' +
                platforms.map(p => `<option value="${p}">${p}</option>`).join('');
            platformSelect.value = val;
        }

        // Subject suggestions datalist
        populateSubjectSuggestions();
    }

    function populateSubjectSuggestions() {
        const questions = DSA.Store.getQuestions();
        const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))].sort();
        const datalist = document.getElementById('subject-suggestions');
        if (datalist) {
            datalist.innerHTML = subjects.map(s => `<option value="${s}">`).join('');
        }
    }

    // ════════════ REVISIONS ════════════
    function setupRevisionTabs() {
        document.querySelectorAll('.rev-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.rev-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentRevisionTab = tab.dataset.tab;
                refreshRevisions();
            });
        });

        document.getElementById('rev-filter-subject').addEventListener('change', refreshRevisions);
    }

    function refreshRevisions() {
        const dueToday = DSA.RevisionEngine.getDueToday();
        const overdue = DSA.RevisionEngine.getOverdue();
        const completedToday = DSA.RevisionEngine.getCompletedToday();

        // Update badges
        document.getElementById('badge-due').textContent = dueToday.length;
        document.getElementById('badge-overdue').textContent = overdue.length;

        let questions = [];
        switch (currentRevisionTab) {
            case 'due': questions = dueToday; break;
            case 'overdue': questions = overdue; break;
            case 'upcoming': questions = DSA.RevisionEngine.getUpcoming(14); break;
            case 'completed': questions = completedToday; break;
        }

        // Subject filter
        const subjectFilter = document.getElementById('rev-filter-subject').value;
        if (subjectFilter) {
            questions = questions.filter(q => q.subject === subjectFilter);
        }

        renderRevisionList(questions);
    }

    function renderRevisionList(questions) {
        const container = document.getElementById('revision-list');
        const settings = DSA.Store.getSettings();
        const today = DSA.Store.todayStr();

        if (questions.length === 0) {
            const msg = currentRevisionTab === 'completed'
                ? 'No revisions completed today yet.'
                : currentRevisionTab === 'upcoming'
                ? 'No upcoming revisions in the next 14 days.'
                : 'No revisions to show. Great job! 🎉';
            container.innerHTML = `<p class="empty-state">${msg}</p>`;
            return;
        }

        container.innerHTML = questions.map(q => {
            const isOverdue = q.nextRevisionDate < today;
            const isCompleted = q.lastRevisionDate === today && currentRevisionTab === 'completed';
            const totalCycles = settings.totalCycles || 15;

            return `
                <div class="revision-item ${isOverdue ? 'overdue' : ''} ${isCompleted ? 'completed-item' : ''}">
                    <button class="rev-checkbox ${isCompleted ? 'checked' : ''}"
                            onclick="DSA.App.openRevisionModal('${q.id}')"
                            ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? '✓' : ''}
                    </button>
                    <div class="rev-main">
                        <div class="rev-name">${escapeHtml(q.name)}</div>
                        <div class="rev-meta">
                            <span>${q.subject}</span>
                            <span>${q.difficulty}</span>
                            <span>${q.platform}</span>
                            ${isOverdue ? `<span style="color:var(--danger)">Due: ${q.nextRevisionDate}</span>` : ''}
                            ${currentRevisionTab === 'upcoming' ? `<span>Due: ${q.nextRevisionDate}</span>` : ''}
                        </div>
                    </div>
                    <span class="rev-cycle">Cycle ${q.revisionCycle}/${totalCycles}</span>
                    ${!isCompleted ? `
                        <button class="rev-action-btn" onclick="DSA.App.openRevisionModal('${q.id}')">
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
            document.getElementById('edit-question-id').value = '';
            document.getElementById('question-form').reset();
            document.getElementById('form-submit-btn').textContent = 'Save Topic';
            document.getElementById('form-back-btn').style.display = 'none';
            switchView('questions');
        });

        // Close on overlay click
        ['revision-modal', 'detail-modal'].forEach(id => {
            document.getElementById(id).addEventListener('click', (e) => {
                if (e.target === document.getElementById(id)) {
                    document.getElementById(id).classList.remove('show');
                }
            });
        });
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

        document.getElementById('revision-modal').classList.add('show');
    }

    function closeRevisionModal() {
        document.getElementById('revision-modal').classList.remove('show');
        currentRevisionQuestionId = null;
    }

    function handleRevisionComplete() {
        if (!currentRevisionQuestionId) return;

        const quality = parseInt(document.getElementById('modal-quality').value);
        const timeTaken = parseInt(document.getElementById('modal-time').value) || 0;
        const notes = document.getElementById('modal-notes').value.trim();

        const result = DSA.RevisionEngine.completeRevision(currentRevisionQuestionId, quality, timeTaken, notes);
        if (!result) return;

        // Award XP
        DSA.Gamification.awardXP(result.xpEarned, 'Revision completed');
        DSA.Gamification.updateStreak();
        DSA.Gamification.checkBadges();

        closeRevisionModal();

        if (result.mastered) {
            showToast(`🌟 "${result.question.name}" MASTERED! +${result.xpEarned} XP`, 'success');
            DSA.Gamification.triggerConfetti();
        } else {
            showToast(`✅ Revision done! Cycle ${result.newCycle}/${result.totalCycles}. +${result.xpEarned} XP`, 'success');
        }

        updateSidebarXP();

        // Refresh current view
        if (currentView === 'dashboard') refreshDashboard();
        if (currentView === 'revisions') refreshRevisions();
        if (currentView === 'questions') refreshQuestionsList();
    }

    // ════════════ DETAIL MODAL ════════════
    function openDetailModal(questionId) {
        const q = DSA.Store.getQuestionById(questionId);
        if (!q) return;

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
        const daysSinceSolved = Math.floor((new Date() - new Date(q.dateSolved)) / (1000 * 60 * 60 * 24));
        const daysSinceText = daysSinceSolved === 0 ? 'Today' : daysSinceSolved === 1 ? '1 day ago' : `${daysSinceSolved} days ago`;

        document.getElementById('detail-title').textContent = q.name;

        const body = document.getElementById('detail-body');
        body.innerHTML = `
            <div class="detail-grid">
                ${q.stream ? `
                <div class="detail-field">
                    <div class="detail-label">🎓 Stream</div>
                    <div class="detail-value">${q.stream}</div>
                </div>
                ` : ''}
                <div class="detail-field">
                    <div class="detail-label">📂 Subject</div>
                    <div class="detail-value">${q.subject}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">⚡ Difficulty</div>
                    <div class="detail-value">
                        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;background:${diffBg};color:${diffColor};border:1px solid ${diffColor}22;">
                            ${q.difficulty}
                        </span>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🌐 Source</div>
                    <div class="detail-value">${platformIcon} ${q.platform}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">📅 Date Studied</div>
                    <div class="detail-value">${q.dateSolved} <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px;">(${daysSinceText})</span></div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">⏱️ Time Taken</div>
                    <div class="detail-value">${q.timeTaken ? `<span style="font-variant-numeric:tabular-nums;">${q.timeTaken}</span> min` : '<span style="color:var(--text-muted);">—</span>'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">📋 Status</div>
                    <div class="detail-value">
                        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;background:${statusBg};color:${statusColor};border:1px solid ${statusColor}22;">
                            ${q.status}
                        </span>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🧮 Ease Factor</div>
                    <div class="detail-value">${(q.easeFactor || 2.5).toFixed(2)}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🔄 Next Revision</div>
                    <div class="detail-value">${q.nextRevisionDate || '<span style="color:var(--text-muted);">—</span>'}</div>
                </div>
                <div class="detail-field detail-full">
                    <div class="detail-label">📊 Revision Progress</div>
                    <div class="detail-value">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
                            <span style="font-size:1.1rem;font-weight:800;">${q.revisionCycle}<span style="color:var(--text-muted);font-weight:500;font-size:0.85rem;">/${totalCycles}</span></span>
                            <span style="font-size:0.82rem;color:var(--text-muted);">(${progressPct}% complete)</span>
                        </div>
                        <div class="q-progress-bar" style="height:8px;border-radius:6px;">
                            <div class="q-progress-fill" style="width:${progressPct}%;border-radius:6px;"></div>
                        </div>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">✨ XP Earned</div>
                    <div class="detail-value"><span style="color:var(--accent);font-weight:800;font-size:1.05rem;">${q.xpEarned || 0}</span> <span style="color:var(--text-muted);font-size:0.8rem;">XP</span></div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">🔢 Confidence</div>
                    <div class="detail-value">${'⭐'.repeat(Math.min(q.confidence || 0, 5))}${'☆'.repeat(5 - Math.min(q.confidence || 0, 5))}</div>
                </div>
                ${q.platformLink ? `
                <div class="detail-field detail-full">
                    <div class="detail-label">🔗 Reference Link</div>
                    <div class="detail-value"><a href="${escapeHtml(q.platformLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(q.platformLink)}</a></div>
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
                            <span>${qualityEmojis[r.quality] || '📝'} Cycle ${r.cycle} — ${r.date}</span>
                            <span>${'⭐'.repeat(Math.min(r.quality || 0, 5))} ${r.timeTaken ? '• ' + r.timeTaken + 'min' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : '<div class="detail-no-history"><span style="display:block;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem;">📋 No revision history yet. Complete your first revision to start tracking!</span></div>'}
        `;

        document.getElementById('detail-modal').classList.add('show');
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').classList.remove('show');
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
        document.getElementById('form-submit-btn').textContent = 'Update Topic';
        document.getElementById('form-back-btn').style.display = '';
    }

    function handleDetailReset() {
        if (!currentRevisionQuestionId) return;
        if (!confirm('Reset all revision progress for this topic? This cannot be undone.')) return;

        DSA.RevisionEngine.resetRevisionCycle(currentRevisionQuestionId);
        showToast('Revision cycle reset!', 'info');
        closeDetailModal();
        if (currentView === 'questions') refreshQuestionsList();
        if (currentView === 'revisions') refreshRevisions();
    }

    function handleDetailDelete() {
        if (!currentRevisionQuestionId) return;
        if (!confirm('Delete this topic permanently? This cannot be undone.')) return;

        DSA.Store.deleteQuestion(currentRevisionQuestionId);
        showToast('Topic deleted.', 'info');
        closeDetailModal();
        populateFilterOptions();
        if (currentView === 'questions') refreshQuestionsList();
        if (currentView === 'dashboard') refreshDashboard();
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
            container.innerHTML = '<p class="empty-state">Not enough data yet.</p>';
            return;
        }

        container.innerHTML = subjects.slice(0, 6).map(s => {
            const scoreClass = s.strengthScore < 40 ? 'low' : s.strengthScore < 70 ? 'mid' : 'high';
            return `
                <div class="growth-item">
                    <span class="growth-item-name">${s.name} (${s.total} Qs)</span>
                    <span class="growth-item-score ${scoreClass}">${s.strengthScore}%</span>
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
        const dailyLog = DSA.Store.getDailyLog();

        if (questions.length === 0) {
            container.innerHTML = '<p class="empty-state">Start revising to see trends.</p>';
            return;
        }

        // Calculate metrics
        const totalRevisions = stats.totalRevisions || 0;
        const mastered = questions.filter(q => q.status === 'Mastered').length;
        const avgEF = questions.reduce((s, q) => s + (q.easeFactor || 2.5), 0) / questions.length;

        // Weekly average
        const last7 = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const log = dailyLog[ds];
            last7.push(log ? log.revised : 0);
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
                <span class="growth-metric-val">${avgEF.toFixed(2)}</span>
                <span class="growth-metric-lbl">Avg Ease Factor</span>
            </div>
            <div class="growth-metric">
                <span class="growth-metric-val">${weeklyAvg}</span>
                <span class="growth-metric-lbl">Daily Avg (7d)</span>
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
                text: `Focus on <strong>${weakSubjects[0].name}</strong> — it's your weakest subject at ${weakSubjects[0].strengthScore}% strength.`
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
        const stats = DSA.Store.getUserStats();
        if (stats.currentStreak > 5) {
            recs.push({
                icon: '🔥',
                text: `Amazing <strong>${stats.currentStreak}-day streak</strong>! Keep the momentum going — consistency beats intensity.`
            });
        } else if (stats.currentStreak === 0) {
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
        document.getElementById('p-current-streak').textContent = stats.currentStreak || 0;
        document.getElementById('p-longest-streak').textContent = stats.longestStreak || 0;
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
        ['set-total-cycles', 'set-daily-goal', 'set-intervals'].forEach(id => {
            document.getElementById(id).addEventListener('change', saveSettingsFromUI);
        });

        document.getElementById('set-notifications').addEventListener('change', (e) => {
            const settings = DSA.Store.getSettings();
            settings.notificationsEnabled = e.target.checked;
            DSA.Store.saveSettings(settings);
            if (e.target.checked) {
                DSA.Notifications.requestPermission().then(p => {
                    if (p !== 'granted') {
                        showToast('Notification permission denied. Enable in browser settings.', 'warning');
                        e.target.checked = false;
                        settings.notificationsEnabled = false;
                        DSA.Store.saveSettings(settings);
                    }
                });
            }
        });

        document.getElementById('set-overdue-alerts').addEventListener('change', (e) => {
            const settings = DSA.Store.getSettings();
            settings.overdueAlerts = e.target.checked;
            DSA.Store.saveSettings(settings);
        });

        // Reset data
        document.getElementById('settings-reset-btn').addEventListener('click', () => {
            if (!confirm('⚠️ This will delete ALL your data permanently. Are you absolutely sure?')) return;
            if (!confirm('This is your last chance. ALL topics, stats, and progress will be lost. Continue?')) return;
            DSA.Store.resetAllData();
            showToast('All data has been reset.', 'info');
            location.reload();
        });
    }

    function loadSettings() {
        const settings = DSA.Store.getSettings();
        document.getElementById('set-total-cycles').value = settings.totalCycles || 15;
        document.getElementById('set-daily-goal').value = settings.dailyGoal || 5;
        document.getElementById('set-intervals').value = (settings.baseIntervals || []).join(',');
        document.getElementById('set-notifications').checked = settings.notificationsEnabled;
        document.getElementById('set-overdue-alerts').checked = settings.overdueAlerts !== false;
    }

    function saveSettingsFromUI() {
        const settings = DSA.Store.getSettings();
        settings.totalCycles = parseInt(document.getElementById('set-total-cycles').value) || 15;
        settings.dailyGoal = parseInt(document.getElementById('set-daily-goal').value) || 5;

        const intervalsStr = document.getElementById('set-intervals').value;
        const intervals = intervalsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.length > 0) settings.baseIntervals = intervals;

        DSA.Store.saveSettings(settings);
        showToast('Settings saved!', 'success');
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
            URL.revokeObjectURL(url);
            showToast('Data exported successfully!', 'success');
        };

        document.getElementById('export-btn').addEventListener('click', exportHandler);
        document.getElementById('settings-export-btn').addEventListener('click', exportHandler);

        // Import handlers
        const importHandler = (fileInput) => {
            fileInput.click();
            fileInput.onchange = () => {
                const file = fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const success = DSA.Store.importData(e.target.result);
                    if (success) {
                        showToast('Data imported successfully!', 'success');
                        populateFilterOptions();
                        switchView(currentView);
                        updateSidebarXP();
                    } else {
                        showToast('Import failed. Check file format.', 'error');
                    }
                    fileInput.value = '';
                };
                reader.readAsText(file);
            };
        };

        document.getElementById('import-btn').addEventListener('click', () => importHandler(document.getElementById('import-file')));
        document.getElementById('settings-import-btn').addEventListener('click', () => importHandler(document.getElementById('settings-import-file')));
    }

    // ════════════ THEME SYSTEM ════════════
    function loadTheme() {
        const saved = localStorage.getItem('dsa_theme') || 'dark';
        applyTheme(saved);
    }

    function applyTheme(theme) {
        document.body.classList.add('theme-transitioning');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dsa_theme', theme);

        // Update toggle button
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon && label) {
            if (theme === 'dark') {
                icon.textContent = '🌙';
                label.textContent = 'Dark';
            } else {
                icon.textContent = '◆';
                label.textContent = 'Obsidian';
            }
        }

        // Update settings theme selector
        document.querySelectorAll('#theme-selector .theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });

        // Update Chart.js colors if charts are visible
        if (window.Chart) {
            const textColor = theme === 'obsidian' ? '#4a4a5a' : '#9398b0';
            const gridColor = theme === 'obsidian' ? '#d8d8e0' : '#2a2d45';
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = gridColor;
        }

        setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);
    }

    function setupThemeToggle() {
        // Top bar toggle (cycles between themes)
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            const current = localStorage.getItem('dsa_theme') || 'dark';
            const next = current === 'dark' ? 'obsidian' : 'dark';
            applyTheme(next);
            showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Obsidian'} theme`, 'info');

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
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'n' || e.key === 'N') switchView('add-question');
            if (e.key === 'd' || e.key === 'D') switchView('dashboard');
            if (e.key === 'r' || e.key === 'R') switchView('revisions');
            if (e.key === 'Escape') {
                document.getElementById('revision-modal').classList.remove('show');
                document.getElementById('detail-modal').classList.remove('show');
            }
        });
    }

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 17) greeting = 'Good Afternoon';
        document.getElementById('greeting').textContent = `${greeting}, Learner!`;
    }

    function updateDateDisplay() {
        const now = new Date();
        document.getElementById('date-display').textContent =
            now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    // ════════════ TOAST SYSTEM ════════════
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-text">${message}</span>
        `;

        container.appendChild(toast);

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
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

        DSA.Store.addSyllabus(syllabusData);
        showToast(`Syllabus "${syllabusData.name}" added with ${topics.length} topics!`, 'success');

        e.target.reset();
        refreshSyllabus();
    }

    function refreshSyllabus() {
        renderSyllabusList();
        renderSyllabusProgress();
        populateSyllabusFilters();
    }

    function populateSyllabusFilters() {
        const syllabi = DSA.Store.getSyllabi();
        const streams = [...new Set(syllabi.map(s => s.stream))].sort();
        const filterEl = document.getElementById('syl-filter-stream');
        if (filterEl) {
            const val = filterEl.value;
            filterEl.innerHTML = '<option value="">All Streams</option>' +
                streams.map(s => `<option value="${s}">${s}</option>`).join('');
            filterEl.value = val;
        }
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

        container.innerHTML = syllabi.map(syl => {
            const completed = syl.topics.filter(t => t.completed).length;
            const total = syl.topics.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const daysToExam = syl.examDate ? Math.ceil((new Date(syl.examDate) - new Date()) / (1000*60*60*24)) : null;

            return `
                <div class="syllabus-card" data-id="${syl.id}">
                    <div class="syllabus-card-header">
                        <div class="syllabus-card-info">
                            <h3 class="syllabus-card-title">${escapeHtml(syl.name)}</h3>
                            <div class="syllabus-card-meta">
                                <span class="syllabus-stream-badge">${escapeHtml(syl.stream)}</span>
                                ${syl.semester ? `<span>📅 ${escapeHtml(syl.semester)}</span>` : ''}
                                ${daysToExam !== null ? `<span class="${daysToExam <= 7 ? 'exam-urgent' : daysToExam <= 30 ? 'exam-soon' : ''}">🎯 Exam in ${daysToExam > 0 ? daysToExam + ' days' : daysToExam === 0 ? 'Today!' : 'Passed'}</span>` : ''}
                            </div>
                        </div>
                        <div class="syllabus-card-actions">
                            <button class="btn btn-sm btn-danger" onclick="DSA.App.deleteSyllabus('${syl.id}')" title="Delete">🗑️</button>
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
                        <button class="btn btn-sm btn-accent" onclick="DSA.App.addSyllabusTopicPrompt('${syl.id}')" title="Add New Topic">
                            ➕ Add Topic
                        </button>
                    </div>
                    <div class="syllabus-topics-list">
                        ${syl.topics.map((topic, idx) => `
                            <div class="syllabus-topic-item ${topic.completed ? 'completed' : ''}">
                                <button class="syl-checkbox ${topic.completed ? 'checked' : ''}"
                                        onclick="DSA.App.toggleSyllabusTopic('${syl.id}', ${idx})">
                                    ${topic.completed ? '✓' : ''}
                                </button>
                                <span class="syl-topic-name">${escapeHtml(topic.name)}</span>
                                ${topic.completedDate ? `<span class="syl-topic-date">${topic.completedDate}</span>` : ''}
                                <button class="syl-topic-delete" onclick="DSA.App.deleteSyllabusTopicConfirm('${syl.id}', ${idx})" title="Delete Topic">
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
        const streamProgress = {};

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
        DSA.Store.toggleSyllabusTopic(syllabusId, topicIndex);
        refreshSyllabus();
    }

    function deleteSyllabus(syllabusId) {
        if (!confirm('Delete this syllabus? This cannot be undone.')) return;
        DSA.Store.deleteSyllabus(syllabusId);
        showToast('Syllabus deleted.', 'info');
        refreshSyllabus();
    }

    function addSyllabusTopicPrompt(syllabusId) {
        const topicName = prompt('Enter the topic/chapter name:');
        if (!topicName || !topicName.trim()) {
            showToast('Topic name cannot be empty.', 'error');
            return;
        }
        
        const result = DSA.Store.addSyllabusTopic(syllabusId, topicName.trim());
        if (result) {
            showToast(`Topic "${topicName}" added successfully!`, 'success');
            refreshSyllabus();
        } else {
            showToast('Failed to add topic.', 'error');
        }
    }

    function deleteSyllabusTopicConfirm(syllabusId, topicIndex) {
        if (!confirm('Delete this topic? This cannot be undone.')) return;
        
        const result = DSA.Store.deleteSyllabusTopic(syllabusId, topicIndex);
        if (result) {
            showToast('Topic deleted successfully.', 'info');
            refreshSyllabus();
        } else {
            showToast('Failed to delete topic.', 'error');
        }
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
