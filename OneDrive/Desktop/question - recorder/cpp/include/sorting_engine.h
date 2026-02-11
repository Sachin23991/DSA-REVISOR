/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Sorting Algorithms Engine
   
   Merge Sort (stable), Quick Sort (randomized), Counting Sort,
   Insertion Sort (adaptive), Heap Sort, Smart Sort (auto-select)
   ═══════════════════════════════════════════════════════════════════ */

#ifndef SORTING_ENGINE_H
#define SORTING_ENGINE_H

#include "dsa_core.h"
#include <random>

using namespace std;

namespace dsa {

// ── Pre-defined Comparators ──

namespace comparators {
    inline bool byName(const Question& a, const Question& b) {
        return a.name < b.name;
    }
    inline bool byDifficulty(const Question& a, const Question& b) {
        return static_cast<int>(a.difficulty) < static_cast<int>(b.difficulty);
    }
    inline bool byDifficultyDesc(const Question& a, const Question& b) {
        return static_cast<int>(a.difficulty) > static_cast<int>(b.difficulty);
    }
    inline bool byRevisionDate(const Question& a, const Question& b) {
        if (a.nextRevisionDate.empty()) return false;
        if (b.nextRevisionDate.empty()) return true;
        return a.nextRevisionDate < b.nextRevisionDate;
    }
    inline bool byXP(const Question& a, const Question& b) {
        return a.xpEarned > b.xpEarned;
    }
    inline bool byEaseFactor(const Question& a, const Question& b) {
        return a.easeFactor < b.easeFactor;
    }
    inline bool byCycle(const Question& a, const Question& b) {
        return a.revisionCycle < b.revisionCycle;
    }
    inline bool byDateSolved(const Question& a, const Question& b) {
        return a.dateSolved > b.dateSolved;
    }
    inline bool bySubjectThenDifficulty(const Question& a, const Question& b) {
        if (a.subject != b.subject) return a.subject < b.subject;
        return static_cast<int>(a.difficulty) < static_cast<int>(b.difficulty);
    }
}

class SortingEngine {
public:
    using Comparator = function<bool(const Question&, const Question&)>;

    // ═══════ 1. MERGE SORT — Stable, O(n log n) ═══════

    static void mergeSort(vector<Question>& arr, Comparator comp) {
        if (arr.size() <= 1) return;
        mergeSortHelper(arr, 0, static_cast<int>(arr.size()) - 1, comp);
    }

private:
    static void mergeSortHelper(vector<Question>& arr, int l, int r, Comparator& comp) {
        if (l >= r) return;
        int m = l + (r - l) / 2;
        mergeSortHelper(arr, l, m, comp);
        mergeSortHelper(arr, m + 1, r, comp);
        doMerge(arr, l, m, r, comp);
    }

    static void doMerge(vector<Question>& arr, int l, int m, int r, Comparator& comp) {
        vector<Question> left(arr.begin() + l, arr.begin() + m + 1);
        vector<Question> right(arr.begin() + m + 1, arr.begin() + r + 1);
        int i = 0, j = 0, k = l;
        while (i < static_cast<int>(left.size()) && j < static_cast<int>(right.size())) {
            if (comp(left[i], right[j]) || !comp(right[j], left[i]))
                arr[k++] = left[i++];
            else
                arr[k++] = right[j++];
        }
        while (i < static_cast<int>(left.size()))  arr[k++] = left[i++];
        while (j < static_cast<int>(right.size())) arr[k++] = right[j++];
    }

public:
    // ═══════ 2. QUICK SORT — Randomized, O(n log n) avg ═══════

    static void quickSort(vector<Question>& arr, Comparator comp) {
        if (arr.size() <= 1) return;
        quickSortHelper(arr, 0, static_cast<int>(arr.size()) - 1, comp);
    }

private:
    static void quickSortHelper(vector<Question>& arr, int lo, int hi, Comparator& comp) {
        if (lo >= hi) return;
        if (hi - lo < 10) { insertRange(arr, lo, hi, comp); return; }
        int p = partition(arr, lo, hi, comp);
        quickSortHelper(arr, lo, p - 1, comp);
        quickSortHelper(arr, p + 1, hi, comp);
    }

    static int partition(vector<Question>& arr, int lo, int hi, Comparator& comp) {
        static mt19937 rng(42);
        int pi = uniform_int_distribution<int>(lo, hi)(rng);
        swap(arr[pi], arr[hi]);
        int i = lo - 1;
        for (int j = lo; j < hi; ++j)
            if (comp(arr[j], arr[hi])) swap(arr[++i], arr[j]);
        swap(arr[i + 1], arr[hi]);
        return i + 1;
    }

    static void insertRange(vector<Question>& arr, int lo, int hi, Comparator& comp) {
        for (int i = lo + 1; i <= hi; ++i) {
            Question key = arr[i];
            int j = i - 1;
            while (j >= lo && comp(key, arr[j])) { arr[j + 1] = arr[j]; --j; }
            arr[j + 1] = key;
        }
    }

public:
    // ═══════ 3. COUNTING SORT — O(n + k) by difficulty ═══════

    static void countingSortByDifficulty(vector<Question>& arr) {
        const int K = 3;
        vector<int> count(K, 0);
        for (const auto& q : arr) count[static_cast<int>(q.difficulty)]++;
        for (int i = 1; i < K; ++i) count[i] += count[i - 1];

        vector<Question> out(arr.size());
        for (int i = static_cast<int>(arr.size()) - 1; i >= 0; --i) {
            int idx = static_cast<int>(arr[i].difficulty);
            out[count[idx] - 1] = arr[i];
            count[idx]--;
        }
        arr = move(out);
    }

    // ═══════ 4. INSERTION SORT — O(n²), adaptive ═══════

    static void insertionSort(vector<Question>& arr, Comparator comp) {
        for (int i = 1; i < static_cast<int>(arr.size()); ++i) {
            Question key = arr[i];
            int j = i - 1;
            while (j >= 0 && comp(key, arr[j])) { arr[j + 1] = arr[j]; --j; }
            arr[j + 1] = key;
        }
    }

    // ═══════ 5. HEAP SORT — O(n log n), in-place ═══════

    static void heapSort(vector<Question>& arr, Comparator comp) {
        int n = static_cast<int>(arr.size());
        if (n <= 1) return;
        for (int i = n / 2 - 1; i >= 0; --i) heapify(arr, n, i, comp);
        for (int i = n - 1; i > 0; --i) { swap(arr[0], arr[i]); heapify(arr, i, 0, comp); }
    }

private:
    static void heapify(vector<Question>& arr, int sz, int root, Comparator& comp) {
        int largest = root, l = 2 * root + 1, r = 2 * root + 2;
        if (l < sz && comp(arr[largest], arr[l])) largest = l;
        if (r < sz && comp(arr[largest], arr[r])) largest = r;
        if (largest != root) { swap(arr[root], arr[largest]); heapify(arr, sz, largest, comp); }
    }

public:
    // ═══════ SMART SORT — auto-selects algorithm ═══════

    static void smartSort(vector<Question>& arr, Comparator comp, bool stable = false) {
        int n = static_cast<int>(arr.size());
        if (n <= 1) return;
        if (n <= 16)   insertionSort(arr, comp);
        else if (stable) mergeSort(arr, comp);
        else             quickSort(arr, comp);
    }

    static void printSorted(const vector<Question>& arr, const string& sortBy) {
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║  SORTED QUESTIONS (by " << sortBy << ")\n"
             << "╠══════════════════════════════════════════╣\n";
        for (int i = 0; i < static_cast<int>(arr.size()); ++i)
            cout << "║ " << (i + 1) << ". " << arr[i].name
                 << " [" << difficultyToString(arr[i].difficulty) << "]"
                 << " EF:" << arr[i].easeFactor
                 << " XP:" << arr[i].xpEarned << "\n";
        cout << "╚══════════════════════════════════════════╝\n";
    }
};

} // namespace dsa

#endif // SORTING_ENGINE_H
