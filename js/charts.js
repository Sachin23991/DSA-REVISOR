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
        Chart.defaults.color = '#9398b0';
        Chart.defaults.borderColor = '#2a2d45';
        Chart.defaults.font.family = "'Segoe UI', sans-serif";
        Chart.defaults.font.size = 12;
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
    function renderSolvedOverTime() {
        destroyChart('solvedOverTime');
        const ctx = document.getElementById('chart-solved-over-time');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        const dailyLog = DSA.Store.getDailyLog();

        // Build last 30 days data
        const labels = [];
        const solvedData = [];
        const revisedData = [];
        const cumulativeData = [];
        let cumulative = 0;

        // Count all questions solved before last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        cumulative = questions.filter(q => new Date(q.dateSolved) < thirtyDaysAgo).length;

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));

            const dayQuestions = questions.filter(q => q.dateSolved === dateStr).length;
            const log = dailyLog[dateStr];
            solvedData.push(dayQuestions);
            revisedData.push(log ? log.revised : 0);
            cumulative += dayQuestions;
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
                        label: 'New Topics',
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
                    y: { beginAtZero: true, grid: { color: '#1e2030' } },
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
        const subjectCount = {};
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
                    borderColor: '#161822',
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
                    borderColor: '#161822',
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
    function renderRevisionConsistency() {
        destroyChart('revisionConsistency');
        const ctx = document.getElementById('chart-revision-consistency');
        if (!ctx) return;

        const dailyLog = DSA.Store.getDailyLog();
        const labels = [];
        const data = [];
        const settings = DSA.Store.getSettings();
        const goalLine = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en', { day: 'numeric' }));
            const log = dailyLog[dateStr];
            data.push(log ? log.revised : 0);
            goalLine.push(settings.dailyGoal || 5);
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
                        label: 'Daily Goal',
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
                    y: { beginAtZero: true, grid: { color: '#1e2030' } }
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
        const statusCount = { 'Solved': 0, 'Needs Revision': 0, 'Mastered': 0 };
        questions.forEach(q => { if (statusCount[q.status] !== undefined) statusCount[q.status]++; });

        chartInstances['mastery'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Solved', 'Needs Revision', 'Mastered'],
                datasets: [{
                    data: [statusCount['Solved'], statusCount['Needs Revision'], statusCount['Mastered']],
                    backgroundColor: ['#63b3ed', '#f6ad55', '#2dd4a8'],
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
                    x: { beginAtZero: true, grid: { color: '#1e2030' } },
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

        const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

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
                    y: { beginAtZero: true, grid: { color: '#1e2030' }, title: { display: true, text: 'Minutes' } }
                }
            }
        });
    }

    // ── Learning Curve (Growth Intel) ──
    function renderLearningCurve() {
        destroyChart('learningCurve');
        const ctx = document.getElementById('chart-learning-curve');
        if (!ctx) return;

        const questions = DSA.Store.getQuestions();
        // Aggregate average quality rating per week
        const weekData = {};

        questions.forEach(q => {
            (q.revisionHistory || []).forEach(rev => {
                const d = new Date(rev.date);
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                if (!weekData[weekKey]) weekData[weekKey] = { qualities: [], count: 0 };
                weekData[weekKey].qualities.push(rev.quality);
                weekData[weekKey].count++;
            });
        });

        const sortedWeeks = Object.entries(weekData).sort((a, b) => a[0].localeCompare(b[0]));
        const labels = sortedWeeks.map(w => {
            const d = new Date(w[0]);
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
                    y: { min: 0, max: 5, title: { display: true, text: 'Quality (1-5)' }, grid: { color: '#1e2030' } },
                    y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Count' }, grid: { display: false } }
                }
            }
        });
    }

    // ── Heatmap (GitHub-style) ──
    function renderHeatmap() {
        const grid = document.getElementById('heatmap-grid');
        const monthsEl = document.getElementById('heatmap-months');
        if (!grid || !monthsEl) return;

        const dailyLog = DSA.Store.getDailyLog();
        const questions = DSA.Store.getQuestions();
        const today = new Date();

        // Build activity counts per day for last 365 days
        const activityMap = {};
        // Count questions solved per day
        questions.forEach(q => {
            const d = q.dateSolved;
            if (d) activityMap[d] = (activityMap[d] || 0) + 1;
        });
        // Add revisions
        Object.entries(dailyLog).forEach(([date, log]) => {
            activityMap[date] = (activityMap[date] || 0) + (log.revised || 0);
        });

        // Find max for scaling
        const maxActivity = Math.max(1, ...Object.values(activityMap));

        // Clear and rebuild
        grid.innerHTML = '';
        monthsEl.innerHTML = '';

        // Calculate start date (go back ~52 weeks, align to Sunday)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        // Align to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const months = [];
        let lastMonth = -1;

        const currentDate = new Date(startDate);
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;
            const level = count === 0 ? 0 : count <= maxActivity * 0.25 ? 1 : count <= maxActivity * 0.5 ? 2 : count <= maxActivity * 0.75 ? 3 : 4;

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.style.background = `var(--hm-${level})`;
            cell.title = `${dateStr}: ${count} activities`;
            grid.appendChild(cell);

            // Track months
            const month = currentDate.getMonth();
            if (month !== lastMonth && currentDate.getDay() === 0) {
                months.push({
                    name: currentDate.toLocaleDateString('en', { month: 'short' }),
                    position: months.length
                });
                lastMonth = month;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Render month labels
        const totalWeeks = Math.ceil(365 / 7);
        months.forEach((m, idx) => {
            const span = document.createElement('span');
            span.textContent = m.name;
            span.style.position = 'relative';
            span.style.minWidth = `${(totalWeeks / months.length) * 16}px`;
            monthsEl.appendChild(span);
        });
    }

    // ── Mastery Table ──
    function renderMasteryTable() {
        const tbody = document.getElementById('mastery-table-body');
        if (!tbody) return;

        const questions = DSA.Store.getQuestions();
        const subjects = {};

        questions.forEach(q => {
            if (!subjects[q.subject]) {
                subjects[q.subject] = { total: 0, mastered: 0, inProgress: 0 };
            }
            subjects[q.subject].total++;
            if (q.status === 'Mastered') subjects[q.subject].mastered++;
            else subjects[q.subject].inProgress++;
        });

        const sorted = Object.entries(subjects).sort((a, b) => b[1].total - a[1].total);

        tbody.innerHTML = sorted.map(([name, data]) => {
            const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
            return `<tr>
                <td><strong>${name}</strong></td>
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
        setDefaults();
        renderSolvedOverTime();
        renderSubjectDist();
        renderDifficultyDist();
        renderRevisionConsistency();
        renderMasteryProgress();
        renderTimeAnalysis();
        renderMasteryTable();
        renderHeatmap();
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
