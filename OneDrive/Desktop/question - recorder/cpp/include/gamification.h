/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Gamification System
   
   XP, Levelling, Streaks, Milestones, Badges
   Formula: XP for level L = 100 × L^1.5
   ═══════════════════════════════════════════════════════════════════ */

#ifndef GAMIFICATION_H
#define GAMIFICATION_H

#include "dsa_core.h"
#include <unordered_map>
#include <cmath>

using namespace std;

namespace dsa {

// ── Badge Definitions ──

struct Badge {
    string id;
    string name;
    string description;
    string icon;
    bool   unlocked;

    Badge() : unlocked(false) {}
    Badge(const string& i, const string& n, const string& d, const string& ic)
        : id(i), name(n), description(d), icon(ic), unlocked(false) {}
};

// ── Streak Milestones ──

struct StreakMilestone {
    int    days;
    string name;
    int    bonusXP;

    StreakMilestone() : days(0), bonusXP(0) {}
    StreakMilestone(int d, const string& n, int xp) : days(d), name(n), bonusXP(xp) {}
};

// ── Player Profile ──

struct PlayerProfile {
    int    totalXP;
    int    level;
    int    currentStreak;
    int    longestStreak;
    string lastActiveDate;
    int    questionsToday;
    int    totalQuestionsSolved;
    int    totalRevisionsDone;
    vector<Badge>  badges;

    PlayerProfile()
        : totalXP(0), level(1), currentStreak(0), longestStreak(0),
          questionsToday(0), totalQuestionsSolved(0), totalRevisionsDone(0) {}
};

class Gamification {
private:
    PlayerProfile profile_;

    vector<StreakMilestone> milestones_ = {
        {7,   "Week Warrior",       50},
        {14,  "Fortnight Fighter",  120},
        {30,  "Monthly Master",     300},
        {60,  "Two-Month Titan",    700},
        {100, "Century Champion",   1500}
    };

    void initBadges() {
        profile_.badges = {
            {"first_solve",   "First Blood",      "Solve your first question",        "🗡"},
            {"ten_solved",    "Getting Serious",   "Solve 10 questions",               "⚔"},
            {"fifty_solved",  "Half Century",      "Solve 50 questions",               "🏆"},
            {"hundred_solved","Centurion",         "Solve 100 questions",              "👑"},
            {"streak_7",      "Week Warrior",      "Maintain a 7-day streak",          "🔥"},
            {"streak_30",     "Monthly Master",    "Maintain a 30-day streak",         "💎"},
            {"first_master",  "Topic Master",      "Master your first question",       "⭐"},
            {"ten_master",    "Knowledge King",    "Master 10 questions",              "🌟"},
            {"hard_solver",   "Hard Hitter",       "Solve 10 hard questions",          "💪"},
            {"speed_demon",   "Speed Demon",       "Complete revision under 30 sec",   "⚡"},
            {"lv5",           "Level 5",           "Reach level 5",                    "📈"},
            {"lv10",          "Level 10",          "Reach level 10",                   "🚀"},
            {"lv25",          "Level 25",          "Reach level 25",                   "🏅"},
            {"all_topics",    "Well Rounded",      "Solve in 5+ different topics",     "🎯"}
        };
    }

public:
    Gamification() { initBadges(); }
    explicit Gamification(const PlayerProfile& p) : profile_(p) {
        if (profile_.badges.empty()) initBadges();
    }

    // ── XP → Level conversion: XP needed = 100 × level^1.5 ──

    static int xpForLevel(int level) {
        return static_cast<int>(100.0 * pow(level, 1.5));
    }

    static int getLevelFromXP(int totalXP) {
        int level = 1;
        int accumulated = 0;
        while (true) {
            int needed = xpForLevel(level);
            if (accumulated + needed > totalXP) break;
            accumulated += needed;
            level++;
        }
        return level;
    }

    static int xpToNextLevel(int totalXP) {
        int level = getLevelFromXP(totalXP);
        int accumulated = 0;
        for (int i = 1; i < level; ++i) accumulated += xpForLevel(i);
        return xpForLevel(level) - (totalXP - accumulated);
    }

    static double levelProgress(int totalXP) {
        int level = getLevelFromXP(totalXP);
        int accumulated = 0;
        for (int i = 1; i < level; ++i) accumulated += xpForLevel(i);
        int xpInLevel = totalXP - accumulated;
        int needed = xpForLevel(level);
        return static_cast<double>(xpInLevel) / needed * 100.0;
    }

    // ── Award XP ──

    void awardXP(int amount) {
        int oldLevel = profile_.level;
        profile_.totalXP += amount;
        profile_.level = getLevelFromXP(profile_.totalXP);

        if (profile_.level > oldLevel) {
            cout << "  🎉 LEVEL UP! Level " << oldLevel << " → " << profile_.level << "!\n";
            checkBadges();
        }
    }

    // ── Streak System ──

    void updateStreak(const string& today) {
        if (profile_.lastActiveDate.empty()) {
            profile_.currentStreak = 1;
        } else if (profile_.lastActiveDate == today) {
            // already active today, do nothing
            return;
        } else {
            string yesterday = addDaysToDate(today, -1);
            if (profile_.lastActiveDate == yesterday) {
                profile_.currentStreak++;
            } else {
                // streak broken
                cout << "  ❌ Streak broken! Was " << profile_.currentStreak << " days.\n";
                profile_.currentStreak = 1;
            }
        }

        profile_.lastActiveDate = today;
        if (profile_.currentStreak > profile_.longestStreak)
            profile_.longestStreak = profile_.currentStreak;

        // check milestones
        for (const auto& ms : milestones_) {
            if (profile_.currentStreak == ms.days) {
                cout << "  🏅 STREAK MILESTONE: " << ms.name
                     << " (" << ms.days << " days)! +"
                     << ms.bonusXP << " XP!\n";
                awardXP(ms.bonusXP);
            }
        }
    }

    int getStreakBonus() const {
        if (profile_.currentStreak >= 30) return 50;
        if (profile_.currentStreak >= 14) return 30;
        if (profile_.currentStreak >= 7)  return 15;
        if (profile_.currentStreak >= 3)  return 5;
        return 0;
    }

    // ── Badge Checks ──

    void checkBadges() {
        auto unlock = [&](const string& id) {
            for (auto& b : profile_.badges) {
                if (b.id == id && !b.unlocked) {
                    b.unlocked = true;
                    cout << "  🏆 BADGE UNLOCKED: " << b.icon
                         << " " << b.name << " — " << b.description << "\n";
                    awardXP(25);
                }
            }
        };

        int solved = profile_.totalQuestionsSolved;
        if (solved >= 1)   unlock("first_solve");
        if (solved >= 10)  unlock("ten_solved");
        if (solved >= 50)  unlock("fifty_solved");
        if (solved >= 100) unlock("hundred_solved");

        if (profile_.currentStreak >= 7)  unlock("streak_7");
        if (profile_.currentStreak >= 30) unlock("streak_30");

        if (profile_.level >= 5)  unlock("lv5");
        if (profile_.level >= 10) unlock("lv10");
        if (profile_.level >= 25) unlock("lv25");
    }

    void onQuestionSolved(const Question& q) {
        profile_.totalQuestionsSolved++;
        profile_.questionsToday++;
        updateStreak(todayStr());

        // base award
        int xp = 15;
        if (q.difficulty == Difficulty::MEDIUM) xp = 25;
        if (q.difficulty == Difficulty::HARD)   xp = 40;

        // streak bonus
        xp += getStreakBonus();

        awardXP(xp);
        checkBadges();
        cout << "  ✅ +" << xp << " XP for solving \"" << q.name << "\"\n";
    }

    void onRevisionComplete(const Question& q, int quality) {
        profile_.totalRevisionsDone++;
        int xp = RevisionEngine::calculateRevisionXP(q, quality, 0);
        xp += getStreakBonus();
        awardXP(xp);
        checkBadges();
    }

    void unlockCustomBadge(const string& id) {
        for (auto& b : profile_.badges)
            if (b.id == id && !b.unlocked) {
                b.unlocked = true;
                cout << "  🏆 BADGE: " << b.icon << " " << b.name << "\n";
                awardXP(25);
            }
    }

    // ── Accessors ──

    const PlayerProfile& getProfile() const { return profile_; }
    int  getLevel()         const { return profile_.level; }
    int  getTotalXP()       const { return profile_.totalXP; }
    int  getCurrentStreak() const { return profile_.currentStreak; }
    int  getLongestStreak()  const { return profile_.longestStreak; }

    vector<Badge> getUnlockedBadges() const {
        vector<Badge> out;
        for (const auto& b : profile_.badges)
            if (b.unlocked) out.push_back(b);
        return out;
    }

    // ── Display ──

    void printProfile() const {
        double prog = levelProgress(profile_.totalXP);
        int toNext   = xpToNextLevel(profile_.totalXP);

        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║      PLAYER PROFILE & GAMIFICATION       ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Level: " << profile_.level
             << "  |  Total XP: " << profile_.totalXP << "\n"
             << "║ Progress: " << fixed << setprecision(1) << prog
             << "% (" << toNext << " XP to next level)\n"
             << "║ Streak: " << profile_.currentStreak
             << " days (Best: " << profile_.longestStreak << ")\n"
             << "║ Solved: " << profile_.totalQuestionsSolved
             << "  |  Revisions: " << profile_.totalRevisionsDone << "\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ BADGES:\n";

        for (const auto& b : profile_.badges)
            cout << "║   " << (b.unlocked ? b.icon : "🔒")
                 << " " << b.name
                 << (b.unlocked ? " ✓" : "") << "\n";

        cout << "╠══════════════════════════════════════════╣\n"
             << "║ MILESTONES:\n";
        for (const auto& ms : milestones_)
            cout << "║   " << (profile_.currentStreak >= ms.days ? "✅" : "⬜")
                 << " " << ms.name << " (" << ms.days << " days) +"
                 << ms.bonusXP << " XP\n";

        cout << "╚══════════════════════════════════════════╝\n";
    }
};

} // namespace dsa

#endif // GAMIFICATION_H
