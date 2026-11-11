const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadTracker() {
    const storage = new Map();
    const context = vm.createContext({
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key)
        }
    });
    context.window = context;
    for (const file of ['store.js', 'revision-engine.js', 'gamification.js']) {
        const source = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
        vm.runInContext(source, context, { filename: file });
    }
    context.DSA.Store.todayStr = () => '2026-11-12';
    return context.DSA;
}

function progress(DSA) {
    const { completed, goal, percentage } = DSA.RevisionEngine.getDailyReviewProgress();
    return { completed, goal, percentage };
}

test('an empty tracker is at zero percent of its daily review goal', () => {
    const DSA = loadTracker();
    assert.deepEqual(progress(DSA), { completed: 0, goal: 5, percentage: 0 });
    assert.equal(DSA.Gamification.getCurrentStreak(), 0);
});

test('twenty inactive days with an overdue review do not create progress', () => {
    const DSA = loadTracker();
    const lastStudy = '2026-10-23';
    const question = DSA.Store.addQuestion({ name: 'Two Sum', subject: 'Arrays', difficulty: 'Easy', status: 'Solved', dateSolved: lastStudy });
    DSA.Store.updateQuestion(question.id, { nextRevisionDate: lastStudy });
    DSA.Store.saveUserStats({ ...DSA.Store.getUserStats(), lastActiveDate: lastStudy, currentStreak: 6 });
    DSA.Store.logDailyActivity(DSA.Store.todayStr(), 'solved');

    assert.equal(DSA.RevisionEngine.getOverdue().length, 1);
    assert.equal(DSA.RevisionEngine.getStudyActivity().has(DSA.Store.todayStr()), false);
    assert.deepEqual(progress(DSA), { completed: 0, goal: 5, percentage: 0 });
    assert.equal(DSA.Gamification.getCurrentStreak(), 0);
});

test('planning, practicing, and reviewing produce distinct counts', () => {
    const DSA = loadTracker();
    const today = DSA.Store.todayStr();
    DSA.Store.addPracticeQuestions('Arrays', [{ name: 'Two Sum', platformLink: '', difficulty: 'Easy' }], 5);
    const [question] = DSA.Store.getQuestions();
    assert.equal(DSA.RevisionEngine.getStudyActivity().has(today), false);
    assert.deepEqual(progress(DSA), { completed: 0, goal: 5, percentage: 0 });

    DSA.Store.updateQuestion(question.id, { status: 'Solved', dateSolved: today });
    assert.equal(DSA.RevisionEngine.getStudyActivity().get(today).practiced, 1);
    assert.deepEqual(progress(DSA), { completed: 0, goal: 5, percentage: 0 });

    DSA.RevisionEngine.completeRevision(question.id, 4, 0, '');
    assert.deepEqual(progress(DSA), { completed: 1, goal: 5, percentage: 20 });
    DSA.Store.deleteQuestion(question.id);
    assert.deepEqual(progress(DSA), { completed: 1, goal: 5, percentage: 20 });
});
