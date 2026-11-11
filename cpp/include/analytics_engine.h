/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Analytics & Statistics Engine
   
   Computes topic distribution, difficulty breakdown, mastery rates,
   performance trends, and detailed per-topic metrics.
   ═══════════════════════════════════════════════════════════════════ */

#ifndef ANALYTICS_ENGINE_H
#define ANALYTICS_ENGINE_H

#include "dsa_core.h"
#include <unordered_map>
#include <cmath>
#include <numeric>

using namespace std;

namespace dsa {

struct TopicStats {
    string topic;
    int    total;
    int    solved;
    int    mastered;
    int    needsRevision;
    double avgEaseFactor;
    int    totalXP;

    TopicStats() : total(0), solved(0), mastered(0),
                   needsRevision(0), avgEaseFactor(0.0), totalXP(0) {}

    double masteryRate() const {
        return total > 0 ? static_cast<double>(mastered) / total * 100.0 : 0.0;
    }
    double completionRate() const {
        return total > 0 ? static_cast<double>(solved) / total * 100.0 : 0.0;
    }
};

struct DifficultyBreakdown {
    int easy, medium, hard;
    int easySolved, mediumSolved, hardSolved;

    DifficultyBreakdown()
        : easy(0), medium(0), hard(0),
          easySolved(0), mediumSolved(0), hardSolved(0) {}

    double easyRate()   const { return easy   > 0 ? static_cast<double>(easySolved)   / easy   * 100 : 0; }
    double mediumRate() const { return medium > 0 ? static_cast<double>(mediumSolved) / medium * 100 : 0; }
    double hardRate()   const { return hard   > 0 ? static_cast<double>(hardSolved)   / hard   * 100 : 0; }
};

class AnalyticsEngine {
public:

    // ── Full Analytics Computation ──

    static Analytics computeAnalytics(const vector<Question>& questions) {
        Analytics a;
        a.totalQuestions = static_cast<int>(questions.size());

        double efSum = 0.0;
        int efCount = 0;
        unordered_map<string, int> topicCount;
        unordered_map<string, int> diffCount;

        for (const auto& q : questions) {
            // topic distribution
            topicCount[q.subject]++;

            // difficulty distribution
            diffCount[difficultyToString(q.difficulty)]++;

            // ease factor average
            if (q.revisionCycle > 0) { efSum += q.easeFactor; efCount++; }

            // status counts
            if (q.status == QuestionStatus::MASTERED)       a.masteredCount++;
            if (q.status == QuestionStatus::NEEDS_REVISION) a.needsRevisionCount++;

            // totals
            a.totalXP += q.xpEarned;
            a.totalRevisions += q.revisionCycle;
        }

        a.averageEaseFactor = efCount > 0 ? efSum / efCount : 2.5;

        for (auto& kv : topicCount)
            a.topicDistribution.emplace_back(kv.first, kv.second);
        for (auto& kv : diffCount)
            a.difficultyDistribution.emplace_back(kv.first, kv.second);

        // sort by count descending
        sort(a.topicDistribution.begin(), a.topicDistribution.end(),
             [](const pair<string,int>& x, const pair<string,int>& y) {
                 return x.second > y.second;
             });
        sort(a.difficultyDistribution.begin(), a.difficultyDistribution.end(),
             [](const pair<string,int>& x, const pair<string,int>& y) {
                 return x.second > y.second;
             });

        return a;
    }

    // ── Per-Topic Statistics ──

    static vector<TopicStats> getTopicStats(const vector<Question>& questions) {
        unordered_map<string, TopicStats> map;
        unordered_map<string, int> revisedCounts;

        for (const auto& q : questions) {
            auto& ts = map[q.subject];
            ts.topic = q.subject;
            ts.total++;
            ts.totalXP += q.xpEarned;

            if (q.status == QuestionStatus::SOLVED || q.status == QuestionStatus::MASTERED)
                ts.solved++;
            if (q.status == QuestionStatus::MASTERED)
                ts.mastered++;
            if (q.status == QuestionStatus::NEEDS_REVISION)
                ts.needsRevision++;
            if (q.revisionCycle > 0) {
                ts.avgEaseFactor += q.easeFactor;
                revisedCounts[q.subject]++;
            }
        }

        vector<TopicStats> result;
        for (auto& kv : map) {
            auto& ts = kv.second;
            int revised = revisedCounts[kv.first];
            if (revised > 0)
                ts.avgEaseFactor /= revised;
            else
                ts.avgEaseFactor = 2.5;
            result.push_back(ts);
        }

        sort(result.begin(), result.end(),
             [](const TopicStats& a, const TopicStats& b) { return a.total > b.total; });
        return result;
    }

    // ── Difficulty Breakdown ──

    static DifficultyBreakdown getDifficultyBreakdown(const vector<Question>& questions) {
        DifficultyBreakdown db;
        for (const auto& q : questions) {
            bool solved = (q.status == QuestionStatus::SOLVED ||
                           q.status == QuestionStatus::MASTERED);
            switch (q.difficulty) {
                case Difficulty::EASY:
                    db.easy++;
                    if (solved) db.easySolved++;
                    break;
                case Difficulty::MEDIUM:
                    db.medium++;
                    if (solved) db.mediumSolved++;
                    break;
                case Difficulty::HARD:
                    db.hard++;
                    if (solved) db.hardSolved++;
                    break;
            }
        }
        return db;
    }

    // ── Weakest / Strongest Topics ──

    static vector<string> getWeakestTopics(const vector<Question>& questions, int topN = 3) {
        auto stats = getTopicStats(questions);
        sort(stats.begin(), stats.end(),
             [](const TopicStats& a, const TopicStats& b) {
                 return a.completionRate() < b.completionRate();
             });
        vector<string> weak;
        for (int i = 0; i < min(topN, static_cast<int>(stats.size())); ++i)
            weak.push_back(stats[i].topic);
        return weak;
    }

    static vector<string> getStrongestTopics(const vector<Question>& questions, int topN = 3) {
        auto stats = getTopicStats(questions);
        sort(stats.begin(), stats.end(),
             [](const TopicStats& a, const TopicStats& b) {
                 return a.masteryRate() > b.masteryRate();
             });
        vector<string> strong;
        for (int i = 0; i < min(topN, static_cast<int>(stats.size())); ++i)
            strong.push_back(stats[i].topic);
        return strong;
    }

    // ── Study Suggestion ──

    static string getStudySuggestion(const vector<Question>& questions) {
        if (questions.empty()) return "Start solving some questions!";

        auto weak   = getWeakestTopics(questions, 1);
        auto db     = getDifficultyBreakdown(questions);
        int  total  = static_cast<int>(questions.size());
        int  solved = 0, mastered = 0;
        for (const auto& q : questions) {
            if (q.status == QuestionStatus::SOLVED || q.status == QuestionStatus::MASTERED) solved++;
            if (q.status == QuestionStatus::MASTERED) mastered++;
        }

        double solveRate  = static_cast<double>(solved) / total * 100;
        double masterRate = static_cast<double>(mastered) / total * 100;

        ostringstream oss;
        if (solveRate < 30)
            oss << "Focus on solving more problems. Only " << fixed << setprecision(0)
                << solveRate << "% solved.";
        else if (masterRate < 10 && solved > 10)
            oss << "Start revising solved questions to build mastery.";
        else if (!weak.empty())
            oss << "Work on your weakest topic: " << weak[0] << ".";
        else if (db.hard == 0)
            oss << "Challenge yourself — try some Hard problems!";
        else
            oss << "Great progress! Keep revising and mastering topics.";

        return oss.str();
    }

    // ── Display ──

    static void printAnalytics(const vector<Question>& questions) {
        auto a  = computeAnalytics(questions);
        auto db = getDifficultyBreakdown(questions);
        auto ts = getTopicStats(questions);

        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║       ANALYTICS ENGINE — REPORT          ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Total Questions: " << a.totalQuestions << "\n"
             << "║ Mastered:        " << a.masteredCount << "\n"
             << "║ Needs Revision:  " << a.needsRevisionCount << "\n"
             << "║ Total XP:        " << a.totalXP << "\n"
             << "║ Avg Ease Factor: " << fixed << setprecision(2) << a.averageEaseFactor << "\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ DIFFICULTY BREAKDOWN:\n"
             << "║   Easy:   " << db.easy   << " (" << fixed << setprecision(0) << db.easyRate()   << "% solved)\n"
             << "║   Medium: " << db.medium << " (" << db.mediumRate() << "% solved)\n"
             << "║   Hard:   " << db.hard   << " (" << db.hardRate()   << "% solved)\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ TOPIC BREAKDOWN:\n";
        for (const auto& t : ts)
            cout << "║   " << t.topic << ": " << t.total
                 << " (" << fixed << setprecision(0) << t.completionRate()
                 << "% complete, " << t.masteryRate() << "% mastered)\n";

        cout << "╠══════════════════════════════════════════╣\n"
             << "║ 💡 " << getStudySuggestion(questions) << "\n"
             << "╚══════════════════════════════════════════╝\n";
    }
};

} // namespace dsa

#endif // ANALYTICS_ENGINE_H
