/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Core Data Structures & Type Definitions
   ═══════════════════════════════════════════════════════════════════ */

#ifndef DSA_CORE_H
#define DSA_CORE_H

#include <string>
#include <vector>
#include <ctime>
#include <iostream>
#include <sstream>
#include <algorithm>
#include <functional>
#include <iomanip>
#include <cmath>

using namespace std;

namespace dsa {

// ── Enums ──

enum class Difficulty { EASY, MEDIUM, HARD };

enum class QuestionStatus { UNSOLVED, SOLVED, NEEDS_REVISION, MASTERED };

inline string difficultyToString(Difficulty d) {
    switch (d) {
        case Difficulty::EASY:   return "Easy";
        case Difficulty::MEDIUM: return "Medium";
        case Difficulty::HARD:   return "Hard";
        default:                 return "Unknown";
    }
}

inline string statusToString(QuestionStatus s) {
    switch (s) {
        case QuestionStatus::UNSOLVED:       return "Unsolved";
        case QuestionStatus::SOLVED:         return "Solved";
        case QuestionStatus::NEEDS_REVISION: return "Needs Revision";
        case QuestionStatus::MASTERED:       return "Mastered";
        default:                             return "Unknown";
    }
}

// ── Core Structures ──

struct Question {
    string id;
    string name;
    string subject;
    string platform;
    Difficulty difficulty;
    QuestionStatus status;

    double easeFactor;
    int revisionCycle;
    int streak;
    int xpEarned;

    string dateSolved;
    string nextRevisionDate;
    string lastRevisionDate;

    vector<string> tags;
    string notes;

    Question()
        : difficulty(Difficulty::MEDIUM),
          status(QuestionStatus::UNSOLVED),
          easeFactor(2.5), revisionCycle(0),
          streak(0), xpEarned(0) {}

    double getPriorityScore(const string& today) const {
        if (nextRevisionDate.empty() || status == QuestionStatus::MASTERED)
            return -1.0;

        int daysOverdue  = dateDiffDays(nextRevisionDate, today);
        double priority  = static_cast<double>(daysOverdue);
        double diffMult  = (difficulty == Difficulty::HARD)   ? 1.5
                         : (difficulty == Difficulty::MEDIUM) ? 1.2 : 1.0;
        double easePen   = (2.5 - easeFactor) * 2.0;
        double streakPen = (streak < 3) ? 1.5 : 1.0;

        return (priority * diffMult + easePen) * streakPen;
    }

    static int dateDiffDays(const string& fromDate, const string& toDate) {
        struct tm from = {}, to = {};
        istringstream issF(fromDate), issT(toDate);
        issF >> get_time(&from, "%Y-%m-%d");
        issT >> get_time(&to,   "%Y-%m-%d");
        time_t tF = mktime(&from), tT = mktime(&to);
        return static_cast<int>(difftime(tT, tF) / 86400);
    }

    void print() const {
        cout << "┌─────────────────────────────────────────\n"
             << "│ " << name << "\n"
             << "│ Subject: " << subject
             << " | Diff: " << difficultyToString(difficulty) << "\n"
             << "│ Status: " << statusToString(status)
             << " | Cycle: " << revisionCycle
             << " | EF: " << easeFactor << "\n"
             << "│ Next Rev: " << (nextRevisionDate.empty() ? "N/A" : nextRevisionDate) << "\n"
             << "│ XP: " << xpEarned << " | Streak: " << streak << "\n"
             << "└─────────────────────────────────────────\n";
    }
};

struct RevisionRecord {
    string date;
    int quality;
    int timeTaken;
    string notes;
    int cycle;

    RevisionRecord() : quality(3), timeTaken(0), cycle(0) {}
    RevisionRecord(const string& d, int q, int t, int c)
        : date(d), quality(q), timeTaken(t), cycle(c) {}
};

struct Topic {
    string name;
    int totalQuestions;
    int solvedQuestions;

    Topic() : totalQuestions(0), solvedQuestions(0) {}
    Topic(const string& n) : name(n), totalQuestions(0), solvedQuestions(0) {}

    double completionRate() const {
        return totalQuestions > 0
            ? static_cast<double>(solvedQuestions) / totalQuestions * 100.0
            : 0.0;
    }
};

struct Analytics {
    int totalQuestions, totalRevisions, totalXP;
    int currentStreak, longestStreak;
    double averageEaseFactor;
    int masteredCount, needsRevisionCount;
    vector<pair<string, int>> topicDistribution;
    vector<pair<string, int>> difficultyDistribution;

    Analytics()
        : totalQuestions(0), totalRevisions(0), totalXP(0),
          currentStreak(0), longestStreak(0), averageEaseFactor(2.5),
          masteredCount(0), needsRevisionCount(0) {}
};

// ── Utilities ──

inline string todayStr() {
    time_t now = time(nullptr);
    struct tm* t = localtime(&now);
    char buf[11];
    strftime(buf, sizeof(buf), "%Y-%m-%d", t);
    return string(buf);
}

inline string generateId() {
    static int counter = 0;
    time_t now = time(nullptr);
    ostringstream oss;
    oss << hex << now << "-" << ++counter;
    return oss.str();
}

inline string addDaysToDate(const string& dateStr, int days) {
    struct tm t = {};
    istringstream iss(dateStr);
    iss >> get_time(&t, "%Y-%m-%d");
    time_t base = mktime(&t);
    base += days * 86400;
    struct tm* r = localtime(&base);
    char buf[11];
    strftime(buf, sizeof(buf), "%Y-%m-%d", r);
    return string(buf);
}

} // namespace dsa

#endif // DSA_CORE_H
