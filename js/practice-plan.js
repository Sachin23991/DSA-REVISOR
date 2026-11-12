window.DSA = window.DSA || {};

DSA.PracticePlan = (() => {
    const dailyLimit = 5;
    const maxQuestions = 500;
    const planSelectionKey = 'dsa_practice_plan_selection';
    const numberedPrefix = /^(?:Q(?:uestion)?\s*)?(\d{1,5})(?:[.):](?=\s|\D|$)|\s+-)\s*/i;
    const bulletPrefix = /^(?:[-*+•‣▪–—]\s+)(?:\[[ x]\]\s+)?/i;
    const knownDomain = /^(?:leetcode\.com|codeforces\.com|codechef\.com|hackerrank\.com|geeksforgeeks\.org|atcoder\.jp)\//i;
    const columnsByName = {
        title: /^(?:question|problem)(?:\s+(?:title|name|statement))?$|^(?:title|name)$/i,
        difficulty: /^difficulty$/i,
        link: /^(?:problem\s+|question\s+)?(?:url|link|source|reference)$/i
    };
    const groupLabels = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };
    let selectedPlan = '';
    let chosenFilter = '';
    const copiedLinks = new Map();
    const copiedHeadings = new Set();

    function safeLink(value, base) {
        if (typeof value !== 'string' || !value) return '';
        try {
            const url = new URL(value, base);
            return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
        } catch {
            return '';
        }
    }

    function normalizeText(value) {
        return value.replace(/\s+/g, ' ').trim();
    }

    function questionName(line) {
        return line.trim().replace(numberedPrefix, '').replace(bulletPrefix, '').trim();
    }

    function titleFromLink(link) {
        const url = new URL(link);
        const segments = url.pathname.split('/').filter(Boolean);
        const problemIndex = segments.findIndex(segment => segment === 'problems' || segment === 'challenges');
        if (url.hostname.endsWith('codeforces.com') && /^\d+$/.test(segments[segments.length - 2] || '')) {
            return `Codeforces ${segments.slice(-2).join('')}`;
        }
        const slug = problemIndex >= 0 ? segments[problemIndex + 1] : segments[segments.length - 1];
        if (!slug) return url.hostname;
        let title = slug;
        try { title = decodeURIComponent(slug); } catch { /* Keep the original slug. */ }
        return title.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
    }

    function linkFromText(value) {
        const source = value.trim().replace(/[.,;!?]+$/, '');
        if (/\s/.test(source)) return '';
        const opens = (source.match(/\(/g) || []).length;
        const closes = (source.match(/\)/g) || []).length;
        const balanced = source.endsWith(')') && closes > opens ? source.slice(0, opens - closes) : source;
        return safeLink(/^www\./i.test(balanced) || knownDomain.test(balanced) ? `https://${balanced}` : balanced);
    }

    function splitCells(line, separator) {
        if (separator === '\t') return line.split('\t').map(value => value.trim());
        return line.replace(/^\||\|$/g, '').split('|').map(value => value.trim());
    }

    function parse(text, links = new Map(), headings = new Set()) {
        const lines = text.split(/\r\n?|\n/).filter(line => line.trim());
        const phaseHeading = /^Phase\s+\d+\s*:\s*(.+)$/i;
        const rangeSuffix = /\s*\(\s*\d+\s*[-–]\s*\d+\s*\)\s*$/;
        const groups = [];
        let currentTopic = 'Practice Questions';
        let currentEntries = [];
        let hasPhase = false;

        // First pass: detect if there are any Phase headings
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (phaseHeading.test(line)) {
                hasPhase = true;
                break;
            }
        }

        // If no phase headings, use the original single-topic parsing
        if (!hasPhase) {
            const firstLine = lines[0]?.trim() || '';
            const explicitHeading = firstLine.match(/^(?:topic|subject|chapter)\s*:\s*(.*)$/i) ||
                (lines.length > 1 && firstLine.match(/^#{1,6}\s+(.+)$/));
            const numberedHeading = lines.length > 2 &&
                Number(lines[1].trim().match(numberedPrefix)?.[1] || lines[1].match(/^\s*(\d+)\t/)?.[1]) === 1 &&
                Number(lines[2].trim().match(numberedPrefix)?.[1] || lines[2].match(/^\s*(\d+)\t/)?.[1]) === 2;
            const plainHeading = lines.length > 1 && (headings.has(normalizeText(firstLine)) ||
                (questionName(firstLine) === firstLine && firstLine.length < 80 && !/[?\t|]|https?:|www\./i.test(firstLine) &&
                    !knownDomain.test(firstLine) && (firstLine.endsWith(':') || numberedHeading)));
            if (explicitHeading || plainHeading) {
                currentTopic = normalizeText(explicitHeading ? explicitHeading[1] : firstLine.replace(/:$/, '')) || currentTopic;
                lines.shift();
            }
        }

        const linkPositions = new Map();
        let schema;
        let previousNumbered = false;

        const flushGroup = () => {
            if (currentEntries.length) {
                groups.push({ topic: currentTopic, entries: currentEntries });
                currentEntries = [];
            }
        };

        for (const rawLine of lines) {
            const line = rawLine.trim();

            // Detect Phase heading
            const phaseMatch = line.match(phaseHeading);
            if (phaseMatch) {
                flushGroup();
                currentTopic = normalizeText(phaseMatch[1].replace(rangeSuffix, '')) || 'Practice Questions';
                previousNumbered = false;
                schema = undefined;
                continue;
            }

            const separator = line.includes('\t') ? '\t' : line.startsWith('|') || schema?.separator === '|' ? '|' : '';
            const cells = separator ? splitCells(line, separator) : [line];
            if (separator === '|' && cells.every(cell => /^:?-{2,}:?$/.test(cell))) continue;

            const titleColumn = cells.findIndex(cell => columnsByName.title.test(cell));
            const difficultyColumn = cells.findIndex(cell => columnsByName.difficulty.test(cell));
            const linkColumn = cells.findIndex(cell => columnsByName.link.test(cell));
            if (cells.length > 1 && titleColumn >= 0 && (difficultyColumn >= 0 || linkColumn >= 0 || /^#|^(?:id|no\.?|status)$/i.test(cells[0]))) {
                schema = { separator, titleColumn, difficultyColumn, linkColumn };
                continue;
            }

            const tableRow = cells.length > 1;
            const columns = tableRow && schema?.separator === separator ? schema : null;
            const candidates = tableRow ? cells.filter(cell => cell && !/^\d+[.)]?$/.test(cell)) : cells;
            let name = questionName(columns ? cells[columns.titleColumn] || '' : candidates[0] || '');
            if (!name) continue;

            const bareLink = linkFromText(name);
            const isNumbered = !tableRow && numberedPrefix.test(line);
            const previous = currentEntries[currentEntries.length - 1];
            if (previous && previousNumbered && !isNumbered && !tableRow && !bulletPrefix.test(line)) {
                if (bareLink && !previous.platformLink) {
                    previous.platformLink = bareLink;
                    continue;
                }
                if (/^ {2,}\S/.test(rawLine) || /^(?:input|output|example(?:\s+\d+)?|constraints)\s*:/i.test(line)) {
                    previous.name = normalizeText(`${previous.name} ${line}`);
                    continue;
                }
            }

            const markdown = name.match(/^\[([^\]]+)\]\(\s*<?(https?:\/\/[^\s<>]+?)>?(?:\s+["'][^"']*["'])?\s*\)$/i);
            const inline = name.match(/(?:https?:\/\/|www\.|(?:leetcode\.com|codeforces\.com|codechef\.com|hackerrank\.com|geeksforgeeks\.org|atcoder\.jp)\/)[^\s<>"'|]+/i);
            const inlineLink = markdown ? safeLink(markdown[2]) : bareLink || (inline ? linkFromText(inline[0]) : '');
            const normalizedName = normalizeText(markdown ? markdown[1] : name);
            const copied = links.get(normalizedName);
            const position = linkPositions.get(normalizedName) || 0;
            const copiedLink = Array.isArray(copied) ? copied[position] || (copied.length === 1 ? copied[0] : '') : copied;
            if (copied) linkPositions.set(normalizedName, position + 1);
            const directLink = columns?.linkColumn >= 0 ? linkFromText(cells[columns.linkColumn] || '') : '';
            const platformLink = inlineLink || directLink || safeLink(copiedLink) ||
                (!columns ? candidates.slice(1).map(linkFromText).find(Boolean) : '') || '';

            if (markdown) name = markdown[1];
            else if (bareLink) name = '';
            else if (inlineLink && inline) {
                name = name.replace(inline[0], '').replace(/\(\s*\)|<\s*>|\[\s*\]/g, '').replace(/[\s—–|:;(-]+$/, '');
            }
            name = normalizeText(name);
            if (!name && platformLink) name = titleFromLink(platformLink);
            if (!name) continue;

            const difficultyCell = columns?.difficultyColumn >= 0 ? cells[columns.difficultyColumn] :
                candidates.slice(1).find(cell => /^(easy|medium|hard)$/i.test(cell));
            const difficulty = /^(easy|medium|hard)$/i.test(difficultyCell || '') ? difficultyCell.toLowerCase() : '';
            currentEntries.push({ name, platformLink, difficulty: difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1) : 'Medium' });
            previousNumbered = isNumbered;
        }
        flushGroup();
        return groups.length ? groups : [{ topic: currentTopic, entries: [] }];
    }

    function captureLinks(event) {
        const target = event.currentTarget;
        if (!target.value || (target.selectionStart === 0 && target.selectionEnd === target.value.length)) {
            copiedLinks.clear();
            copiedHeadings.clear();
        }
        const clipboard = event.clipboardData;
        const html = clipboard?.getData('text/html');
        if (!html) return;
        const template = document.createElement('template');
        template.innerHTML = html;
        const base = safeLink(template.content.querySelector('base[href]')?.getAttribute('href')) || undefined;
        const remember = (name, link) => {
            if (!name) return;
            const key = normalizeText(questionName(name));
            const urls = copiedLinks.get(key) || [];
            urls.push(link);
            copiedLinks.set(key, urls);
        };
        const heading = template.content.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading && !heading.closest('li, tr') && !heading.querySelector('a[href]') && template.content.querySelector('ul, ol, table')) {
            copiedHeadings.add(normalizeText(heading.textContent));
        }
        template.content.querySelectorAll('a[href]').forEach(anchor => {
            const name = normalizeText(questionName(anchor.textContent));
            const link = safeLink(anchor.getAttribute('href'), base);
            if (!name || !link) return;
            remember(name, link);
            const row = anchor.closest('li, p');
            if (row && normalizeText(questionName(row.textContent)) !== name) remember(row.textContent, link);
        });
    }

    function init() {
        const input = document.getElementById('practice-input');
        const message = document.getElementById('practice-message');
        const preview = document.getElementById('practice-preview');
        const filter = document.getElementById('practice-filter');
        const importPanel = document.getElementById('practice-import-panel');
        const compact = window.matchMedia('(max-width: 660px)');
        try { selectedPlan = sessionStorage.getItem(planSelectionKey) || ''; } catch { /* Browser storage is optional for selection. */ }

        function closeImportOnSmallScreens() {
            if (compact.matches && !input.value && DSA.Store.getQuestions().some(question => question.practicePlanId)) {
                importPanel.open = false;
            }
        }
        closeImportOnSmallScreens();
        compact.addEventListener('change', closeImportOnSmallScreens);

        input.addEventListener('paste', captureLinks);
        input.addEventListener('input', () => {
            message.textContent = '';
            if (!input.value.trim()) {
                copiedLinks.clear();
                copiedHeadings.clear();
            }
            if (!preview) return;
            const groups = parse(input.value, copiedLinks, copiedHeadings);
            const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
            if (!input.value.trim()) preview.textContent = '';
            else if (!total) preview.textContent = 'No questions found yet.';
            else if (total > maxQuestions) preview.textContent = `Found ${total} questions. Paste up to ${maxQuestions} at a time.`;
            else {
                const linked = groups.reduce((sum, group) => sum + group.entries.filter(entry => entry.platformLink).length, 0);
                const topics = groups.filter(group => group.entries.length).length;
                preview.textContent = `${total} ${total === 1 ? 'question' : 'questions'} detected${topics > 1 ? ` across ${topics} topics` : ''}${linked ? ` · ${linked} with links` : ''}`;
            }
        });
        document.getElementById('practice-form').addEventListener('submit', event => {
            event.preventDefault();
            const groups = parse(input.value, copiedLinks, copiedHeadings);
            const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
            if (!total || total > maxQuestions) {
                message.textContent = `Paste between 1 and ${maxQuestions} questions, one per line.`;
                return;
            }
            try {
                const planIds = DSA.Store.addPracticeQuestions(groups, dailyLimit);
                selectPlan(planIds[0]);
            } catch (error) {
                message.textContent = error.message;
                return;
            }
            input.value = '';
            copiedLinks.clear();
            copiedHeadings.clear();
            if (preview) preview.textContent = '';
            chosenFilter = '';
            const topicCount = groups.filter(group => group.entries.length).length;
            message.textContent = `Added ${total} ${total === 1 ? 'question' : 'questions'}${topicCount > 1 ? ` across ${topicCount} topics` : ''} over ${Math.ceil(total / dailyLimit)} ${total <= dailyLimit ? 'day' : 'days'}.`;
            DSA.App.refreshPracticeData();
            render();
            if (compact.matches) {
                closeImportOnSmallScreens();
                DSA.App.showToast(message.textContent, 'success');
                document.getElementById('practice-select').focus();
            }
        });
        document.getElementById('practice-select').addEventListener('change', event => {
            selectPlan(event.target.value);
            chosenFilter = '';
            render();
        });
        filter.addEventListener('change', () => {
            chosenFilter = filter.value;
            render();
        });
    }

    function selectPlan(id) {
        selectedPlan = id;
        try { sessionStorage.setItem(planSelectionKey, id); } catch { /* Browser storage is optional for selection. */ }
    }

    function getQueue(today = DSA.Store.todayStr()) {
        return DSA.Store.getQuestions()
            .filter(q => q.practicePlanId)
            .map(question => ({ question, state: getState(question, today) }))
            .filter(({ state }) => state.action)
            .sort(compareSchedule)
            .map(({ question }) => question);
    }

    function compareSchedule(a, b) {
        return (a.state.date || '').localeCompare(b.state.date || '') ||
            Number(b.state.action === 'revise') - Number(a.state.action === 'revise');
    }

    function scheduleDate(value) {
        return typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value) &&
            Number.isFinite(new Date(`${value}T12:00:00`).getTime()) ? value : '';
    }

    function getState(question, today) {
        if (question.status === 'Not Started') {
            const date = scheduleDate(question.practiceDate) || today;
            if (date > today) return { label: 'Scheduled', date, group: 'upcoming', upcomingPractice: true };
            return date === today
                ? { label: 'Practice today', date, action: 'complete', group: 'today' }
                : { label: 'Practice overdue', date, action: 'complete', group: 'overdue' };
        }
        if (question.status === 'Mastered') return { label: 'Mastered', group: 'completed' };
        const date = scheduleDate(question.nextRevisionDate);
        if (date && date <= today) {
            return date === today
                ? { label: 'Review today', date, action: 'revise', group: 'today' }
                : { label: 'Review overdue', date, action: 'revise', group: 'overdue' };
        }
        return date
            ? { label: 'Practiced', date, group: 'upcoming' }
            : { label: 'Practiced', group: 'completed' };
    }

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function formatDate(date) {
        return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function refreshAction(question, queue, position) {
        DSA.App.refreshPracticeData();
        if (!queue) render();
        const container = document.getElementById(queue ? 'revision-list' : 'practice-list');
        const remainingActions = container.querySelectorAll('button[data-practice-action]');
        const nextAction = position === null ? null : remainingActions[Math.min(position, remainingActions.length - 1)];
        const fallback = document.getElementById(`${queue ? 'queue' : 'practice'}-item-${question.id}`) ||
            document.querySelector(queue ? '.rev-tab.active' : '#practice-filter');
        (nextAction || fallback)?.focus({ preventScroll: true });
        if (nextAction) nextAction.scrollIntoView({ block: 'nearest' });
    }

    function doAction(question, action, queue, defer, target) {
        const current = DSA.Store.getQuestionById(question.id);
        const today = DSA.Store.todayStr();
        if (!current) return;
        const state = getState(current, today);
        const studyAhead = state.upcomingPractice && action === 'complete' && !defer;
        if (state.action !== action && !studyAhead) return;
        const container = document.getElementById(queue ? 'revision-list' : 'practice-list');
        const buttons = Array.from(container.querySelectorAll('button[data-practice-action]'));
        const position = studyAhead ? null : Math.max(0, buttons.indexOf(target.closest('.practice-item').querySelector('button[data-practice-action]')));

        try {
            if (defer) {
                const dateField = action === 'complete' ? 'practiceDate' : 'nextRevisionDate';
                DSA.Store.updateQuestion(current.id, { [dateField]: DSA.Store.addDays(today, 1) });
                DSA.App.showToast('Moved to tomorrow.', 'info');
            } else if (action === 'revise') {
                DSA.App.completeQuestionRevision(current.id, 4, 0, '');
            } else {
                const updates = { status: 'Solved', dateSolved: today };
                updates.nextRevisionDate = DSA.RevisionEngine.calculateNextDate({ ...current, ...updates }, DSA.Store.getSettings());
                const completed = DSA.Store.updateQuestion(current.id, updates, {
                    type: 'add',
                    text: `Completed “${current.name}”`
                });
                if (completed) {
                    try {
                        DSA.App.recordQuestionStudy(completed);
                        DSA.App.showToast(updates.nextRevisionDate ?
                            `Marked done. First review ${formatDate(updates.nextRevisionDate)}.` : 'Marked done.', 'success');
                    } catch (error) {
                        console.error('Could not update practice rewards:', error);
                        DSA.App.showToast('Question marked done. Some rewards could not update.', 'warning');
                    }
                }
            }
        } catch (error) {
            DSA.App.showToast(error.message, 'error');
            return;
        }
        refreshAction(question, queue, position);
    }

    function buildRow({ question, state }, today, queue) {
        const row = element('article', '', 'practice-item');
        row.id = `${queue ? 'queue' : 'practice'}-item-${question.id}`;
        row.tabIndex = -1;
        const copy = element('div', '', 'practice-item-copy');
        copy.append(element('h4', question.name, 'practice-item-title'));
        const meta = element('div', '', 'practice-meta');
        if (queue || question.practiceTopic) meta.append(element('span', question.practiceTopic || question.subject));
        const statusClass = state.group === 'overdue' ? ' practice-status-overdue' : state.action ? ' practice-status-due' : '';
        meta.append(element('span', state.label, `practice-status${statusClass}`));
        if (state.date && state.date !== today) {
            const prefix = state.group === 'overdue' ? 'Due ' : state.upcomingPractice ? '' : 'Review ';
            const time = element('time', `${prefix}${formatDate(state.date)}`);
            time.dateTime = state.date;
            meta.append(time);
        }
        const count = question.revisionHistory?.length || 0;
        if (count) meta.append(element('span', `${count} ${count === 1 ? 'review' : 'reviews'} logged`));
        const link = safeLink(question.platformLink);
        if (link) {
            const anchor = element('a', 'Source ↗');
            anchor.href = link;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.setAttribute('aria-label', `Open source for ${question.name} (new tab)`);
            meta.append(anchor);
        }
        copy.append(meta);
        row.append(copy);

        if (state.action || state.upcomingPractice) {
            const actions = element('div', '', 'practice-actions');
            const action = state.action || 'complete';
            const label = state.upcomingPractice ? 'Study ahead' : action === 'complete' ? 'Mark done' : 'Mark revised';
            const primary = element('button', label, `btn btn-sm ${state.upcomingPractice ? 'btn-outline' : 'btn-primary'}`);
            primary.type = 'button';
            primary.setAttribute('aria-label', `${label}: ${question.name}`);
            if (state.action) primary.dataset.practiceAction = action;
            primary.addEventListener('click', event => doAction(question, action, queue, false, event.currentTarget));
            actions.append(primary);
            if (state.action) {
                const later = element('button', action === 'complete' ? 'Do later' : 'Revise later', 'btn btn-sm btn-outline');
                later.type = 'button';
                later.setAttribute('aria-label', `${later.textContent}: ${question.name}`);
                later.addEventListener('click', event => doAction(question, action, queue, true, event.currentTarget));
                actions.append(later);
            }
            row.append(actions);
        }
        return row;
    }

    function buildGroups(records, today, queue = false) {
        const groups = new Map(Object.keys(groupLabels).map(name => [name, []]));
        for (const record of records) groups.get(record.state.group).push(record);
        const sections = [];
        for (const [name, entries] of groups) {
            if (!entries.length) continue;
            entries.sort(compareSchedule);
            const group = element('section', '', 'practice-group');
            const heading = element('h3', groupLabels[name], 'practice-group-title');
            heading.append(element('span', ` ${entries.length}`, 'practice-group-count'));
            const rows = element('div', '', 'practice-group-rows');
            rows.append(...entries.map(record => buildRow(record, today, queue)));
            group.append(heading, rows);
            sections.push(group);
        }
        return sections;
    }

    function renderQueue(container, questions) {
        const today = DSA.Store.todayStr();
        const records = questions.map(question => ({ question, state: getState(question, today) }));
        container.replaceChildren(...buildGroups(records, today, true));
        if (!questions.length) {
            const empty = element('div', '', 'practice-empty');
            empty.append(element('p', 'Nothing due in your practice plans.'));
            const openPlan = element('button', 'Open Practice Plan', 'btn btn-outline');
            openPlan.type = 'button';
            openPlan.addEventListener('click', () => DSA.App.switchView('practice'));
            empty.append(openPlan);
            container.append(empty);
        }
    }

    function render() {
        const plans = new Map();
        for (const question of DSA.Store.getQuestions()) {
            if (!question.practicePlanId) continue;
            if (!plans.has(question.practicePlanId)) plans.set(question.practicePlanId, []);
            plans.get(question.practicePlanId).push(question);
        }

        const selector = document.getElementById('practice-select');
        const filter = document.getElementById('practice-filter');
        const list = document.getElementById('practice-list');
        const summary = document.getElementById('practice-summary');
        const options = Array.from(plans).reverse();
        selector.replaceChildren(...options.map(([id, questions]) => {
            const topics = [...new Set(questions.map(q => q.practiceTopic || q.subject))];
            const label = topics.length > 1 ? `${topics[0]} +${topics.length - 1} more` : (topics[0] || 'Practice Plan');
            return new Option(label, id);
        }));
        selector.disabled = !options.length;
        if (!plans.has(selectedPlan)) selectedPlan = options[0]?.[0] || '';
        selector.value = selectedPlan;
        const questions = plans.get(selectedPlan) || [];
        summary.replaceChildren();
        list.replaceChildren();
        if (!questions.length) {
            selector.append(new Option('No plans yet', ''));
            filter.disabled = true;
            list.append(element('p', 'Your schedule will appear here after you paste your first list.', 'empty-state'));
            return;
        }

        const today = DSA.Store.todayStr();
        const records = questions.map(question => ({ question, state: getState(question, today) }));
        const practiced = records.filter(({ question }) => question.status !== 'Not Started').length;
        const revised = records.filter(({ question }) => question.revisionHistory?.length).length;
        const due = records.filter(({ state }) => state.action).length;
        for (const [label, count] of [['Practiced', `${practiced} of ${questions.length}`], ['Reviewed', revised], ['Needs action', due]]) {
            const stat = element('div', '', 'practice-stat');
            stat.append(element('strong', String(count)), element('span', label));
            summary.append(stat);
        }
        filter.disabled = false;
        filter.value = chosenFilter || 'all';
        const filtered = records.filter(({ question, state }) => {
            switch (filter.value) {
                case 'due': return Boolean(state.action);
                case 'pending': return question.status === 'Not Started';
                case 'completed': return question.status !== 'Not Started';
                case 'revised': return Boolean(question.revisionHistory?.length);
                default: return true;
            }
        });
        list.append(...buildGroups(filtered, today));
        if (!filtered.length) {
            const message = filter.value === 'due' ? 'Nothing due. Check All questions for your schedule.' : 'No questions match this filter.';
            list.append(element('p', message, 'empty-state'));
        }
    }

    return { init, render, getQueue, renderQueue, parse, safeLink };
})();
