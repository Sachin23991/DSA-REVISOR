/* ═══════════════════════════════════════════════════════
   DSA Tracker — Charts & Analytics Module
   Uses Chart.js for rendering
   ═══════════════════════════════════════════════════════ */

window.DSA = window.DSA || {};

DSA.Charts = (() => {
    let chartInstances = {};

    // Chart.js global defaults
    function setDefaults() {
        if (!window.Chart) return;
        const theme = getComputedStyle(document.documentElement);
        Chart.defaults.color = theme.getPropertyValue('--text-secondary').trim();
        Chart.defaults.borderColor = theme.getPropertyValue('--border-light').trim();
        Chart.defaults.font.family = theme.getPropertyValue('--font-sans').trim();
        Chart.defaults.font.size = 12;
        Chart.defaults.animation.duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280;
        Chart.defaults.plugins.legend.labels.boxWidth = 12;
        Chart.defaults.plugins.legend.labels.padding = 16;
    }

    function destroyChart(id) {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            delete chartInstances[id];
        }
    }

    // ── Solved Over Time (Line Chart) ──
    function renderSolvedOverTime(activity) {
        destroyChart('solvedOverTime');
        const ctx = document.getElementById('chart-solved-over-time');
        if (!ctx) return;

        // Build last 30 days data
        const labels = [];
        const solvedData = [];
        const revisedData = [];
        const cumulativeData = [];
        const firstDate = DSA.Store.addDays(DSA.Store.todayStr(), -29);
        let cumulative = 0;
        for (const [date, day] of activity) {
            if (date < firstDate) cumulative += day.practiced;
        }

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = DSA.Store.dateKey(d);
            labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));

            const day = activity.get(dateStr);
            const practiced = day?.practiced || 0;
            solvedData.push(practiced);
            revisedData.push(day?.reviewed || 0);
            cumulative += practiced;
            cumulativeData.push(cumulative);
        }

        chartInstances['solvedOverTime'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cumulative Studied',
                        data: cumulativeData,
                        borderColor: '#6c63ff',
                        backgroundColor: 'rgba(108, 99, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Practiced',
                        data: solvedData,
                        borderColor: '#2dd4a8',
                        backgroundColor: 'rgba(45, 212, 168, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Revisions Done',
                        data: revisedData,
                        borderColor: '#f6ad55',
                        backgroundColor: 'rgba(246, 173, 85, 0.1)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
                    y: { beginAtZero: true, ticks: { precision: 0 } },
                    y1: { position: 'right', beginAtZero: true, grid: { display: false } }
                },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // ── Subject Distribution (Doughnut Chart) ──
    function renderSubjectDist() {
        destroyChart('subjectDist');
        const ctx = document.getElementById('chart-subject-dist');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        const subjectCount = Object.create(null);
        questions.forEach(q => {
            subjectCount[q.subject] = (subjectCount[q.subject] || 0) + 1;
        });

        const sorted = Object.entries(subjectCount).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(s => s[0]);
        const data = sorted.map(s => s[1]);
        const colors = generateColors(labels.length);

        chartInstances['subjectDist'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: Chart.defaults.borderColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 } } }
                }
            }
        });
    }

    // ── Difficulty Distribution (Pie Chart) ──
    function renderDifficultyDist() {
        destroyChart('difficultyDist');
        const ctx = document.getElementById('chart-difficulty-dist');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        questions.forEach(q => { if (counts[q.difficulty] !== undefined) counts[q.difficulty]++; });

        chartInstances['difficultyDist'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [{
                    data: [counts.Easy, counts.Medium, counts.Hard],
                    backgroundColor: ['#2dd4a8', '#f6ad55', '#f56565'],
                    borderColor: Chart.defaults.borderColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    // ── Revision Consistency (Bar/Line Chart, last 30 days) ──
    function renderRevisionConsistency(activity) {
        destroyChart('revisionConsistency');
        const ctx = document.getElementById('chart-revision-consistency');
        if (!ctx) return;

        const labels = [];
        const data = [];
        const settings = DSA.Store.getSettings();
        const goalLine = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = DSA.Store.dateKey(d);
            labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
            data.push(activity.get(dateStr)?.reviewed || 0);
            goalLine.push(settings.dailyGoal);
        }

        chartInstances['revisionConsistency'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revisions',
                        data,
                        backgroundColor: 'rgba(108, 99, 255, 0.6)',
                        borderColor: '#6c63ff',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Current daily goal',
                        data: goalLine,
                        type: 'line',
                        borderColor: '#f6ad55',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // ── Mastery Progress (Horizontal Bar) ──
    function renderMasteryProgress() {
        destroyChart('mastery');
        const ctx = document.getElementById('chart-mastery');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        const statuses = ['Not Started', 'Solved', 'Needs Revision', 'Mastered'];

        chartInstances['mastery'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statuses,
                datasets: [{
                    data: statuses.map(status => questions.filter(question => question.status === status).length),
                    backgroundColor: ['#9ca3af', '#63b3ed', '#f6ad55', '#2dd4a8'],
                    borderRadius: 6,
                    barThickness: 30
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // ── Time Analysis per Difficulty ──
    function renderTimeAnalysis() {
        destroyChart('timeAnalysis');
        const ctx = document.getElementById('chart-time-analysis');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        const times = { Easy: [], Medium: [], Hard: [] };
        questions.forEach(q => {
            if (q.timeTaken && times[q.difficulty]) {
                times[q.difficulty].push(q.timeTaken);
            }
        });

        const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

        chartInstances['timeAnalysis'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [{
                    label: 'Avg Time (min)',
                    data: [avg(times.Easy), avg(times.Medium), avg(times.Hard)],
                    backgroundColor: ['rgba(45, 212, 168, 0.7)', 'rgba(246, 173, 85, 0.7)', 'rgba(245, 101, 101, 0.7)'],
                    borderColor: ['#2dd4a8', '#f6ad55', '#f56565'],
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, title: { display: true, text: 'Minutes' } }
                }
            }
        });
    }

    // ── Learning Curve (Growth Intel) ──
    function renderLearningCurve() {
        if (!window.Chart) return;
        setDefaults();
        destroyChart('learningCurve');
        const ctx = document.getElementById('chart-learning-curve');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        // Aggregate average quality rating per week
        const weekData = {};

        questions.forEach(q => {
            (q.revisionHistory || []).forEach(rev => {
                const d = new Date(`${rev.date}T12:00:00`);
                if (!Number.isFinite(d.getTime())) return;
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                const weekKey = DSA.Store.dateKey(weekStart);
                if (!weekData[weekKey]) weekData[weekKey] = { qualities: [], count: 0 };
                weekData[weekKey].qualities.push(rev.quality);
                weekData[weekKey].count++;
            });
        });

        const sortedWeeks = Object.entries(weekData).sort((a, b) => a[0].localeCompare(b[0]));
        const labels = sortedWeeks.map(w => {
            const d = new Date(`${w[0]}T12:00:00`);
            return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        });
        const avgQuality = sortedWeeks.map(w => {
            const q = w[1].qualities;
            return Math.round((q.reduce((a, b) => a + b, 0) / q.length) * 10) / 10;
        });
        const revCount = sortedWeeks.map(w => w[1].count);

        chartInstances['learningCurve'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Avg Recall Quality',
                        data: avgQuality,
                        borderColor: '#6c63ff',
                        backgroundColor: 'rgba(108, 99, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Revisions per Week',
                        data: revCount,
                        borderColor: '#2dd4a8',
                        backgroundColor: 'rgba(45, 212, 168, 0.1)',
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { min: 0, max: 5, title: { display: true, text: 'Quality (1-5)' } },
                    y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Count' }, grid: { display: false } }
                }
            }
        });
    }

    // ── Heatmap (GitHub-style) ──
    function renderHeatmap(activity = DSA.RevisionEngine.getStudyActivity()) {
        const grid = document.getElementById('heatmap-grid');
        const monthsEl = document.getElementById('heatmap-months');
        if (!grid || !monthsEl) return;

        const today = new Date();

        // Clear and rebuild
        grid.innerHTML = '';
        monthsEl.innerHTML = '';

        // Calculate start date (go back ~52 weeks, align to Sunday)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        // Align to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const firstDate = DSA.Store.dateKey(startDate);
        let maxActivity = 1;
        for (const [date, day] of activity) {
            if (date >= firstDate) maxActivity = Math.max(maxActivity, day.practiced + day.reviewed);
        }

        let lastMonth = '';
        let dayIndex = 0;

        const currentDate = new Date(startDate);
        while (currentDate <= today) {
            const dateStr = DSA.Store.dateKey(currentDate);
            const day = activity.get(dateStr);
            const count = day ? day.practiced + day.reviewed : 0;
            const level = Math.ceil(count / maxActivity * 4);

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.style.background = `var(--hm-${level})`;
            cell.title = `${dateStr}: ${count} ${count === 1 ? 'activity' : 'activities'}`;
            grid.appendChild(cell);

            const month = dateStr.slice(0, 7);
            if (month !== lastMonth && dayIndex % 7 === 0) {
                const label = document.createElement('span');
                label.textContent = currentDate.toLocaleDateString('en', { month: 'short' });
                label.style.gridColumn = String(dayIndex / 7 + 1);
                monthsEl.appendChild(label);
                lastMonth = month;
            }

            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex++;
        }
        const scroller = grid.closest('.heatmap-container');
        if (scroller?.clientWidth && !scroller.dataset.positioned) {
            scroller.dataset.positioned = 'true';
            requestAnimationFrame(() => { scroller.scrollLeft = scroller.scrollWidth; });
        }
    }

    // ── Mastery Table ──
    function renderMasteryTable() {
        const tbody = document.getElementById('mastery-table-body');
        if (!tbody) return;

        const questions = DSA.Store.getQuestions();
        const subjects = Object.create(null);

        questions.forEach(q => {
            if (!subjects[q.subject]) {
                subjects[q.subject] = { total: 0, mastered: 0, inProgress: 0 };
            }
            subjects[q.subject].total++;
            if (q.status === 'Mastered') subjects[q.subject].mastered++;
            else if (q.status !== 'Not Started') subjects[q.subject].inProgress++;
        });

        const sorted = Object.entries(subjects).sort((a, b) => b[1].total - a[1].total);
        if (!sorted.length) {
            tbody.innerHTML = '<tr><td colspan="6">No questions recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = sorted.map(([name, data]) => {
            const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
            const label = document.createElement('strong');
            label.textContent = name;
            return `<tr>
                <td>${label.outerHTML}</td>
                <td>${data.total}</td>
                <td>${data.mastered}</td>
                <td>${data.inProgress}</td>
                <td>${pct}%</td>
                <td>
                    <div class="mastery-bar">
                        <div class="mastery-bar-fill" style="width:${pct}%"></div>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ── Render All Analytics ──
    function renderAll() {
        const activity = DSA.RevisionEngine.getStudyActivity();
        document.getElementById('analytics-offline').hidden = Boolean(window.Chart);
        document.querySelector('#view-analytics .analytics-grid').hidden = !window.Chart;
        if (window.Chart) {
            setDefaults();
            renderSolvedOverTime(activity);
            renderSubjectDist();
            renderDifficultyDist();
            renderRevisionConsistency(activity);
            renderMasteryProgress();
            renderTimeAnalysis();
        }
        renderMasteryTable();
        renderHeatmap(activity);
    }

    // ── Color Generator ──
    function generateColors(count) {
        const palette = [
            '#6c63ff', '#2dd4a8', '#f6ad55', '#f56565', '#63b3ed',
            '#9b94ff', '#68d391', '#fc8181', '#ffd93d', '#76e4f7',
            '#b794f4', '#f687b3', '#48bb78', '#ed8936', '#4fd1c5',
            '#667eea', '#e53e3e', '#38b2ac', '#d69e2e', '#9f7aea'
        ];
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    return {
        renderAll,
        renderHeatmap,
        renderLearningCurve,
        renderMasteryTable,
        setDefaults,
        destroyChart
    };
})();
