/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Min-Heap Priority Queue for Revision Scheduling
   
   Data Structure : Binary Min-Heap (array-based)
   
   Time:  Push / Pop → O(log n)   |   Peek → O(1)   |   Build → O(n)
   Space: O(n)
   ═══════════════════════════════════════════════════════════════════ */

#ifndef REVISION_HEAP_H
#define REVISION_HEAP_H

#include "dsa_core.h"
#include <vector>
#include <stdexcept>

using namespace std;

namespace dsa {

struct HeapEntry {
    Question question;
    double   priorityScore;   // lower = more urgent

    HeapEntry() : priorityScore(0.0) {}
    HeapEntry(const Question& q, double s) : question(q), priorityScore(s) {}

    bool operator>(const HeapEntry& o) const { return priorityScore > o.priorityScore; }
    bool operator<(const HeapEntry& o) const { return priorityScore < o.priorityScore; }
};

class RevisionHeap {
private:
    vector<HeapEntry> heap_;

    static int parent(int i)     { return (i - 1) / 2; }
    static int leftChild(int i)  { return 2 * i + 1; }
    static int rightChild(int i) { return 2 * i + 2; }

    // Bubble up — O(log n)
    void siftUp(int i) {
        while (i > 0) {
            int p = parent(i);
            if (heap_[i] < heap_[p]) { swap(heap_[i], heap_[p]); i = p; }
            else break;
        }
    }

    // Bubble down — O(log n)
    void siftDown(int i) {
        int n = static_cast<int>(heap_.size());
        while (true) {
            int smallest = i;
            int l = leftChild(i), r = rightChild(i);
            if (l < n && heap_[l] < heap_[smallest]) smallest = l;
            if (r < n && heap_[r] < heap_[smallest]) smallest = r;
            if (smallest != i) { swap(heap_[i], heap_[smallest]); i = smallest; }
            else break;
        }
    }

public:
    RevisionHeap() = default;

    // Floyd's build-heap — O(n)
    RevisionHeap(const vector<Question>& questions, const string& today) {
        heap_.reserve(questions.size());
        for (const auto& q : questions) {
            if (q.status == QuestionStatus::MASTERED || q.nextRevisionDate.empty())
                continue;
            double score = q.getPriorityScore(today);
            if (score >= 0) heap_.emplace_back(q, score);
        }
        for (int i = static_cast<int>(heap_.size()) / 2 - 1; i >= 0; --i)
            siftDown(i);
    }

    void push(const Question& q, const string& today) {
        heap_.emplace_back(q, q.getPriorityScore(today));
        siftUp(static_cast<int>(heap_.size()) - 1);
    }

    HeapEntry pop() {
        if (heap_.empty()) throw runtime_error("RevisionHeap::pop() — empty!");
        HeapEntry top = heap_[0];
        heap_[0] = heap_.back();
        heap_.pop_back();
        if (!heap_.empty()) siftDown(0);
        return top;
    }

    const HeapEntry& top() const {
        if (heap_.empty()) throw runtime_error("RevisionHeap::top() — empty!");
        return heap_[0];
    }

    bool remove(const string& qid) {
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            if (heap_[i].question.id == qid) {
                heap_[i] = heap_.back();
                heap_.pop_back();
                if (i < static_cast<int>(heap_.size())) { siftDown(i); siftUp(i); }
                return true;
            }
        return false;
    }

    void updatePriority(const string& qid, const Question& updated, const string& today) {
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            if (heap_[i].question.id == qid) {
                heap_[i].question = updated;
                heap_[i].priorityScore = updated.getPriorityScore(today);
                siftDown(i); siftUp(i);
                return;
            }
        push(updated, today);
    }

    // Top-K most urgent — O(k log n)
    vector<HeapEntry> topK(int k) {
        vector<HeapEntry> result, backup;
        int cnt = min(k, static_cast<int>(heap_.size()));
        for (int i = 0; i < cnt; ++i) {
            HeapEntry e = pop();
            result.push_back(e);
            backup.push_back(e);
        }
        for (auto& e : backup) heap_.push_back(e);
        for (int i = static_cast<int>(heap_.size()) / 2 - 1; i >= 0; --i)
            siftDown(i);
        return result;
    }

    bool empty() const { return heap_.empty(); }
    int  size()  const { return static_cast<int>(heap_.size()); }

    bool isValidHeap() const {
        int n = static_cast<int>(heap_.size());
        for (int i = 0; i < n; ++i) {
            int l = leftChild(i), r = rightChild(i);
            if (l < n && heap_[l] < heap_[i]) return false;
            if (r < n && heap_[r] < heap_[i]) return false;
        }
        return true;
    }

    void print() const {
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║     REVISION PRIORITY QUEUE (Min-Heap)   ║\n"
             << "╠══════════════════════════════════════════╣\n";
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            cout << "║ [" << i << "] Score: "
                 << fixed << setprecision(2) << heap_[i].priorityScore
                 << " | " << heap_[i].question.name
                 << " (" << difficultyToString(heap_[i].question.difficulty) << ")\n";
        cout << "╚══════════════════════════════════════════╝\n"
             << "Heap valid: " << (isValidHeap() ? "YES" : "NO") << "\n";
    }
};

} // namespace dsa

#endif // REVISION_HEAP_H
