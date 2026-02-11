/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — SM-2 Spaced Repetition Engine
   
   Algorithm: SuperMemo-2 (SM-2) with modifications
   
   - Ease Factor adjustment based on response quality (0-5)
   - Interval scheduling: 1d → 3d → prev × EF
   - Priority scoring for revision queue
   ═══════════════════════════════════════════════════════════════════ */

#ifndef REVISION_ENGINE_H
#define REVISION_ENGINE_H

#include "dsa_core.h"
#include <cmath>

using namespace std;

namespace dsa {

class RevisionEngine {
public:
    // SM-2 base intervals for first revisions
    static constexpr int INTERVAL_1 = 1;   // 1 day after first solve
    static constexpr int INTERVAL_2 = 3;   // 3 days after second revision
    static constexpr double EF_MIN  = 1.3; // minimum ease factor

    // ── SM-2: Calculate next revision date ──

    static string calculateNextDate(const Question& q) {
        int interval;

        if (q.revisionCycle <= 1) {
            interval = INTERVAL_1;
        } else if (q.revisionCycle == 2) {
            interval = INTERVAL_2;
        } else {
            // nth cycle: previous interval × ease factor
            int prevInterval = INTERVAL_2;
            double ef = q.easeFactor;
            for (int i = 3; i <= q.revisionCycle; ++i)
                prevInterval = static_cast<int>(ceil(prevInterval * ef));
            interval = prevInterval;
        }

        // difficulty multiplier
        double diffMult = 1.0;
        if (q.difficulty == Difficulty::HARD)   diffMult = 0.8;
        if (q.difficulty == Difficulty::EASY)   diffMult = 1.2;
        interval = max(1, static_cast<int>(ceil(interval * diffMult)));

        string baseDate = q.lastRevisionDate.empty() ? q.dateSolved : q.lastRevisionDate;
        if (baseDate.empty()) baseDate = todayStr();

        return addDaysToDate(baseDate, interval);
    }

    // ── SM-2: Update ease factor based on quality (0–5) ──
    //
    //   EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
    //   quality 5 = perfect recall   quality 0 = blackout

    static double updateEaseFactor(double currentEF, int quality) {
        quality = max(0, min(5, quality));
        double delta = 0.1 - (5.0 - quality) * (0.08 + (5.0 - quality) * 0.02);
        double newEF = currentEF + delta;
        return max(EF_MIN, newEF);
    }

    // ── Complete a revision ──

    struct RevisionResult {
        double newEaseFactor;
        int    newCycle;
        int    newStreak;
        string nextDate;
        QuestionStatus newStatus;
        int    xpAwarded;
        bool   wasReset;
    };

    static RevisionResult completeRevision(Question& q, int quality, int timeTaken = 0) {
        RevisionResult result;
        result.wasReset = false;

        // update ease factor
        result.newEaseFactor = updateEaseFactor(q.easeFactor, quality);
        q.easeFactor = result.newEaseFactor;

        // update streak and cycle based on recall quality
        if (quality >= 3) {
            // successful recall
            q.revisionCycle++;
            q.streak++;
        } else {
            // failed recall — reset cycle
            q.revisionCycle = 1;
            q.streak = 0;
            result.wasReset = true;
        }
        result.newCycle  = q.revisionCycle;
        result.newStreak = q.streak;

        // determine status
        if (q.revisionCycle >= 5 && q.easeFactor >= 2.3) {
            q.status = QuestionStatus::MASTERED;
        } else if (quality < 3) {
            q.status = QuestionStatus::NEEDS_REVISION;
        } else {
            q.status = QuestionStatus::SOLVED;
        }
        result.newStatus = q.status;

        // calculate next date
        q.lastRevisionDate = todayStr();
        result.nextDate = calculateNextDate(q);
        q.nextRevisionDate = result.nextDate;

        // award XP
        result.xpAwarded = calculateRevisionXP(q, quality, timeTaken);
        q.xpEarned += result.xpAwarded;

        return result;
    }

    // ── XP Calculation ──

    static int calculateRevisionXP(const Question& q, int quality, int timeTaken) {
        // base XP by difficulty
        int baseXP = 10;
        if (q.difficulty == Difficulty::MEDIUM) baseXP = 20;
        if (q.difficulty == Difficulty::HARD)   baseXP = 35;

        // quality multiplier
        double qualityMult = 0.5 + quality * 0.2;   // 0.5 → 1.5

        // cycle bonus — deeper cycles = more XP
        double cycleMult = 1.0 + min(q.revisionCycle, 10) * 0.1;

        // streak bonus
        double streakMult = 1.0 + min(q.streak, 7) * 0.05;

        // speed bonus if answered quickly (< 60s for Easy, < 120s Med, < 180s Hard)
        double speedMult = 1.0;
        if (timeTaken > 0) {
            int threshold = 60;
            if (q.difficulty == Difficulty::MEDIUM) threshold = 120;
            if (q.difficulty == Difficulty::HARD)   threshold = 180;
            if (timeTaken < threshold)
                speedMult = 1.0 + (1.0 - static_cast<double>(timeTaken) / threshold) * 0.3;
        }

        return static_cast<int>(baseXP * qualityMult * cycleMult * streakMult * speedMult);
    }

    // ── Get questions due today ──

    static vector<Question> getDueToday(const vector<Question>& questions) {
        string today = todayStr();
        vector<Question> due;
        for (const auto& q : questions) {
            if (q.status == QuestionStatus::MASTERED) continue;
            if (q.nextRevisionDate.empty()) continue;
            if (q.nextRevisionDate <= today)
                due.push_back(q);
        }
        return due;
    }

    // ── Get overdue questions (past due date) ──

    static vector<Question> getOverdue(const vector<Question>& questions) {
        string today = todayStr();
        vector<Question> overdue;
        for (const auto& q : questions) {
            if (q.status == QuestionStatus::MASTERED) continue;
            if (q.nextRevisionDate.empty()) continue;
            if (q.nextRevisionDate < today)
                overdue.push_back(q);
        }
        return overdue;
    }

    // ── Get upcoming revisions (next N days) ──

    static vector<Question> getUpcoming(const vector<Question>& questions, int days = 7) {
        string today = todayStr();
        string future = addDaysToDate(today, days);
        vector<Question> upcoming;
        for (const auto& q : questions) {
            if (q.status == QuestionStatus::MASTERED) continue;
            if (q.nextRevisionDate.empty()) continue;
            if (q.nextRevisionDate > today && q.nextRevisionDate <= future)
                upcoming.push_back(q);
        }
        return upcoming;
    }

    // ── Difficulty rating suggestion ──

    static string suggestAction(const Question& q) {
        if (q.status == QuestionStatus::MASTERED)
            return "Mastered! No action needed.";
        if (q.easeFactor < 1.5)
            return "WARNING: Very low ease factor. Re-study from scratch.";
        if (q.easeFactor < 2.0)
            return "Struggling — try simpler related problems first.";
        if (q.revisionCycle == 0)
            return "Not yet revised — start your first revision!";
        if (q.streak >= 3)
            return "Good streak! Keep it up.";
        return "Continue with regular revisions.";
    }

    void printStatus(const vector<Question>& questions) const {
        auto due     = getDueToday(questions);
        auto overdue = getOverdue(questions);

        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║    SM-2 REVISION ENGINE STATUS           ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Total questions: " << questions.size() << "\n"
             << "║ Due today:       " << due.size() << "\n"
             << "║ Overdue:         " << overdue.size() << "\n"
             << "╠══════════════════════════════════════════╣\n";

        if (!due.empty()) {
            cout << "║ DUE TODAY:\n";
            for (const auto& q : due)
                cout << "║   • " << q.name << " [" << difficultyToString(q.difficulty)
                     << "] EF:" << q.easeFactor << "\n";
        }
        if (!overdue.empty()) {
            cout << "║ OVERDUE:\n";
            for (const auto& q : overdue)
                cout << "║   ⚠ " << q.name << " (due: " << q.nextRevisionDate << ")\n";
        }
        cout << "╚══════════════════════════════════════════╝\n";
    }
};

} // namespace dsa

#endif // REVISION_ENGINE_H
