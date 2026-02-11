/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Main Driver Program
   
   Demonstrates all DSA backends:
   1. Hash Map    — O(1) question storage & lookup
   2. Min-Heap    — Revision priority scheduling
   3. Trie        — Search & autocomplete
   4. DAG         — Topic dependency graph
   5. Sorting     — 5 sorting algorithms
   6. SM-2 Engine — Spaced repetition backend
   7. Gamification — XP, levels, streaks, badges
   8. Analytics   — Full statistics engine
   ═══════════════════════════════════════════════════════════════════ */

#include <iostream>
#include "dsa_core.h"
#include "question_hashmap.h"
#include "revision_heap.h"
#include "question_trie.h"
#include "topic_graph.h"
#include "sorting_engine.h"
#include "revision_engine.h"
#include "gamification.h"
#include "analytics_engine.h"

using namespace std;
using namespace dsa;

// ═════════════════════════════════════════════════════════════════
//  Sample Data — 12 DSA questions across multiple topics
// ═════════════════════════════════════════════════════════════════

vector<Question> createSampleQuestions() {
    vector<Question> qs;

    auto make = [](const string& id, const string& name, const string& subject,
                   Difficulty diff, QuestionStatus status, double ef, int cycle,
                   int streak, int xp, const string& solved,
                   const string& nextRev, const string& lastRev,
                   const vector<string>& tags) -> Question {
        Question q;
        q.id = id; q.name = name; q.subject = subject;
        q.difficulty = diff; q.status = status;
        q.easeFactor = ef; q.revisionCycle = cycle;
        q.streak = streak; q.xpEarned = xp;
        q.dateSolved = solved;
        q.nextRevisionDate = nextRev;
        q.lastRevisionDate = lastRev;
        q.tags = tags; q.platform = "LeetCode";
        return q;
    };

    qs.push_back(make("q1", "Two Sum", "Arrays",
        Difficulty::EASY, QuestionStatus::MASTERED, 2.8, 5, 5, 120,
        "2025-01-01", "", "2025-06-01", {"hash-map", "brute-force"}));

    qs.push_back(make("q2", "Longest Substring Without Repeating", "Sliding Window",
        Difficulty::MEDIUM, QuestionStatus::SOLVED, 2.3, 3, 3, 80,
        "2025-02-10", "2025-07-15", "2025-06-25", {"sliding-window", "hash-set"}));

    qs.push_back(make("q3", "Merge Intervals", "Arrays",
        Difficulty::MEDIUM, QuestionStatus::NEEDS_REVISION, 1.8, 2, 0, 40,
        "2025-03-05", "2025-07-01", "2025-06-10", {"sorting", "intervals"}));

    qs.push_back(make("q4", "Binary Tree Level Order Traversal", "Trees",
        Difficulty::MEDIUM, QuestionStatus::SOLVED, 2.5, 3, 3, 75,
        "2025-02-20", "2025-07-20", "2025-06-30", {"bfs", "tree"}));

    qs.push_back(make("q5", "LRU Cache", "Design",
        Difficulty::HARD, QuestionStatus::NEEDS_REVISION, 1.6, 1, 0, 35,
        "2025-04-15", "2025-07-05", "2025-06-20", {"linked-list", "hash-map"}));

    qs.push_back(make("q6", "Dijkstra Shortest Path", "Graphs",
        Difficulty::HARD, QuestionStatus::SOLVED, 2.1, 2, 2, 90,
        "2025-03-20", "2025-07-25", "2025-07-01", {"graph", "priority-queue"}));

    qs.push_back(make("q7", "Valid Parentheses", "Stack",
        Difficulty::EASY, QuestionStatus::MASTERED, 2.9, 6, 6, 100,
        "2025-01-10", "", "2025-05-15", {"stack", "string"}));

    qs.push_back(make("q8", "Coin Change", "Dynamic Programming",
        Difficulty::MEDIUM, QuestionStatus::SOLVED, 2.2, 2, 2, 55,
        "2025-04-01", "2025-07-18", "2025-07-01", {"dp", "bottom-up"}));

    qs.push_back(make("q9", "Kth Largest Element", "Heaps",
        Difficulty::MEDIUM, QuestionStatus::SOLVED, 2.4, 3, 3, 70,
        "2025-03-15", "2025-07-22", "2025-07-05", {"heap", "quickselect"}));

    qs.push_back(make("q10", "Word Search II", "Backtracking",
        Difficulty::HARD, QuestionStatus::UNSOLVED, 2.5, 0, 0, 0,
        "", "", "", {"trie", "backtracking", "dfs"}));

    qs.push_back(make("q11", "Implement Trie", "Trie",
        Difficulty::MEDIUM, QuestionStatus::SOLVED, 2.6, 4, 4, 85,
        "2025-02-01", "2025-08-01", "2025-07-01", {"trie", "design"}));

    qs.push_back(make("q12", "Course Schedule", "Graphs",
        Difficulty::MEDIUM, QuestionStatus::NEEDS_REVISION, 1.9, 1, 0, 30,
        "2025-05-01", "2025-07-08", "2025-06-28", {"topological-sort", "dfs"}));

    return qs;
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 1 — Hash Map: O(1) Storage & Retrieval
// ═════════════════════════════════════════════════════════════════

void demoHashMap(const vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 1: HASH MAP — O(1) Question Storage           ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    QuestionHashMap map;
    for (const auto& q : questions)
        map.put(q.id, q);

    map.printStats();

    // lookup
    auto result = map.get("q5");
    if (result.first)
        cout << "\n  ✅ O(1) lookup for 'q5': " << result.second.name << "\n";

    // filter by difficulty
    auto hards = map.getByDifficulty(Difficulty::HARD);
    cout << "  Hard questions (" << hards.size() << "): ";
    for (const auto& q : hards) cout << q.name << ", ";
    cout << "\n";

    // filter by status
    auto needsRev = map.getByStatus(QuestionStatus::NEEDS_REVISION);
    cout << "  Needs revision (" << needsRev.size() << "): ";
    for (const auto& q : needsRev) cout << q.name << ", ";
    cout << "\n";

    // custom filter
    auto highXP = map.filter([](const Question& q) { return q.xpEarned > 70; });
    cout << "  XP > 70 (" << highXP.size() << "): ";
    for (const auto& q : highXP) cout << q.name << " (" << q.xpEarned << " XP), ";
    cout << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 2 — Min-Heap: Revision Priority Queue
// ═════════════════════════════════════════════════════════════════

void demoHeap(const vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 2: MIN-HEAP — Revision Priority Queue         ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    string today = todayStr();
    RevisionHeap heap(questions, today);
    heap.print();

    cout << "\n  Top-3 most urgent revisions:\n";
    auto top3 = heap.topK(3);
    for (int i = 0; i < static_cast<int>(top3.size()); ++i)
        cout << "    " << (i + 1) << ". " << top3[i].question.name
             << " (score: " << fixed << setprecision(2) << top3[i].priorityScore << ")\n";

    cout << "  Heap valid: " << (heap.isValidHeap() ? "YES" : "NO") << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 3 — Trie: Search & Autocomplete
// ═════════════════════════════════════════════════════════════════

void demoTrie(const vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 3: TRIE — Search & Autocomplete               ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    QuestionTrie trie;
    for (const auto& q : questions)
        trie.insertQuestion(q);

    trie.printStats();

    // exact search
    cout << "\n  Search 'two sum': " << (trie.search("two sum") ? "FOUND" : "NOT FOUND") << "\n";
    cout << "  Search 'xyz': "     << (trie.search("xyz") ? "FOUND" : "NOT FOUND") << "\n";

    // prefix
    cout << "  Starts with 'bin': " << (trie.startsWith("bin") ? "YES" : "NO") << "\n";
    cout << "  Count 'co*': "      << trie.countWithPrefix("co") << " words\n";

    // autocomplete
    auto sugg = trie.autocomplete("mer", 5);
    cout << "  Autocomplete 'mer': ";
    for (const auto& s : sugg) cout << s << ", ";
    cout << "\n";

    // fuzzy search
    auto fuzzy = trie.fuzzySearch("dijstra", 2);
    cout << "  Fuzzy 'dijstra': ";
    for (const auto& f : fuzzy)
        cout << f.first << " (dist: " << f.second << "), ";
    cout << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 4 — Graph: Topic Dependency DAG
// ═════════════════════════════════════════════════════════════════

void demoGraph() {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 4: DAG — Topic Dependency Graph               ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    auto graph = TopicGraph::createStandardDSAGraph();
    graph.print();

    // topological order
    auto topoOrder = graph.topologicalSortKahn();
    cout << "\n  Topological Order (Kahn's BFS):\n    ";
    for (int i = 0; i < static_cast<int>(topoOrder.size()); ++i)
        cout << topoOrder[i] << (i + 1 < static_cast<int>(topoOrder.size()) ? " → " : "");
    cout << "\n";

    // BFS levels
    auto levels = graph.bfs("Arrays");
    cout << "\n  BFS from Arrays:\n";
    for (int lv = 0; lv < static_cast<int>(levels.size()); ++lv) {
        cout << "    Level " << lv << ": ";
        for (const auto& t : levels[lv]) cout << t << ", ";
        cout << "\n";
    }

    // prerequisites
    auto prereqs = graph.getPrerequisites("Dynamic Programming");
    cout << "\n  Prerequisites for DP: ";
    for (const auto& p : prereqs) cout << p << ", ";
    cout << "\n";

    // shortest path
    int dist = graph.shortestPath("Arrays", "Dynamic Programming");
    cout << "  Shortest path Arrays → DP: " << dist << " edges\n";

    // starting topics
    auto starts = graph.getStartingTopics();
    cout << "  Starting topics (no prereqs): ";
    for (const auto& s : starts) cout << s << ", ";
    cout << "\n";

    cout << "  Most critical topic: " << graph.getMostCriticalTopic() << "\n";
    cout << "  Has cycle: " << (graph.hasCycle() ? "YES" : "NO") << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 5 — Sorting Algorithms
// ═════════════════════════════════════════════════════════════════

void demoSorting(vector<Question> questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 5: SORTING — 5 Algorithms Compared            ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    // merge sort by name
    auto byName = questions;
    SortingEngine::mergeSort(byName, comparators::byName);
    SortingEngine::printSorted(byName, "Name (Merge Sort)");

    // quick sort by difficulty desc
    auto byDiff = questions;
    SortingEngine::quickSort(byDiff, comparators::byDifficultyDesc);
    SortingEngine::printSorted(byDiff, "Difficulty Desc (Quick Sort)");

    // counting sort by difficulty
    auto byCounting = questions;
    SortingEngine::countingSortByDifficulty(byCounting);
    SortingEngine::printSorted(byCounting, "Difficulty (Counting Sort)");

    // heap sort by XP
    auto byXP = questions;
    SortingEngine::heapSort(byXP, comparators::byXP);
    SortingEngine::printSorted(byXP, "XP Desc (Heap Sort)");

    // smart sort by ease factor
    auto byEF = questions;
    SortingEngine::smartSort(byEF, comparators::byEaseFactor);
    SortingEngine::printSorted(byEF, "Ease Factor (Smart Sort)");
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 6 — SM-2 Spaced Repetition Engine
// ═════════════════════════════════════════════════════════════════

void demoRevisionEngine(vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 6: SM-2 — Spaced Repetition Engine            ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    RevisionEngine engine;
    engine.printStatus(questions);

    // simulate a revision on question 3 (Merge Intervals)
    cout << "\n  Simulating revision on '" << questions[2].name << "'...\n";
    cout << "    Before: EF=" << questions[2].easeFactor
         << " Cycle=" << questions[2].revisionCycle
         << " Status=" << statusToString(questions[2].status) << "\n";

    auto result = RevisionEngine::completeRevision(questions[2], 4, 45);

    cout << "    After:  EF=" << result.newEaseFactor
         << " Cycle=" << result.newCycle
         << " Status=" << statusToString(result.newStatus) << "\n"
         << "    Next revision: " << result.nextDate << "\n"
         << "    XP awarded: " << result.xpAwarded << "\n"
         << "    Was reset: " << (result.wasReset ? "YES" : "NO") << "\n";

    // simulate a failed revision on question 5
    cout << "\n  Simulating FAILED revision on '" << questions[4].name << "'...\n";
    auto failResult = RevisionEngine::completeRevision(questions[4], 1, 200);
    cout << "    EF=" << failResult.newEaseFactor
         << " Cycle=" << failResult.newCycle
         << " Reset: " << (failResult.wasReset ? "YES — cycle restarted" : "NO") << "\n";

    // suggestions
    cout << "\n  Suggestions:\n";
    for (const auto& q : questions)
        cout << "    " << q.name << ": " << RevisionEngine::suggestAction(q) << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 7 — Gamification: XP, Levels, Streaks, Badges
// ═════════════════════════════════════════════════════════════════

void demoGamification(vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 7: GAMIFICATION — XP, Levels, Badges          ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    Gamification gm;

    // simulate solving several questions
    for (auto& q : questions) {
        if (q.status == QuestionStatus::SOLVED || q.status == QuestionStatus::MASTERED)
            gm.onQuestionSolved(q);
    }

    // simulate some revisions
    gm.onRevisionComplete(questions[1], 4);
    gm.onRevisionComplete(questions[3], 5);
    gm.onRevisionComplete(questions[7], 3);

    // level system demo
    cout << "\n  Level System:\n";
    for (int lv = 1; lv <= 10; ++lv)
        cout << "    Level " << lv << ": " << Gamification::xpForLevel(lv) << " XP needed\n";

    gm.printProfile();
}

// ═════════════════════════════════════════════════════════════════
//  DEMO 8 — Analytics Engine
// ═════════════════════════════════════════════════════════════════

void demoAnalytics(const vector<Question>& questions) {
    cout << "\n\n"
         << "╔══════════════════════════════════════════════════════════╗\n"
         << "║     DEMO 8: ANALYTICS — Full Statistics Engine          ║\n"
         << "╚══════════════════════════════════════════════════════════╝\n";

    AnalyticsEngine::printAnalytics(questions);

    // weakest / strongest
    auto weak   = AnalyticsEngine::getWeakestTopics(questions);
    auto strong = AnalyticsEngine::getStrongestTopics(questions);

    cout << "\n  Weakest topics: ";
    for (const auto& t : weak) cout << t << ", ";
    cout << "\n  Strongest topics: ";
    for (const auto& t : strong) cout << t << ", ";
    cout << "\n";
}

// ═════════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═════════════════════════════════════════════════════════════════

int main() {
    cout << "═══════════════════════════════════════════════════════════\n"
         << "  DSA QUESTION TRACKER — C++ Backend Engine\n"
         << "  All backend logic powered by custom DSA implementations\n"
         << "  JS is used ONLY for localStorage / database layer\n"
         << "═══════════════════════════════════════════════════════════\n";

    auto questions = createSampleQuestions();

    demoHashMap(questions);
    demoHeap(questions);
    demoTrie(questions);
    demoGraph();
    demoSorting(questions);
    demoRevisionEngine(questions);
    demoGamification(questions);
    demoAnalytics(questions);

    cout << "\n\n═══════════════════════════════════════════════════════════\n"
         << "  ALL 8 DEMOS COMPLETED SUCCESSFULLY\n"
         << "  Data Structures: HashMap, MinHeap, Trie, DAG\n"
         << "  Algorithms: SM-2, 5 sorts, BFS, DFS, Topo Sort\n"
         << "  Backend: Revision Engine, Gamification, Analytics\n"
         << "═══════════════════════════════════════════════════════════\n";

    return 0;
}
